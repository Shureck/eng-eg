import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { BANK_EN, mergeQuestionBank } from "../data/bank";
import type { QuestionBank } from "../types";

const LS_KEY = "angl-en-question-ui-ru";

type Ctx = {
  /** Включить русские переводы из questions.ru.json (показываются мелко под английским текстом) */
  questionUiRussian: boolean;
  setQuestionUiRussian: (v: boolean) => void;
  bank: QuestionBank;
};

const QuestionLangContext = createContext<Ctx | null>(null);

export function QuestionLangProvider({ children }: { children: ReactNode }) {
  const [questionUiRussian, setQuestionUiRussian] = useState(() => {
    try {
      return localStorage.getItem(LS_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, questionUiRussian ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [questionUiRussian]);

  const bank = useMemo(() => mergeQuestionBank(questionUiRussian), [questionUiRussian]);

  const value = useMemo(
    () => ({ questionUiRussian, setQuestionUiRussian, bank }),
    [questionUiRussian, bank],
  );

  return <QuestionLangContext.Provider value={value}>{children}</QuestionLangContext.Provider>;
}

export function useQuestionLang(): Ctx {
  const v = useContext(QuestionLangContext);
  if (!v) {
    return {
      questionUiRussian: false,
      setQuestionUiRussian: () => {},
      bank: BANK_EN,
    };
  }
  return v;
}
