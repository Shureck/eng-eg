import { useEffect, useState } from "react";
import { learnKeyOrder, getQuestion } from "../data/bank";
import { useQuestionLang } from "../context/QuestionLangContext";
import { useProgress } from "../hooks/useProgress";
import { loadLearnIndexRaw, saveLearnIndex } from "../lib/learnProgress";
import { defaultProgress } from "../lib/db";
import { Type1View } from "../components/Type1View";
import { CheatMnemonicLine } from "../components/CheatMnemonicLine";
import { CardWithActionsRail } from "../components/CardWithActionsRail";
import { Type2View, correctMap2 } from "../components/Type2View";
import { Type3View } from "../components/Type3View";
import { getCheatT1, getCheatT2, getCheatT3 } from "../data/lightningCheatSheet";
import { markHard } from "../lib/srs";
import type { AnyQ } from "../types";

const LEARN_RAIL =
  "w-full md:w-[16rem] shrink-0 md:sticky md:top-28 md:self-start flex flex-col gap-3";

export default function Learn() {
  const { bank, questionUiRussian } = useQuestionLang();
  const keys = learnKeyOrder(bank);
  const [idx, setIdx] = useState(0);
  const [learnBootstrapped, setLearnBootstrapped] = useState(false);
  const { map, ready, save } = useProgress();
  const effectiveIdx = keys.length === 0 ? 0 : Math.min(idx, keys.length - 1);
  const key = keys.length === 0 ? undefined : keys[effectiveIdx];
  const aq = key ? getQuestion(key, bank) : null;
  const row = key ? map.get(key) ?? defaultProgress(key) : null;

  useEffect(() => {
    if (!ready || keys.length === 0 || learnBootstrapped) return;
    const stored = loadLearnIndexRaw();
    setIdx(Math.min(Math.max(0, stored), keys.length - 1));
    setLearnBootstrapped(true);
  }, [ready, keys.length, learnBootstrapped]);

  useEffect(() => {
    if (!ready || keys.length === 0 || !learnBootstrapped) return;
    setIdx((i) => Math.min(i, keys.length - 1));
  }, [ready, keys.length, learnBootstrapped]);

  useEffect(() => {
    if (!ready || keys.length === 0 || !learnBootstrapped) return;
    saveLearnIndex(Math.min(idx, keys.length - 1));
  }, [ready, keys.length, idx, learnBootstrapped]);

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

  const navDisabled = keys.length === 0;
  const atFirst = effectiveIdx <= 0;
  const atLast = keys.length === 0 || effectiveIdx >= keys.length - 1;

  function jumpToOrdinal(v: number) {
    if (keys.length === 0 || !Number.isFinite(v)) return;
    const i = Math.round(v);
    setIdx(Math.min(keys.length - 1, Math.max(0, i - 1)));
  }

  const railActions =
    aq && row ? (
      <div className="flex flex-col gap-2 w-full">
        <button type="button" className="min-h-touch w-full px-4 rounded-xl bg-emerald-600 text-white font-medium" onClick={() => next()}>
          Понял
        </button>
        <button
          type="button"
          className="min-h-touch w-full px-4 rounded-xl border border-amber-500 text-amber-800 dark:text-amber-300 font-medium"
          onClick={() => onHard()}
        >
          Сложно
        </button>

        <div className="border-t border-slate-200 dark:border-slate-700 pt-3 mt-1 flex flex-col gap-2">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Навигация</p>
          <div className="flex gap-2">
            <button
              type="button"
              className="min-h-touch flex-1 px-2 rounded-lg border text-sm"
              disabled={navDisabled || atFirst}
              onClick={() => setIdx((i) => Math.max(0, i - 1))}
            >
              ← Назад
            </button>
            <button
              type="button"
              className="min-h-touch flex-1 px-2 rounded-lg border text-sm"
              disabled={navDisabled || atLast}
              onClick={() => setIdx((i) => Math.min(keys.length - 1, i + 1))}
            >
              Вперёд →
            </button>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="min-h-touch flex-1 px-2 rounded-lg border border-slate-300 dark:border-slate-600 text-xs"
              disabled={navDisabled || atFirst}
              onClick={() => setIdx(0)}
            >
              В начало
            </button>
            <button
              type="button"
              className="min-h-touch flex-1 px-2 rounded-lg border border-slate-300 dark:border-slate-600 text-xs"
              disabled={navDisabled || atLast}
              onClick={() => setIdx(keys.length - 1)}
            >
              В конец
            </button>
          </div>

          <label className="text-xs text-slate-500 dark:text-slate-400" htmlFor="learn-jump-n">
            Перейти к № (1–{keys.length})
          </label>
          <input
            id="learn-jump-n"
            key={effectiveIdx}
            type="number"
            inputMode="numeric"
            min={1}
            max={keys.length}
            defaultValue={effectiveIdx + 1}
            className="w-full min-h-touch rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 text-sm"
            onBlur={(e) => jumpToOrdinal(Number(e.target.value))}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
          />

          {keys.length > 1 && (
            <>
              <label className="text-xs text-slate-500 dark:text-slate-400" htmlFor="learn-scrub">
                Лента карточек
              </label>
              <input
                id="learn-scrub"
                type="range"
                min={0}
                max={keys.length - 1}
                step={1}
                value={effectiveIdx}
                aria-valuetext={`Карточка ${effectiveIdx + 1} из ${keys.length}`}
                className="w-full accent-sky-600"
                onChange={(e) => setIdx(Number(e.target.value))}
              />
            </>
          )}
        </div>
      </div>
    ) : null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-2 flex-wrap">
        <h1 className="text-xl font-bold">Обучение</h1>
        <span className="text-sm text-slate-500">
          {keys.length === 0 ? "0 / 0" : `${effectiveIdx + 1} / ${keys.length}`}
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
        <div
          className="h-full bg-sky-500 transition-all"
          style={{ width: keys.length === 0 ? "0%" : `${((effectiveIdx + 1) / keys.length) * 100}%` }}
        />
      </div>

      {!aq && <p>Нет вопросов</p>}
      {aq && railActions && (
        <CardWithActionsRail railClassName={LEARN_RAIL} actions={railActions}>
          <LearnQuestionBody aq={aq} questionUiRussian={questionUiRussian} />
        </CardWithActionsRail>
      )}
    </div>
  );
}

