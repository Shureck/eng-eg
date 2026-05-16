import { useMemo } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Type3Q } from "../types";

function Row({
  id,
  text,
  ru,
  showRu,
  questionUiRussian,
  disabled,
}: {
  id: string;
  text: string;
  ru: string;
  showRu: boolean;
  questionUiRussian: boolean;
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const primary = questionUiRussian ? ru || text : text;
  const secondary =
    questionUiRussian ? text : showRu ? ru : "";
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex gap-2 items-stretch rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2"
    >
      <button
        type="button"
        className="min-w-[44px] px-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-lg"
        disabled={disabled}
        aria-label="Потянуть"
        {...attributes}
        {...listeners}
      >
        ⠿
      </button>
      <div className="flex-1">
        <div>
          <span className="font-bold">{id})</span> {primary}
        </div>
        {secondary ? (
          <div className="text-sm text-slate-600 dark:text-slate-400">{secondary}</div>
        ) : null}
      </div>
    </div>
  );
}

export function Type3View({
  q,
  order,
  setOrder,
  showRu,
  questionUiRussian,
  reveal,
  disabled,
  showHint,
}: {
  q: Type3Q;
  order: string[];
  setOrder: (o: string[]) => void;
  showRu: boolean;
  questionUiRussian: boolean;
  reveal: boolean;
  disabled: boolean;
  showHint: boolean;
}) {
  const byKey = useMemo(() => Object.fromEntries(q.words.map((w) => [w.key, w])), [q.words]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = order.indexOf(String(active.id));
    const newIndex = order.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    setOrder(arrayMove(order, oldIndex, newIndex));
  };

  const sentence = order
    .map((k) => {
      const w = byKey[k];
      if (!w) return "";
      return questionUiRussian ? w.text_ru || w.text : w.text;
    })
    .join(" ");
  const ok = order.every((k, i) => k === q.correct_order[i]);

  function move(ix: number, dir: -1 | 1) {
    const j = ix + dir;
    if (j < 0 || j >= order.length) return;
    const copy = [...order];
    [copy[ix], copy[j]] = [copy[j], copy[ix]];
    setOrder(copy);
  }

  const firstKey = q.correct_order[0];
  const firstW = firstKey ? byKey[firstKey] : undefined;
  const firstHint =
    firstW &&
    (questionUiRussian ? firstW.text_ru || firstW.text : firstW.text);

  return (
    <div className="space-y-4">
      <p className="text-lg">Расставьте фрагменты в правильном порядке</p>
      {showRu && !reveal && !questionUiRussian && (
        <p className="text-slate-600 dark:text-slate-400">{q.translation_ru}</p>
      )}
      {questionUiRussian && !reveal && (
        <p className="text-slate-600 dark:text-slate-400 text-sm">{q.translation_ru}</p>
      )}
      {showHint && !reveal && firstHint && (
        <p className="text-sm rounded-lg bg-amber-500/15 px-3 py-2">
          Подсказка: первый фрагмент — <strong>{firstHint}</strong>
        </p>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {order.map((key, ix) => (
              <div key={key} className="flex gap-1 items-center">
                <div className="flex-1">
                  <Row
                    id={key}
                    text={byKey[key].text}
                    ru={byKey[key].text_ru}
                    showRu={showRu}
                    questionUiRussian={questionUiRussian}
                    disabled={disabled}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    className="min-h-touch min-w-[44px] rounded border border-slate-300 dark:border-slate-600"
                    disabled={disabled || ix === 0}
                    onClick={() => move(ix, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="min-h-touch min-w-[44px] rounded border border-slate-300 dark:border-slate-600"
                    disabled={disabled || ix === order.length - 1}
                    onClick={() => move(ix, 1)}
                  >
                    ↓
                  </button>
                </div>
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {reveal && (
        <div className="rounded-xl bg-slate-100 dark:bg-slate-900 p-4 space-y-2">
          <p className="font-medium">{q.full_sentence}</p>
          <p className="text-slate-700 dark:text-slate-300">{q.translation_ru}</p>
          <p className="text-sm">{q.explanation_ru}</p>
        </div>
      )}
      {!reveal && (
        <p className={`text-sm font-medium ${ok ? "text-emerald-600" : "text-slate-500"}`}>
          {ok ? "Порядок верный." : "Проверьте порядок и нажмите «Ответить»."}
        </p>
      )}
      {!reveal && (
        <p className="text-xs text-slate-500 dark:text-slate-400 break-words">Сборка: {sentence}</p>
      )}
    </div>
  );
}

export function gradeType3(q: Type3Q, order: string[]): boolean {
  return order.length === q.correct_order.length && order.every((k, i) => k === q.correct_order[i]);
}

export function initialOrder3(q: Type3Q): string[] {
  const keys = q.words.map((w) => w.key);
  for (let attempt = 0; attempt < 80; attempt++) {
    const copy = [...keys];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    const wrong = copy.some((k, i) => k !== q.correct_order[i]);
    if (wrong) return copy;
  }
  return [...keys].reverse();
}
