import { useState } from "react";
import { learnKeyOrder, getQuestion } from "../data/bank";
import { useQuestionLang } from "../context/QuestionLangContext";
import { useProgress } from "../hooks/useProgress";
import { defaultProgress } from "../lib/db";
import { Type1View } from "../components/Type1View";
import { Type2View, correctMap2 } from "../components/Type2View";
import { Type3View } from "../components/Type3View";
import { markHard } from "../lib/srs";

export default function Learn() {
  const { bank, questionUiRussian } = useQuestionLang();
  const keys = learnKeyOrder(bank);
  const [idx, setIdx] = useState(0);
  const { map, ready, save } = useProgress();
  const key = keys[idx];
  const aq = key ? getQuestion(key, bank) : null;
  const row = key ? map.get(key) ?? defaultProgress(key) : null;

  if (!ready) return <p className="text-slate-500">Загрузка…</p>;

  async function next(extra?: Partial<typeof row>) {
    if (!key || !row) return;
    const now = Date.now();
    await save({
      ...row,
      ...extra,
      qid: key,
      lastShown: now,
      box: Math.max(1, row.box || 1),
    });
    setIdx((i) => Math.min(i + 1, keys.length - 1));
  }

  async function onHard() {
    if (!key || !row) return;
    await save(markHard({ ...row, qid: key }));
    setIdx((i) => Math.min(i + 1, keys.length - 1));
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-2 flex-wrap">
        <h1 className="text-xl font-bold">Обучение</h1>
        <span className="text-sm text-slate-500">
          {idx + 1} / {keys.length}
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
        <div
          className="h-full bg-sky-500 transition-all"
          style={{ width: `${((idx + 1) / keys.length) * 100}%` }}
        />
      </div>

      {!aq && <p>Нет вопросов</p>}
      {aq && aq.kind === "t1" && (
        <>
          <Type1View
            q={aq.data}
            mode="learn"
            showRu={!questionUiRussian}
            questionUiRussian={questionUiRussian}
            pick={null}
            reveal
          />
          <div className="flex flex-wrap gap-2">
            <button type="button" className="min-h-touch px-4 rounded-xl bg-emerald-600 text-white font-medium" onClick={() => next()}>
              Понял
            </button>
            <button type="button" className="min-h-touch px-4 rounded-xl border border-amber-500 text-amber-800 dark:text-amber-300 font-medium" onClick={() => onHard()}>
              Сложно
            </button>
          </div>
        </>
      )}
      {aq && aq.kind === "t2" && (
        <>
          <Type2View
            q={aq.data}
            map={correctMap2(aq.data)}
            setMap={() => {}}
            showRu={!questionUiRussian}
            questionUiRussian={questionUiRussian}
            reveal
            disabled
          />
          <div className="flex flex-wrap gap-2">
            <button type="button" className="min-h-touch px-4 rounded-xl bg-emerald-600 text-white font-medium" onClick={() => next()}>
              Понял
            </button>
            <button type="button" className="min-h-touch px-4 rounded-xl border border-amber-500 font-medium" onClick={() => onHard()}>
              Сложно
            </button>
          </div>
        </>
      )}
      {aq && aq.kind === "t3" && (
        <>
          <Type3View
            q={aq.data}
            order={aq.data.correct_order}
            setOrder={() => {}}
            showRu={!questionUiRussian}
            questionUiRussian={questionUiRussian}
            reveal
            disabled
            showHint={false}
          />
          <div className="flex flex-wrap gap-2">
            <button type="button" className="min-h-touch px-4 rounded-xl bg-emerald-600 text-white font-medium" onClick={() => next()}>
              Понял
            </button>
            <button type="button" className="min-h-touch px-4 rounded-xl border border-amber-500 font-medium" onClick={() => onHard()}>
              Сложно
            </button>
          </div>
        </>
      )}

      <div className="flex gap-2 flex-wrap">
        <button type="button" className="min-h-touch px-3 rounded-lg border" onClick={() => setIdx((i) => Math.max(0, i - 1))}>
          ← Назад
        </button>
        <button
          type="button"
          className="min-h-touch px-3 rounded-lg border"
          onClick={() => setIdx((i) => Math.min(keys.length - 1, i + 1))}
        >
          Вперёд →
        </button>
      </div>
    </div>
  );
}
