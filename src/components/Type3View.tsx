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
import { ruBelowEn, type3InstructionEn } from "../lib/bilingualLines";

const INST_EN = type3InstructionEn();

function Row({
  id,
  text,
  ru,
  disabled,
}: {
  id: string;
  text: string;
  ru: string;
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const secondary = ruBelowEn(text, ru);
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
        <div className="text-base md:text-lg text-slate-900 dark:text-slate-100 font-medium">
          <span className="font-bold">{id})</span> {text}
        </div>
        {secondary ? (
          <div className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{secondary}</div>
        ) : null}
      </div>
    </div>
  );
}

export function Type3View({
  q,
  order,
  setOrder,
  showRu: _showRu,
  questionUiRussian: _questionUiRussian,
  reveal,
  disabled,
  showHint,
  promptVariant = "full",
}: {
  q: Type3Q;
  order: string[];
  setOrder: (o: string[]) => void;
  showRu: boolean;
  questionUiRussian: boolean;
  reveal: boolean;
  disabled: boolean;
  showHint: boolean;
  promptVariant?: "full" | "keyword";
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
      return w ? w.text : "";
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

  const useKeywordOnly = promptVariant === "keyword";
  const keywordOrFallback =
    q.keyword_hint?.trim() || q.full_sentence || INST_EN;

  return (
    <div className="space-y-4">
      {useKeywordOnly ? (
        <>
          <p className="text-xl leading-snug font-semibold whitespace-pre-wrap text-slate-900 dark:text-slate-100">
            {keywordOrFallback}
          </p>
          {ruBelowEn(keywordOrFallback, q.translation_ru) && (
            <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-snug border-l-4 border-sky-500/70 pl-3">
              {ruBelowEn(keywordOrFallback, q.translation_ru)}
            </p>
          )}
          <p className="text-xs text-slate-500 dark:text-slate-400">{INST_EN}</p>
        </>
      ) : (
        <>
          <p className="text-lg md:text-xl font-medium text-slate-900 dark:text-slate-100">{INST_EN}</p>
          {ruBelowEn(INST_EN, q.translation_ru) && (
            <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-snug border-l-4 border-sky-500/70 pl-3">
              {ruBelowEn(INST_EN, q.translation_ru)}
            </p>
          )}
        </>
      )}
      {showHint && !reveal && firstW && (
        <p className="text-sm rounded-lg bg-amber-500/15 px-3 py-2 space-y-1">
          <span className="block text-slate-600 dark:text-slate-400">Подсказка: первый фрагмент —</span>
          <strong className="text-base text-slate-900 dark:text-slate-100">{firstW.text}</strong>
          {ruBelowEn(firstW.text, firstW.text_ru) && (
            <span className="block text-xs text-slate-600 dark:text-slate-400">{ruBelowEn(firstW.text, firstW.text_ru)}</span>
          )}
        </p>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {order.map((key, ix) => (
              <div key={key} className="flex gap-1 items-center">
                <div className="flex-1">
                  <Row id={key} text={byKey[key].text} ru={byKey[key].text_ru} disabled={disabled} />
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
          <p className="font-medium text-lg text-slate-900 dark:text-slate-100">{q.full_sentence}</p>
          {ruBelowEn(q.full_sentence, q.translation_ru) && (
            <p className="text-sm text-slate-600 dark:text-slate-300">{ruBelowEn(q.full_sentence, q.translation_ru)}</p>
          )}
          <p className="text-sm">{q.explanation_ru}</p>
        </div>
      )}
      {!reveal && (
        <p className={`text-sm font-medium ${ok ? "text-emerald-600" : "text-slate-500"}`}>
          {ok ? "Порядок верный." : "Проверьте порядок и нажмите «Ответить»."}
        </p>
      )}
      {!reveal && (
        <p className="text-xs text-slate-500 dark:text-slate-400 break-words">
          <span className="font-medium text-slate-600 dark:text-slate-400">Preview: </span>
          {sentence}
        </p>
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
