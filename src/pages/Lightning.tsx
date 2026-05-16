import { useQuestionLang } from "../context/QuestionLangContext";
import { CheatMnemonicLine } from "../components/CheatMnemonicLine";
import { getCheatT1, getCheatT2, getCheatT3 } from "../data/lightningCheatSheet";
import { useLightningDisplayMode, type LightningDisplayMode } from "../lib/lightningDisplayMode";

type LightningRow = {
  id: string;
  cheat?: { hook: string; answerKey: string };
  /** Левая часть в стандартном режиме: формулировка вопроса (как на экзамене) */
  standardLeft: string;
  fallbackK: string;
  fallbackA: string;
};

export default function Lightning() {
  const { bank, questionUiRussian } = useQuestionLang();
  const [displayMode, setDisplayMode] = useLightningDisplayMode();

  const rows: LightningRow[] = [];

  for (const q of bank.type1) {
    const ix = q.options.findIndex((o) => o.key === q.correct);
    const ok = q.options.find((o) => o.key === q.correct)?.text ?? "";
    const ru = ix >= 0 ? q.options_ru[ix] : "";
    const ans = questionUiRussian ? ru || ok : ok;
    const standardLeft = (questionUiRussian ? q.translation_ru?.trim() || q.question : q.question).trim();
    const kw = q.keyword_hint?.trim() || "";
    rows.push({
      id: `t1-${q.id}`,
      cheat: getCheatT1(q.id),
      standardLeft,
      fallbackK: kw || standardLeft,
      fallbackA: `${q.correct}) ${ans}`,
    });
  }
  for (const q of bank.type2) {
    const bits = q.terms
      .map((t, i) => {
        const term = questionUiRussian ? q.terms_ru[i] || t : t;
        const def = q.correct[t];
        const di = q.definitions.indexOf(def);
        const defShown =
          questionUiRussian && di >= 0 ? q.definitions_ru[di] || def : def;
        return `${term} → ${defShown?.slice(0, 80)}…`;
      })
      .join("; ");
    const standardLeft = (
      questionUiRussian
        ? q.translation_ru?.trim() || q.keyword_hint?.trim()
        : q.keyword_hint?.trim() || q.translation_ru?.trim() || q.terms.join(", ")
    ).trim();
    rows.push({
      id: `t2-${q.id}`,
      cheat: getCheatT2(q.id),
      standardLeft,
      fallbackK: q.keyword_hint?.trim() || standardLeft,
      fallbackA: bits,
    });
  }
  for (const q of bank.type3) {
    const standardLeft = (
      questionUiRussian
        ? q.translation_ru?.trim() || q.keyword_hint?.trim() || q.full_sentence
        : q.full_sentence?.trim() || q.keyword_hint?.trim() || q.translation_ru?.trim()
    ).trim();
    rows.push({
      id: `t3-${q.id}`,
      cheat: getCheatT3(q.id),
      standardLeft,
      fallbackK: q.keyword_hint?.trim() || standardLeft,
      fallbackA: questionUiRussian ? q.translation_ru || q.full_sentence : q.full_sentence,
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
          Быстрый список «ключ → ответ». Прокручивайте перед экзаменом. Формулировка и ответ подсвечены отдельно.
        </p>
      ) : (
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Цветная мнемоника: <strong>якоря из таблицы</strong> → <strong>ключ к ответу</strong>. Если строки в таблице нет —
          показывается короткий «ключ → ответ» по данным банка.
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
              <StandardLightningRow left={r.standardLeft} answer={r.fallbackA} />
            ) : r.cheat ? (
              <CheatMnemonicLine hook={r.cheat.hook} answerKey={r.cheat.answerKey} />
            ) : (
              <div className="font-mono flex flex-wrap items-baseline gap-2 text-sm">
                <span className="text-sky-600 dark:text-sky-400">{r.fallbackK}</span>
                <span className="text-slate-400">→</span>
                <span className="text-slate-900 dark:text-slate-100">{r.fallbackA}</span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function StandardLightningRow({ left, answer }: { left: string; answer: string }) {
  return (
    <div className="font-mono text-[13px] sm:text-sm leading-relaxed flex flex-wrap items-baseline gap-x-2 gap-y-2">
      <mark className="rounded-md px-2 py-1 bg-sky-100 text-sky-900 shadow-sm ring-1 ring-sky-300/60 dark:bg-sky-500/20 dark:text-sky-100 dark:ring-sky-400/25 max-w-full whitespace-pre-wrap break-words">
        {left}
      </mark>
      <span className="text-slate-400 dark:text-slate-500 shrink-0 select-none" aria-hidden>
        →
      </span>
      <mark className="rounded-md px-2 py-1 bg-violet-100 text-violet-950 shadow-sm ring-1 ring-violet-300/50 dark:bg-violet-500/20 dark:text-violet-100 dark:ring-violet-400/25 max-w-full whitespace-pre-wrap break-words">
        {answer}
      </mark>
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