function LearnQuestionBody({ aq, questionUiRussian }: { aq: AnyQ; questionUiRussian: boolean }) {
  const showRu = !questionUiRussian;

  if (aq.kind === "t1") {
    return (
      <Type1View
        q={aq.data}
        mode="learn"
        showRu={showRu}
        questionUiRussian={questionUiRussian}
        cheatMnemonic={getCheatT1(aq.data.id) ?? null}
        pick={null}
        reveal
      />
    );
  }

  if (aq.kind === "t2") {
    const ch = getCheatT2(aq.data.id);
    return (
      <>
        {ch ? <CheatMnemonicLine dense className="mb-2" hook={ch.hook} answerKey={ch.answerKey} /> : null}
        <Type2View
          q={aq.data}
          map={correctMap2(aq.data)}
          setMap={() => {}}
          showRu={showRu}
          questionUiRussian={questionUiRussian}
          reveal
          disabled
        />
      </>
    );
  }

  const ch = getCheatT3(aq.data.id);
  return (
    <>
      {ch ? <CheatMnemonicLine dense className="mb-2" hook={ch.hook} answerKey={ch.answerKey} /> : null}
      <Type3View
        q={aq.data}
        order={aq.data.correct_order}
        setOrder={() => {}}
        showRu={showRu}
        questionUiRussian={questionUiRussian}
        reveal
        disabled
        showHint={false}
      />
    </>
  );
}
