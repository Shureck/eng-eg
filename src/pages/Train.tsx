import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { allKeys, BANK_EN, getQuestion } from "../data/bank";
import { useQuestionLang } from "../context/QuestionLangContext";
import { useProgress } from "../hooks/useProgress";
import { defaultProgress } from "../lib/db";
import {
  clearSrsQueueSnapshot,
  loadSrsQueueSnapshot,
  saveSrsQueueSnapshot,
} from "../lib/srsQueueStorage";
import {
  buildSrsTrainPool,
  SRS_TASK_GROUP_LABEL,
  SRS_TRAIN_MODE_HINT,
  SRS_TRAIN_MODE_LABEL,
  useSrsFiltersPanelCollapsed,
  useSrsTrainPrefs,
  type SrsTaskGroup,
  type SrsTrainMode,
} from "../lib/srsTrainPrefs";
import { Type1View } from "../components/Type1View";
import { CheatMnemonicLine, QuestionKeyOnlyLine } from "../components/CheatMnemonicLine";
import { CardWithActionsRail } from "../components/CardWithActionsRail";
import { Type2View, emptyMap2, gradeType2 } from "../components/Type2View";
import { Type3View, gradeType3, initialOrder3 } from "../components/Type3View";
import { getCheatT1, getCheatT2, getCheatT3 } from "../data/lightningCheatSheet";
import { useCheatMnemonicVisible } from "../lib/cheatVisibility";
import { markHard, onCorrect, onWrong } from "../lib/srs";
import { shuffle } from "../lib/shuffle";

