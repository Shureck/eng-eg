import { useEffect, useMemo, useState } from "react";
import { pickExamDeck } from "../lib/exam";
import { Type1View } from "../components/Type1View";
import { Type2View, emptyMap2, gradeType2 } from "../components/Type2View";
import { Type3View, gradeType3, initialOrder3 } from "../components/Type3View";
import type { AnyQ } from "../types";
import { useProgress } from "../hooks/useProgress";
import { markHard, onWrong } from "../lib/srs";

const SEC = 35 * 60;

export default function Exam() {
  const { save, map, ready } = useProgress();
  const [deck] = useState<AnyQ[]>(() => pickExamDeck());
  const [phase, setPhase] = useState<"run" | "done">("run");
  const [i, setI] = useState(0);
  const [left, setLeft] = useState(SEC);
  const [results, setResults] = useState<boolean[]>(() => deck.map(() => false));

  useEffect(() => {
    if (phase !== "run") return;
    const t = window.setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (left === 0 && phase === "run") setPhase("done");
  }, [left, phase]);

  const cur = deck[i];
  const [pick, setPick] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [map2, setMap2] = useState<Record<string, number>>({});
  const [order3, setOrder3] = useState<string[]>([]);

  useEffect(() => {
    setPick(null);
    setRevealed(false);
    if (cur?.kind === "t2") setMap2(emptyMap2(cur.data));
    if (cur?.kind === "t3") setOrder3(initialOrder3(cur.data));
  }, [cur]);

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  async function registerWrongFor(q: AnyQ) {
    const key = q.kind === "t1" ? `t1-${q.data.id}` : q.kind === "t2" ? `t2-${q.data.id}` : `t3-${q.data.id}`;
    const row = map.get(key);
    if (!row) return;
    await save(onWrong(row, Date.now()));
  }

  function pushResult(ok: boolean) {
    setResults((rs) => {
      const cp = [...rs];
      cp[i] = ok;
      return cp;
    });
  }

  async function advance(ok: boolean) {
    const dq = deck[i];
    pushResult(ok);
    if (!ok && dq) await registerWrongFor(dq);
    if (i + 1 >= deck.length) setPhase("done");
    else setI((x) => x + 1);
  }

  const score = useMemo(() => results.filter(Boolean).length, [results]);

  if (!ready) return <p className="text-slate-500">Загрузка…</p>;

  if (phase === "done") {
    const pct = Math.round((score / deck.length) * 100);
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Итог пробного экзамена</h1>
        <p className="text-lg">
          Верно: <strong>{score}</strong> / {deck.length} ({pct}%)
        </p>
        <div className="space-y-4">
          {deck.map((q, ix) => (
            <div key={ix} className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
              <div className="flex justify-between gap-2 flex-wrap font-medium">
                <span>
                  {ix + 1}. {q.kind.toUpperCase()}
                </span>
                <span className={results[ix] ? "text-emerald-600" : "text-red-600"}>{results[ix] ? "Верно" : "Ошибка"}</span>
              </div>
              {q.kind === "t1" && (
                <div className="text-sm space-y-2">
                  <p>{q.data.question}</p>
                  <p>
                    Ответ: <strong>{q.data.correct}</strong>{" "}
                    {q.data.options.find((o) => o.key === q.data.correct)?.text}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400">{q.data.translation_ru}</p>
                  <p className="text-xs">{q.data.explanation_ru}</p>
                </div>
              )}
              {q.kind === "t2" && (
                <div className="text-sm space-y-2">
                  <p>{q.data.translation_ru}</p>
                  <ul className="list-disc pl-5">
                    {q.data.terms.map((t) => (
                      <li key={t}>
                        <strong>{t}</strong> → {q.data.correct[t]}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {q.kind === "t3" && (
                <div className="text-sm space-y-2">
                  <p className="font-medium">{q.data.full_sentence}</p>
                  <p className="text-slate-600 dark:text-slate-400">{q.data.translation_ru}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          className="min-h-touch px-4 rounded-xl bg-sky-600 text-white"
          onClick={async () => {
            for (let ix = 0; ix < deck.length; ix++) {
              if (results[ix]) continue;
              const q = deck[ix];
              const key = q.kind === "t1" ? `t1-${q.data.id}` : q.kind === "t2" ? `t2-${q.data.id}` : `t3-${q.data.id}`;
              const row = map.get(key);
              if (row) await save(markHard({ ...row, qid: key }));
            }
            alert("Ошибочные отмечены как «сложные».");
          }}
        >
          Добавить ошибки в слабые места
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between flex-wrap gap-2 items-center">
        <h1 className="text-xl font-bold">Пробный экзамен</h1>
        <div className={`font-mono text-xl ${left < 120 ? "text-red-600" : ""}`}>
          {mm}:{ss}
        </div>
      </div>
      <p className="text-sm text-slate-500">
        Вопрос {i + 1} / {deck.length} · без переводов
      </p>

      {cur?.kind === "t1" && (
        <>
          <Type1View q={cur.data} mode="exam" showRu={false} questionUiRussian={false} pick={pick} onPick={setPick} reveal={revealed} />
          {!revealed && (
            <button type="button" className="min-h-touch px-4 rounded-xl bg-sky-600 text-white font-medium" disabled={!pick} onClick={() => setRevealed(true)}>
              Ответить
            </button>
          )}
          {revealed && (
            <button
              type="button"
              className="min-h-touch px-4 rounded-xl bg-emerald-600 text-white font-medium"
              onClick={() => void advance(pick === cur.data.correct)}
            >
              Следующий
            </button>
          )}
        </>
      )}

      {cur?.kind === "t2" && (
        <>
          <Type2View
            q={cur.data}
            map={map2}
            setMap={setMap2}
            showRu={false}
            questionUiRussian={false}
            reveal={revealed}
            disabled={revealed}
          />
          {!revealed && (
            <button type="button" className="min-h-touch px-4 rounded-xl bg-sky-600 text-white font-medium" onClick={() => setRevealed(true)}>
              Ответить
            </button>
          )}
          {revealed && (
            <button
              type="button"
              className="min-h-touch px-4 rounded-xl bg-emerald-600 text-white font-medium"
              onClick={() => void advance(gradeType2(cur.data, map2))}
            >
              Следующий
            </button>
          )}
        </>
      )}

      {cur?.kind === "t3" && (
        <>
          <Type3View
            q={cur.data}
            order={order3}
            setOrder={setOrder3}
            showRu={false}
            questionUiRussian={false}
            reveal={revealed}
            disabled={revealed}
            showHint={false}
          />
          {!revealed && (
            <button type="button" className="min-h-touch px-4 rounded-xl bg-sky-600 text-white font-medium" onClick={() => setRevealed(true)}>
              Ответить
            </button>
          )}
          {revealed && (
            <button
              type="button"
              className="min-h-touch px-4 rounded-xl bg-emerald-600 text-white font-medium"
              onClick={() => void advance(gradeType3(cur.data, order3))}
            >
              Следующий
            </button>
          )}
        </>
      )}
    </div>
  );
}
