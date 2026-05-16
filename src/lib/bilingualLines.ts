/** Русская строка под английской: только если есть текст и он отличается от EN */
export function ruBelowEn(en: string, ru: string | undefined | null): string | null {
  const e = en.trim();
  const r = (ru ?? "").trim();
  if (!r || r === e) return null;
  return r;
}

/** Убрать служебный префикс из EN-формулировки вопроса type1 */
export function stripQuestionIntro(en: string): string {
  return en
    .replace(/^Choose the correct variant\.\s*/i, "")
    .replace(/^Fill in the gap with the most appropriate word combination\.\s*/i, "")
    .trim();
}

const T2_INSTRUCTION_EN = "Match each English term with its definition.";
const T3_INSTRUCTION_EN = "Put the word fragments in the correct order to form a proper English sentence.";

export function type2InstructionEn(): string {
  return T2_INSTRUCTION_EN;
}

export function type3InstructionEn(): string {
  return T3_INSTRUCTION_EN;
}
