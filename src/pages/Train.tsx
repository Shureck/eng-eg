import { useCallback, useEffect, useMemo, useState } from "react";
import { allKeys, BANK_EN, getQuestion } from "../data/bank";
import { useQuestionLang } from "../context/QuestionLangContext";
import { useProgress } from "../hooks/useProgress";
import { defaultProgress } from "../lib/db";
import {
  clearSrsQueueSnapshot,
  loadSrsQueueSnapshot,
  saveSrsQueueSnapshot,
} from "../lib/srsQueueStorage";
import { Type1View } from "../components/Type1View";
import { CheatMnemonicLine, QuestionKeyOnlyLine } from "../components/CheatMnemonicLine";
import { CardWithActionsRail } from "../components/CardWithActionsRail";
import { Type2View, emptyMap2, gradeType2 } from "../components/Type2View";
import { Type3View, gradeType3, initialOrder3 } from "../components/Type3View";
import { getCheatT1, getCheatT2, getCheatT3 } from "../data/lightningCheatSheet";
import { useCheatMnemonicVisible } from "../lib/cheatVisibility";
import { isDue, markHard, onCorrect, onWrong } from "../lib/srs";
import { shuffle } from "../lib/shuffle";

export default function Train() {
  const { bank, questionUiRussian } = useQuestionLang();
  const { map, ready, save } = useProgress();
  const [cheatVisible, setCheatVisible] = useCheatMnemonicVisible();
  const [queue, setQueue] = useState<string[]>([]);
  const [qi, setQi] = useState(0);
  /** Не трогаем localStorage, пока не решили: восстановить сессию или собрать очередь заново */
  const [srsBootstrapped, setSrsBootstrapped] = useState(false);

  const rebuild = useCallback(() => {
    const now = Date.now();
    const due = shuffle(allKeys(BANK_EN).filter((k) => isDue(map.get(k) ?? defaultProgress(k), now)));
    setQueue(due);
    setQi(0);
  }, [map]);

  /** После загрузки прогресса: восстановить сохранённую очередь или собрать новую */
  useEffect(() => {
    if (!ready || srsBootstrapped) return;
    const snap = loadSrsQueueSnapshot();
    if (snap) {
      setQueue(snap.queue);
      setQi(snap.qi);
    } else {
      rebuild();
    }
    setSrsBootstrapped(true);
  }, [ready, srsBootstrapped, rebuild]);

  /** Сохранять порядок и позицию между перезагрузками страницы */
  useEffect(() => {
    if (!ready || !srsBootstrapped) return;
    if (queue.length === 0) {
      clearSrsQueueSnapshot();
      return;
    }
    saveSrsQueueSnapshot({ queue, qi });
  }, [ready, srsBootstrapped, queue, qi]);

  const key = queue[qi];
  const aq = useMemo(() => (key ? getQuestion(key, bank) : null), [key, bank]);

  const [pick, setPick] = useState<string | null>(null);
  const [reveal, setReveal] = useState(false);
  const [map2, setMap2] = useState<Record<string, number>>({});
  const [order3, setOrder3] = useState<string[]>([]);
  const [hint3, setHint3] = useState(false);

  useEffect(() => {
    setPick(null);
    setReveal(false);
    setHint3(false);
    if (aq?.kind === "t2") setMap2(emptyMap2(aq.data));
    if (aq?.kind === "t3") setOrder3(initialOrder3(aq.data));
  }, [aq]);

  async function applySrs(correct: boolean) {
    if (!key) return;
    const row = map.get(key) ?? defaultProgress(key);
    const now = Date.now();
    await save(correct ? onCorrect(row, now) : onWrong(row, now));
    if (qi + 1 >= queue.length) rebuild();
    else setQi((x) => x + 1);
  }

  function submitT1() {
    if (!aq || aq.kind !== "t1") return;
    setReveal(true);
  }

  function submitT2() {
    setReveal(true);
  }

  function submitT3() {
    setReveal(true);
  }

  if (!ready) return <p className="text-slate-500">Загрузка…</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between flex-wrap gap-2 items-center">
        <h1 className="text-xl font-bold">SRS-тренировка</h1>
        <div className="flex flex-wrap gap-2 justify-end">
          <button
            type="button"
            className="min-h-touch px-3 rounded-lg border text-sm"
            aria-pressed={cheatVisible}
            onClick={() => setCheatVisible(!cheatVisible)}
          >
            Шпаргалка: {cheatVisible ? "вкл" : "выкл"}
          </button>
          <button type="button" className="min-h-touch px-3 rounded-lg border text-sm" onClick={rebuild}>
            Новая очередь
          </button>
        </div>
      </div>
      <p className="text-sm text-slate-500">
        Карточка {qi + 1} из {queue.length || "…"} (по расписанию коробок). Очередь и номер карточки сохраняются при
        обновлении страницы; «Новая очередь» собирает заново.
      </p>

      {!key && <p className="text-amber-700 dark:text-amber-400">На сегодня всё повторено — загляните позже или нажмите «Новая очередь».</p>}

      {aq?.kind === "t1" && (() => {
        const cheatPair = getCheatT1(aq.data.id) ?? null;
        return (
        <CardWithActionsRail
          actions={
            <>
              {!reveal && (
                <button
                  type="button"
                  className="min-h-touch w-full px-4 rounded-xl bg-sky-600 text-white font-medium"
                  disabled={!pick}
                  onClick={submitT1}
                >
                  Проверить
                </button>
              )}
              {reveal && (
                <>
                  <button
                    type="button"
                    className="min-h-touch w-full px-4 rounded-xl bg-emerald-600 text-white font-medium"
                    onClick={() => void applySrs(pick === aq.data.correct)}
                  >
                    Дальше (учесть ответ)
                  </button>
                  <button
                    type="button"
                    className="min-h-touch w-full px-4 rounded-xl border border-amber-500 font-medium"
                    onClick={async () => {
                      if (!key || aq?.kind !== "t1") return;
                      await save(markHard({ ...(map.get(key) ?? defaultProgress(key)), qid: key }));
                      void applySrs(pick === aq.data.correct);
                    }}
                  >
                    Сложно → в слабые
                  </button>
                </>
              )}
            </>
          }
        >
          <Type1View
            q={aq.data}
            mode="train"
            showRu={!questionUiRussian}
            questionUiRussian={questionUiRussian}
            cheatMnemonic={cheatVisible ? cheatPair : null}
            questionKeyOnly={!cheatVisible ? cheatPair?.hook?.trim() || null : null}
            promptVariant="keyword"
            pick={pick}
            onPick={setPick}
            reveal={reveal}
          />
        </CardWithActionsRail>
        );
      })()}

      {aq?.kind === "t2" && (
        <CardWithActionsRail
          actions={
            <>
              {!reveal && (
                <button type="button" className="min-h-touch w-full px-4 rounded-xl bg-sky-600 text-white font-medium" onClick={submitT2}>
                  Проверить
                </button>
              )}
              {reveal && (
                <button
                  type="button"
                  className="min-h-touch w-full px-4 rounded-xl bg-emerald-600 text-white font-medium"
                  onClick={() => void applySrs(gradeType2(aq.data, map2))}
                >
                  Дальше
                </button>
              )}
            </>
          }
        >
          {cheatVisible &&
            (() => {
              const ch = getCheatT2(aq.data.id);
              return ch ? <CheatMnemonicLine dense className="mb-2" hook={ch.hook} answerKey={ch.answerKey} /> : null;
            })()}
          {!cheatVisible &&
            (() => {
              const ch = getCheatT2(aq.data.id);
              return ch?.hook?.trim() ? <QuestionKeyOnlyLine dense hook={ch.hook} className="mb-2" /> : null;
            })()}
          <Type2View
            q={aq.data}
            map={map2}
            setMap={setMap2}
            showRu={!questionUiRussian}
            questionUiRussian={questionUiRussian}
            reveal={reveal}
            disabled={reveal}
            promptVariant="keyword"
          />
        </CardWithActionsRail>
      )}

      {aq?.kind === "t3" && (
        <CardWithActionsRail
          actions={
            <>
              {!reveal && (
                <button
                  type="button"
                  className="min-h-touch w-full px-3 rounded-lg border text-sm"
                  onClick={() => setHint3(true)}
                >
                  Подсказка (первое слово)
                </button>
              )}
              {!reveal && (
                <button type="button" className="min-h-touch w-full px-4 rounded-xl bg-sky-600 text-white font-medium" onClick={submitT3}>
                  Проверить
                </button>
              )}
              {reveal && (
                <button
                  type="button"
                  className="min-h-touch w-full px-4 rounded-xl bg-emerald-600 text-white font-medium"
                  onClick={() => void applySrs(gradeType3(aq.data, order3))}
                >
                  Дальше
                </button>
              )}
            </>
          }
        >
          {cheatVisible &&
            (() => {
              const ch = getCheatT3(aq.data.id);
              return ch ? <CheatMnemonicLine dense className="mb-2" hook={ch.hook} answerKey={ch.answerKey} /> : null;
            })()}
          {!cheatVisible &&
            (() => {
              const ch = getCheatT3(aq.data.id);
              return ch?.hook?.trim() ? <QuestionKeyOnlyLine dense hook={ch.hook} className="mb-2" /> : null;
            })()}
          <Type3View
            q={aq.data}
            order={order3}
            setOrder={setOrder3}
            showRu={!questionUiRussian}
            questionUiRussian={questionUiRussian}
            reveal={reveal}
            disabled={reveal}
            showHint={hint3}
            promptVariant="keyword"
          />
        </CardWithActionsRail>
      )}
    </div>
  );
}
