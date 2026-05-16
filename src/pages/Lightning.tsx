import { useCallback, useState } from "react";
import { useQuestionLang } from "../context/QuestionLangContext";
import { CheatMnemonicLine } from "../components/CheatMnemonicLine";
import { getCheatT1, getCheatT2, getCheatT3 } from "../data/lightningCheatSheet";
import { useLightningDisplayMode, type LightningDisplayMode } from "../lib/lightningDisplayMode";
import { ruBelowEn, stripQuestionIntro } from "../lib/bilingualLines";

type LightningRow = {
  id: string;
  cheat?: { hook: string; answerKey: string };
  questionEn: string;
  questionRu: string | null;
  answerEn: string;
  answerRu: string | null;
  fallbackK: string;
  fallbackA: string;
};

export default function Lightning() {
  const { bank } = useQuestionLang();
  const [displayMode, setDisplayMode] = useLightningDisplayMode();
  /** В режиме мнемоники: какие карточки показывают полный вопрос и ответ */
  const [mnemonicExpanded, setMnemonicExpanded] = useState<Record<string, boolean>>({});
  const toggleMnemonic = useCallback((id: string) => {
    setMnemonicExpanded((m) => ({ ...m, [id]: !m[id] }));
  }, []);

  const rows: LightningRow[] = [];

  for (const q of bank.type1) {
    const ix = q.options.findIndex((o) => o.key === q.correct);
    const ok = q.options.find((o) => o.key === q.correct)?.text ?? "";
    const ruOpt = ix >= 0 ? q.options_ru[ix] : "";
    const questionEn = stripQuestionIntro(q.question).trim();
    const kw = q.keyword_hint?.trim() || "";
    const answerEn = `${q.correct}) ${ok}`;
    rows.push({
      id: `t1-${q.id}`,
      cheat: getCheatT1(q.id),
      questionEn,
      questionRu: ruBelowEn(questionEn, q.translation_ru),
      answerEn,
      answerRu: ruBelowEn(ok, ruOpt),
      fallbackK: kw || questionEn,
      fallbackA: answerEn,
    });
  }
  for (const q of bank.type2) {
    const bits = q.terms
      .map((t, i) => {
        const def = q.correct[t];
        const di = q.definitions.indexOf(def);
        const defShown = di >= 0 ? q.definitions[di] : def;
        return `${t} → ${defShown?.slice(0, 80)}…`;
      })
      .join("; ");
    const questionEn = (q.keyword_hint?.trim() || q.terms.join(", ")).trim();
    rows.push({
      id: `t2-${q.id}`,
      cheat: getCheatT2(q.id),
      questionEn,
      questionRu: ruBelowEn(questionEn, q.translation_ru),
      answerEn: bits,
      answerRu: null,
      fallbackK: q.keyword_hint?.trim() || questionEn,
      fallbackA: bits,
    });
  }
  for (const q of bank.type3) {
    const questionEn = (q.keyword_hint?.trim() || q.full_sentence?.trim() || "").trim();
    const answerEn = q.full_sentence.trim();
    const questionRu = ruBelowEn(questionEn, q.translation_ru);
    const rawAnswerRu = ruBelowEn(answerEn, q.translation_ru);
    const answerRu = rawAnswerRu && rawAnswerRu !== questionRu ? rawAnswerRu : null;
    rows.push({
      id: `t3-${q.id}`,
      cheat: getCheatT3(q.id),
      questionEn,
      questionRu,
      answerEn,
      answerRu,
      fallbackK: q.keyword_hint?.trim() || questionEn,
      fallbackA: answerEn,
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <h1 className="text-xl font-bold">Молниеносный режим</h1>
        <ModeToggle mode={displayMode} onChange={setDisplayMode} />
      </div>

      {displayMode === "standard" ? (
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Английская формулировка и ответ крупно; русский перевод мелко под ними. Прокручивайте перед экзаменом.
        </p>
      ) : (
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Цветная мнемоника: <strong>якоря из таблицы</strong> → <strong>ключ к ответу</strong>. Если строки в таблице нет —
          показывается короткий «ключ → ответ» по данным банка. <strong>Нажмите на карточку</strong>, чтобы под мнемоникой
          развернуть полный текст вопроса и ответа.
        </p>
      )}

      <ul className="space-y-3">
        {rows.map((r, i) => (
          <li
            key={r.id}
            className="rounded-xl border border-slate-200/90 dark:border-slate-600/80 p-4 shadow-sm bg-white dark:bg-slate-900/55 backdrop-blur-[2px]"
          >
            <div className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500 font-mono mb-2">
              {i + 1}. <span className="text-slate-400 dark:text-slate-600">{r.id}</span>
            </div>
            {displayMode === "standard" ? (
              <StandardLightningRow
                questionEn={r.questionEn}
                questionRu={r.questionRu}
                answerEn={r.answerEn}
                answerRu={r.answerRu}
              />
            ) : (
              <MnemonicLightningBlock
                expanded={!!mnemonicExpanded[r.id]}
                onToggle={() => toggleMnemonic(r.id)}
                cheat={r.cheat}
                fallbackK={r.fallbackK}
                fallbackA={r.fallbackA}
                questionEn={r.questionEn}
                questionRu={r.questionRu}
                answerEn={r.answerEn}
                answerRu={r.answerRu}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function StandardLightningRow({
  questionEn,
  questionRu,
  answerEn,
  answerRu,
}: {
  questionEn: string;
  questionRu: string | null;
  answerEn: string;
  answerRu: string | null;
}) {
  /** Две строки: вопрос на всю ширину, затем стрелка + ответ на всю ширину — иначе flex-row сжимает блок ответа в «вертикальную колонку». */
  return (
    <div className="font-mono text-[13px] sm:text-sm leading-relaxed flex flex-col gap-3 w-full min-w-0">
      <div className="flex flex-col gap-1 min-w-0 w-full">
        <mark className="rounded-md px-2 py-1.5 bg-sky-100 text-sky-900 shadow-sm ring-1 ring-sky-300/60 dark:bg-sky-500/20 dark:text-sky-100 dark:ring-sky-400/25 whitespace-pre-wrap break-words text-[15px] sm:text-base font-medium">
          {questionEn}
        </mark>
        {questionRu ? (
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 pl-0.5 whitespace-pre-wrap break-words leading-snug">
            {questionRu}
          </p>
        ) : null}
      </div>
      <div className="flex items-start gap-2 w-full min-w-0">
        <span className="text-slate-400 dark:text-slate-500 shrink-0 select-none pt-0.5" aria-hidden>
          →
        </span>
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <mark className="rounded-md px-2 py-1.5 bg-violet-100 text-violet-950 shadow-sm ring-1 ring-violet-300/50 dark:bg-violet-500/20 dark:text-violet-100 dark:ring-violet-400/25 whitespace-pre-wrap break-words text-[15px] sm:text-base font-medium">
            {answerEn}
          </mark>
          {answerRu ? (
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 pl-0.5 whitespace-pre-wrap break-words leading-snug">
              {answerRu}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function MnemonicLightningBlock({
  expanded,
  onToggle,
  cheat,
  fallbackK,
  fallbackA,
  questionEn,
  questionRu,
  answerEn,
  answerRu,
}: {
  expanded: boolean;
  onToggle: () => void;
  cheat: LightningRow["cheat"];
  fallbackK: string;
  fallbackA: string;
  questionEn: string;
  questionRu: string | null;
  answerEn: string;
  answerRu: string | null;
}) {
  return (
    <div className="w-full min-w-0">
      <button
        type="button"
        className="w-full text-left rounded-lg border border-slate-200/80 dark:border-slate-600/60 bg-slate-50/80 dark:bg-slate-800/40 px-3 py-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 min-w-0"
        aria-expanded={expanded}
        onClick={onToggle}
      >
        <div className="min-w-0">
          {cheat ? (
            <CheatMnemonicLine hook={cheat.hook} answerKey={cheat.answerKey} />
          ) : (
            <div className="font-mono flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm min-w-0">
              <span className="text-sky-600 dark:text-sky-400 break-words">{fallbackK}</span>
              <span className="text-slate-400 shrink-0">→</span>
              <span className="text-slate-900 dark:text-slate-100 break-words">{fallbackA}</span>
            </div>
          )}
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
          {expanded ? "Нажмите, чтобы скрыть полный текст" : "Нажмите, чтобы показать полный вопрос и ответ"}
        </p>
      </button>
      {expanded ? (
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600 space-y-1">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Полный текст
          </p>
          <StandardLightningRow
            questionEn={questionEn}
            questionRu={questionRu}
            answerEn={answerEn}
            answerRu={answerRu}
          />
        </div>
      ) : null}
    </div>
  );
}

function ModeToggle({
  mode,
  onChange,
}: {
  mode: LightningDisplayMode;
  onChange: (m: LightningDisplayMode) => void;
}) {
  return (
    <div
      className="flex rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden divide-x divide-slate-300 dark:divide-slate-600 shrink-0"
      role="group"
      aria-label="Формат списка"
    >
      <button
        type="button"
        className={`min-h-touch px-2.5 sm:px-3 text-xs sm:text-sm transition-colors ${
          mode === "standard"
            ? "bg-sky-600 text-white font-medium"
            : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
        }`}
        aria-pressed={mode === "standard"}
        onClick={() => onChange("standard")}
      >
        Стандартный список
      </button>
      <button
        type="button"
        className={`min-h-touch px-2.5 sm:px-3 text-xs sm:text-sm transition-colors ${
          mode === "mnemonic"
            ? "bg-sky-600 text-white font-medium"
            : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
        }`}
        aria-pressed={mode === "mnemonic"}
        onClick={() => onChange("mnemonic")}
      >
        Мнемоника
      </button>
    </div>
  );
}
