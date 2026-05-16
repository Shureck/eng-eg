import { BANK_EN } from "../data/bank";
import type { AnyQ } from "../types";
import { shuffle } from "./shuffle";

/** 28 + 4 + 3 как в ТЗ */
export function pickExamDeck(): AnyQ[] {
  const t1 = shuffle(BANK_EN.type1).slice(0, 28).map((data) => ({ kind: "t1" as const, data }));
  const t2 = shuffle(BANK_EN.type2).slice(0, 4).map((data) => ({ kind: "t2" as const, data }));
  const t3 = shuffle(BANK_EN.type3).slice(0, 3).map((data) => ({ kind: "t3" as const, data }));
  return shuffle([...t1, ...t2, ...t3]);
}
