import rawEn from "./questions.json";
import rawRu from "./questions.ru.json";
import type { AnyQ, QuestionBank, Type1Q, Type2Q, Type3Q } from "../types";

export const BANK_EN = rawEn as unknown as QuestionBank;
export const BANK_RU_OVERLAY = rawRu as unknown as QuestionBank;

/** Совместимость: канонический английский банк */
export const BANK = BANK_EN;

/** Режим только EN: убираем русские подстрочники (они могут быть встроены в questions.json). */
function type1ForEnglishUi(q: Type1Q): Type1Q {
  const correctText = q.options.find((o) => o.key === q.correct)?.text ?? "";
  return {
    ...q,
    translation_ru: "",
    options_ru: q.options.map((o) => o.text),
    explanation_ru: correctText ? `Correct answer — option ${q.correct}: «${correctText}».` : "",
  };
}

function type2ForEnglishUi(q: Type2Q): Type2Q {
  return {
    ...q,
    terms_ru: [...q.terms],
    definitions_ru: [...q.definitions],
    translation_ru: "",
    explanation_ru: "",
  };
}

function type3ForEnglishUi(q: Type3Q): Type3Q {
  return {
    ...q,
    words: q.words.map((w) => ({ ...w, text_ru: w.text })),
    translation_ru: "",
    explanation_ru: "",
  };
}

export function mergeQuestionBank(useRussianUi: boolean): QuestionBank {
  if (!useRussianUi) {
    return {
      type1: BANK_EN.type1.map(type1ForEnglishUi),
      type2: BANK_EN.type2.map(type2ForEnglishUi),
      type3: BANK_EN.type3.map(type3ForEnglishUi),
    };
  }
  const R = BANK_RU_OVERLAY;
  return {
    type1: BANK_EN.type1.map((q) => {
      const r = R.type1.find((x) => x.id === q.id);
      return r
        ? { ...q, translation_ru: r.translation_ru, options_ru: r.options_ru, explanation_ru: r.explanation_ru }
        : q;
    }),
    type2: BANK_EN.type2.map((q) => {
      const r = R.type2.find((x) => x.id === q.id);
      return r
        ? {
            ...q,
            terms_ru: r.terms_ru,
            definitions_ru: r.definitions_ru,
            translation_ru: r.translation_ru,
            explanation_ru: r.explanation_ru,
          }
        : q;
    }),
    type3: BANK_EN.type3.map((q) => {
      const r = R.type3.find((x) => x.id === q.id);
      if (!r) return q;
      const words = q.words.map((w) => {
        const rw = r.words.find((x) => x.key === w.key);
        return rw ? { ...w, text_ru: rw.text_ru } : w;
      });
      return {
        ...q,
        words,
        translation_ru: r.translation_ru,
        explanation_ru: r.explanation_ru,
      };
    }),
  };
}

export function allKeys(bank: QuestionBank = BANK_EN): string[] {
  const k: string[] = [];
  for (const q of bank.type1) k.push(`t1-${q.id}`);
  for (const q of bank.type2) k.push(`t2-${q.id}`);
  for (const q of bank.type3) k.push(`t3-${q.id}`);
  return k;
}

/** Ключи одного типа задания (t1 / t2 / t3) из общего списка `t1-3`, … */
export function keysForTaskKind(allKeysList: string[], kind: "t1" | "t2" | "t3"): string[] {
  const prefix = `${kind}-`;
  return allKeysList.filter((k) => k.startsWith(prefix));
}

/** Порядок «Обучение»: все type1, затем type2, затем type3 */
export function learnKeyOrder(bank: QuestionBank = BANK_EN): string[] {
  return allKeys(bank);
}

export function parseKey(key: string): { kind: "t1" | "t2" | "t3"; id: number } | null {
  const m = key.match(/^t([123])-(\d+)$/);
  if (!m) return null;
  return { kind: (`t${m[1]}` as "t1" | "t2" | "t3"), id: Number(m[2]) };
}

export function getQuestion(key: string, bank: QuestionBank = BANK_EN): AnyQ | null {
  const p = parseKey(key);
  if (!p) return null;
  if (p.kind === "t1") {
    const data = bank.type1.find((x) => x.id === p.id);
    return data ? { kind: "t1", data } : null;
  }
  if (p.kind === "t2") {
    const data = bank.type2.find((x) => x.id === p.id);
    return data ? { kind: "t2", data } : null;
  }
  const data = bank.type3.find((x) => x.id === p.id);
  return data ? { kind: "t3", data } : null;
}