export default function Train() {
  const { bank, questionUiRussian } = useQuestionLang();
  const { map, ready, save } = useProgress();
  const { group, setGroup, mode, setMode } = useSrsTrainPrefs();
  const [filtersCollapsed, toggleFiltersPanel] = useSrsFiltersPanelCollapsed();
  const [cheatVisible, setCheatVisible] = useCheatMnemonicVisible();
  const [queue, setQueue] = useState<string[]>([]);
  const [qi, setQi] = useState(0);
  /** Не трогаем localStorage, пока не решили: восстановить сессию или собрать очередь заново */
  const [srsBootstrapped, setSrsBootstrapped] = useState(false);

  const rebuildPool = useCallback(
    (g: SrsTaskGroup, m: SrsTrainMode) => {
      const now = Date.now();
      const pool = buildSrsTrainPool(allKeys(BANK_EN), map, g, m, now);
      setQueue(shuffle(pool));
      setQi(0);
    },
    [map],
  );

  const rebuild = useCallback(() => rebuildPool(group, mode), [rebuildPool, group, mode]);

  const applyGroup = useCallback(
    (g: SrsTaskGroup) => {
      if (g === group) return;
      setGroup(g);
      clearSrsQueueSnapshot();
      rebuildPool(g, mode);
    },
    [group, setGroup, mode, rebuildPool],
  );

  const applyMode = useCallback(
    (m: SrsTrainMode) => {
      if (m === mode) return;
      setMode(m);
      clearSrsQueueSnapshot();
      rebuildPool(group, m);
    },
    [mode, setMode, group, rebuildPool],
  );

  const poolStats = useMemo(() => {
    const now = Date.now();
    const all = allKeys(BANK_EN);
    return {
      due: buildSrsTrainPool(all, map, group, "due", now).length,
      all: buildSrsTrainPool(all, map, group, "all", now).length,
      problem: buildSrsTrainPool(all, map, group, "problem", now).length,
    };
  }, [map, group]);

  /** После загрузки прогресса: восстановить сохранённую очередь или собрать новую */
  useEffect(() => {
    if (!ready || srsBootstrapped) return;
    const snap = loadSrsQueueSnapshot();
    const legacy = snap && snap.group === undefined && snap.mode === undefined;
    const matchPrefs = snap && snap.group === group && snap.mode === mode;
    if (snap && (legacy || matchPrefs)) {
      setQueue(snap.queue);
      setQi(snap.qi);
    } else {
      rebuildPool(group, mode);
    }
    setSrsBootstrapped(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- только первый запуск после ready
  }, [ready, srsBootstrapped]);

  /** Сохранять порядок и позицию между перезагрузками страницы */
  useEffect(() => {
    if (!ready || !srsBootstrapped) return;
    if (queue.length === 0) {
      clearSrsQueueSnapshot();
      return;
    }
    saveSrsQueueSnapshot({ queue, qi, group, mode });
  }, [ready, srsBootstrapped, queue, qi, group, mode]);

  const key = queue[qi];
  const aq = useMemo(() => (key ? getQuestion(key, bank) : null), [key, bank]);

  const [pick, setPick] = useState<string | null>(null);
  const [reveal, setReveal] = useState(false);
  const [map2, setMap2] = useState<Record<string, number>>({});
  const [order3, setOrder3] = useState<string[]>([]);
  const [hint3, setHint3] = useState(false);

  useLayoutEffect(() => {
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
    <div className="space-y-3">
      <div className="flex justify-between flex-wrap gap-2 items-center">
        <h1 className="text-lg font-bold">SRS-тренировка</h1>
        <div className="flex flex-wrap gap-2 justify-end">
          <button
            type="button"
            className="min-h-touch px-3 rounded-lg border text-sm"
            aria-pressed={cheatVisible}
            onClick={() => setCheatVisible(!cheatVisible)}
          >
            Шпаргалка: {cheatVisible ? "вкл" : "выкл"}
          </button>
          <button
            type="button"
            className="min-h-touch px-3 rounded-lg border text-sm"
            onClick={() => {
              clearSrsQueueSnapshot();
              rebuild();
            }}
          >
            Новая очередь
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50/80 dark:bg-slate-900/40 p-2 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
            Фильтры SRS {filtersCollapsed ? "(свернуто)" : ""}
          </p>
          <button
            type="button"
            className="min-h-touch px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800"
            aria-expanded={!filtersCollapsed}
            onClick={toggleFiltersPanel}
          >
            {filtersCollapsed ? "Показать фильтры" : "Скрыть фильтры"}
          </button>
        </div>

        {filtersCollapsed ? (
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-snug">
            <span className="font-medium">{SRS_TASK_GROUP_LABEL[group]}</span>
            <span className="text-slate-400 mx-1">·</span>
            <span className="font-medium">{SRS_TRAIN_MODE_LABEL[mode]}</span>
          </p>
        ) : (
          <>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Группа заданий</p>
            <div
              className="flex flex-col sm:flex-row gap-2 rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-slate-300 dark:divide-slate-600"
              role="group"
              aria-label="Группа заданий"
            >
              {(["t1", "t2", "t3"] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  className={`min-h-touch flex-1 px-3 py-2 text-left text-sm transition-colors ${
                    group === g ? "bg-sky-600 text-white font-medium" : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                  aria-pressed={group === g}
                  onClick={() => applyGroup(g)}
                >
                  {SRS_TASK_GROUP_LABEL[g]}
                </button>
              ))}
            </div>

            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Режим очереди</p>
            <div
              className="flex flex-col sm:flex-row gap-2 rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-slate-300 dark:divide-slate-600"
              role="group"
              aria-label="Режим SRS"
            >
              {(["due", "all", "problem"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  title={SRS_TRAIN_MODE_HINT[m]}
                  className={`min-h-touch flex-1 px-3 py-2 text-left text-sm transition-colors ${
                    mode === m ? "bg-violet-600 text-white font-medium" : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                  aria-pressed={mode === m}
                  onClick={() => applyMode(m)}
                >
                  <span className="block">{SRS_TRAIN_MODE_LABEL[m]}</span>
                  <span className={`block text-xs mt-0.5 ${mode === m ? "text-violet-100" : "text-slate-500 dark:text-slate-400"}`}>
                    в группе: {m === "due" ? poolStats.due : m === "all" ? poolStats.all : poolStats.problem} шт.
                  </span>
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">{SRS_TRAIN_MODE_HINT[mode]}</p>
            {poolStats.due === poolStats.all && poolStats.all > 0 && poolStats.problem < poolStats.all ? (
              <details className="text-xs text-slate-500 dark:text-slate-400 border-l-4 border-sky-400/70 pl-2">
                <summary className="cursor-pointer select-none text-slate-600 dark:text-slate-300">
                  Почему «по расписанию» совпадает с «всеми»?
                </summary>
                <p className="mt-1">
                  Пока почти все карточки в коробке 0–1, они все считаются доступными для SRS; после переноса части в коробки 2–3 числа
                  разъедутся по интервалам 24 ч / 72 ч.
                </p>
              </details>
            ) : null}
          </>
        )}
      </div>

      <p
        className="text-xs text-slate-500 leading-snug"
        title="Очередь сохраняется при обновлении страницы для текущих группы и режима."
      >
        Карточка {qi + 1} из {queue.length || "…"} ·{" "}
        <span className="text-slate-700 dark:text-slate-300">{SRS_TASK_GROUP_LABEL[group]}</span> ·{" "}
        <span className="text-slate-700 dark:text-slate-300">{SRS_TRAIN_MODE_LABEL[mode]}</span>
      </p>

      {!key && mode === "problem" && (
        <p className="text-amber-700 dark:text-amber-400">
          В выбранной группе нет карточек с ошибкой или отметкой «сложно». Переключите режим или группу.
        </p>
      )}
      {!key && mode === "due" && (
        <p className="text-amber-700 dark:text-amber-400">
          По расписанию SRS сейчас нечего повторять в этой группе — загляните позже, выберите режим «Все карточки» или другую группу.
        </p>
      )}
      {!key && mode === "all" && (
        <p className="text-amber-700 dark:text-amber-400">В группе нет карточек (не должно происходить). Обновите страницу.</p>
      )}

      {aq?.kind === "t1" && (() => {
        const cheatPair = getCheatT1(aq.data.id) ?? null;
        return (
        <CardWithActionsRail
          compact
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
            compact
          />
        </CardWithActionsRail>
        );
      })()}

      {aq?.kind === "t2" && (
        <CardWithActionsRail
          compact
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
              return ch ? <CheatMnemonicLine dense className="mb-1" hook={ch.hook} answerKey={ch.answerKey} /> : null;
            })()}
          {!cheatVisible &&
            (() => {
              const ch = getCheatT2(aq.data.id);
              return ch?.hook?.trim() ? <QuestionKeyOnlyLine dense hook={ch.hook} className="mb-1" /> : null;
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
            compact
          />
        </CardWithActionsRail>
      )}

      {aq?.kind === "t3" && (
        <CardWithActionsRail
          compact
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
              return ch ? <CheatMnemonicLine dense className="mb-1" hook={ch.hook} answerKey={ch.answerKey} /> : null;
            })()}
          {!cheatVisible &&
            (() => {
              const ch = getCheatT3(aq.data.id);
              return ch?.hook?.trim() ? <QuestionKeyOnlyLine dense hook={ch.hook} className="mb-1" /> : null;
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
            compact
          />
        </CardWithActionsRail>
      )}
    </div>
  );
}
