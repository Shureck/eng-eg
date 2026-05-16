export interface Type1Q {
  id: number;
  question: string;
  options: { key: string; text: string }[];
  correct: string;
  hasNegation: boolean;
  tags: string[];
  translation_ru: string;
  options_ru: string[];
  explanation_ru: string;
  keyword_hint: string;
}

export interface Type2Q {
  id: number;
  terms: string[];
  definitions: string[];
  correct: Record<string, string>;
  tags: string[];
  terms_ru: string[];
  definitions_ru: string[];
  translation_ru: string;
  explanation_ru: string;
  keyword_hint: string;
}

export interface Type3Word {
  key: string;
  text: string;
  text_ru: string;
}

export interface Type3Q {
  id: number;
  words: Type3Word[];
  correct_order: string[];
  full_sentence: string;
  tags: string[];
  translation_ru: string;
  explanation_ru: string;
  keyword_hint: string;
}

export interface QuestionBank {
  type1: Type1Q[];
  type2: Type2Q[];
  type3: Type3Q[];
}

export type AnyQ =
  | { kind: "t1"; data: Type1Q }
  | { kind: "t2"; data: Type2Q }
  | { kind: "t3"; data: Type3Q };

export interface ProgressRow {
  qid: string;
  box: number;
  lastShown: number;
  correctStreak: number;
  totalAttempts: number;
  totalCorrect: number;
  wrongEver: boolean;
  hardFlag: boolean;
}
