import { useLayoutEffect, useMemo } from "react";
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
import { keywordHintOrFallback, ruBelowEn, type3InstructionEn } from "../lib/bilingualLines";

const INST_EN = type3InstructionEn();

/** Порядок из родителя совпадает с ключами текущего вопроса (перестановка без лишних/пропущенных ключей). */
export function isValidType3Order(order: string[], q: Type3Q): boolean {
  const expected = q.words.map((w) => w.key);
  if (order.length !== expected.length) return false;
  const bag = new Map<string, number>();
  for (const k of expected) bag.set(k, (bag.get(k) ?? 0) + 1);
  for (const k of order) {
    const n = bag.get(k);
    if (!n) return false;
    bag.set(k, n - 1);
  }
  return [...bag.values()].every((n) => n === 0);
}

function Row({
  id,
  text,
  ru,
  disabled,
  compact,
}: {
  id: string;
  text: string;
  ru: string;
  disabled: boolean;
  compact?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const secondary = ruBelowEn(text, ru);
  const dense = !!compact;
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-stretch border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 ${
        dense ? "gap-1.5 rounded-lg p-1.5" : "gap-2 rounded-xl p-2"
      }`}
    >
      <button
        type="button"
        className={`min-w-[44px] px-2 rounded-lg bg-slate-100 dark:bg-slate-800 ${dense ? "text-base" : "text-lg"}`}
        disabled={disabled}
        aria-label="Потянуть"
        {...attributes}
        {...listeners}
      >
        ⠿
      </button>
      <div className="flex-1 min-w-0">
        <div
          className={`text-slate-900 dark:text-slate-100 font-medium ${dense ? "text-sm md:text-base" : "text-base md:text-lg"}`}
        >
          <span className="font-bold">{id})</span> {text}
        </div>
        {secondary ? (
          <div className={`text-slate-600 dark:text-slate-400 mt-0.5 ${dense ? "text-xs" : "text-sm"}`}>{secondary}</div>
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
  compact,
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
  compact?: boolean;
}) {
  const byKey = useMemo(() => Object.fromEntries(q.words.map((w) => [w.key, w])), [q.words]);

  /** Стабильный начальный порядок для нового q.id; если родитель ещё держит ключи прошлого вопроса — не падаем на первом кадре. */
  const fallbackOrder = useMemo(() => initialOrder3(q), [q.id]);
  const displayOrder = isValidType3Order(order, q) ? order : fallbackOrder;

  useLayoutEffect(() => {
    if (!isValidType3Order(order, q)) setOrder(fallbackOrder);
  }, [q.id, order, q, fallbackOrder, setOrder]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = displayOrder.indexOf(String(active.id));
    const newIndex = displayOrder.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    setOrder(arrayMove(displayOrder, oldIndex, newIndex));
  };

  const sentence = displayOrder
    .map((k) => {
      const w = byKey[k];
      return w ? w.text : "";
    })
    .join(" ");
  const ok = displayOrder.every((k, i) => k === q.correct_order[i]);

  function move(ix: number, dir: -1 | 1) {
    const j = ix + dir;
    if (j < 0 || j >= displayOrder.length) return;
    const copy = [...displayOrder];
    [copy[ix], copy[j]] = [copy[j], copy[ix]];
    setOrder(copy);
  }

  const firstKey = q.correct_order[0];
  const firstW = firstKey ? byKey[firstKey] : undefined;

  const useKeywordOnly = promptVariant === "keyword";
  const keywordOrFallback = keywordHintOrFallback(q.keyword_hint, q.full_sentence || INST_EN);

  const dense = !!compact;

  return (
    <div className={dense ? "space-y-2" : "space-y-4"}>
      {useKeywordOnly ? (
        <>
          <p
            className={`leading-snug font-semibold whitespace-pre-wrap text-slate-900 dark:text-slate-100 ${
              dense ? "text-lg" : "text-xl"
            }`}
          >
            {keywordOrFallback}
          </p>
          {ruBelowEn(keywordOrFallback, q.translation_ru) && (
            <p
              className={`text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-snug border-l-4 border-sky-500/70 ${
                dense ? "text-xs pl-2" : "text-sm pl-3"
              }`}
            >
              {ruBelowEn(keywordOrFallback, q.translation_ru)}
            </p>
          )}
          <p className="text-xs text-slate-500 dark:text-slate-400">{INST_EN}</p>
        </>
      ) : (
        <>
          <p className={`font-medium text-slate-900 dark:text-slate-100 ${dense ? "text-base md:text-lg" : "text-lg md:text-xl"}`}>
            {INST_EN}
          </p>
          {ruBelowEn(INST_EN, q.translation_ru) && (
            <p
              className={`text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-snug border-l-4 border-sky-500/70 ${
                dense ? "text-xs pl-2" : "text-sm pl-3"
              }`}
            >
              {ruBelowEn(INST_EN, q.translation_ru)}
            </p>
          )}
        </>
      )}
      {showHint && !reveal && firstW && (
        <p className={`rounded-lg bg-amber-500/15 space-y-1 ${dense ? "text-xs px-2 py-1.5" : "text-sm px-3 py-2"}`}>
          <span className="block text-slate-600 dark:text-slate-400">Подсказка: первый фрагмент —</span>
          <strong className={`text-slate-900 dark:text-slate-100 ${dense ? "text-sm" : "text-base"}`}>{firstW.text}</strong>
          {ruBelowEn(firstW.text, firstW.text_ru) && (
            <span className="block text-xs text-slate-600 dark:text-slate-400">{ruBelowEn(firstW.text, firstW.text_ru)}</span>
          )}
        </p>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={displayOrder} strategy={verticalListSortingStrategy}>
          <div className={dense ? "space-y-1.5" : "space-y-2"}>
            {displayOrder.map((key, ix) => (
              <div key={key} className={`flex items-center ${dense ? "gap-0.5" : "gap-1"}`}>
                <div className="flex-1 min-w-0">
                  <Row id={key} text={byKey[key]!.text} ru={byKey[key]!.text_ru} disabled={disabled} compact={dense} />
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
                    disabled={disabled || ix === displayOrder.length - 1}
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
        <div className={`rounded-xl bg-slate-100 dark:bg-slate-900 space-y-2 ${dense ? "p-3" : "p-4"}`}>
          <p className={`font-medium text-slate-900 dark:text-slate-100 ${dense ? "text-base" : "text-lg"}`}>{q.full_sentence}</p>
          {ruBelowEn(q.full_sentence, q.translation_ru) && (
            <p className={`text-slate-600 dark:text-slate-300 ${dense ? "text-xs" : "text-sm"}`}>
              {ruBelowEn(q.full_sentence, q.translation_ru)}
            </p>
          )}
          <p className={dense ? "text-xs" : "text-sm"}>{q.explanation_ru}</p>
        </div>
      )}
      {!reveal && (
        <p className={`font-medium ${dense ? "text-xs" : "text-sm"} ${ok ? "text-emerald-600" : "text-slate-500"}`}>
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
