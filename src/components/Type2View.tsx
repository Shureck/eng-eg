import type { Type2Q } from "../types";
import { ruBelowEn, type2InstructionEn } from "../lib/bilingualLines";

const INST_EN = type2InstructionEn();

export function Type2View({
  q,
  map,
  setMap,
  showRu: _showRu,
  questionUiRussian: _questionUiRussian,
  reveal,
  disabled,
  promptVariant = "full",
}: {
  q: Type2Q;
  map: Record<string, number>;
  setMap: (m: Record<string, number>) => void;
  showRu: boolean;
  questionUiRussian: boolean;
  reveal: boolean;
  disabled: boolean;
  promptVariant?: "full" | "keyword";
}) {
  const ok = q.terms.every((t) => {
    const ix = map[t];
    if (ix < 0) return false;
    return q.definitions[ix] === q.correct[t];
  });

  const filled = q.terms.every((t) => map[t] >= 0);

  const useKeywordOnly = promptVariant === "keyword";
  const keywordOrFallback =
    q.keyword_hint?.trim() || q.terms.join(", ") || INST_EN;

  return (
    <div className="space-y-4">
      {useKeywordOnly ? (
        <>
          <p className="text-xl leading-snug font-semibold whitespace-pre-wrap text-slate-900 dark:text-slate-100">
            {keywordOrFallback}
          </p>
          {ruBelowEn(keywordOrFallback, q.translation_ru) && (
            <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-snug border-l-4 border-sky-500/70 pl-3">
              {ruBelowEn(keywordOrFallback, q.translation_ru)}
            </p>
          )}
          <p className="text-xs text-slate-500 dark:text-slate-400">{INST_EN}</p>
        </>
      ) : (
        <>
          <p className="text-lg md:text-xl font-medium text-slate-900 dark:text-slate-100">{INST_EN}</p>
          {ruBelowEn(INST_EN, q.translation_ru) && (
            <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-snug border-l-4 border-sky-500/70 pl-3">
              {ruBelowEn(INST_EN, q.translation_ru)}
            </p>
          )}
        </>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          {q.terms.map((t, i) => (
            <div key={t}>
              <div className="font-semibold text-base md:text-lg text-slate-900 dark:text-slate-100">
                {i + 1}. {t}
              </div>
              {ruBelowEn(t, q.terms_ru[i]) && (
                <div className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{ruBelowEn(t, q.terms_ru[i])}</div>
              )}
              <select
                className="mt-1 w-full min-h-touch rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2"
                disabled={disabled}
                value={map[t] ?? -1}
                onChange={(e) =>
                  setMap({
                    ...map,
                    [t]: Number(e.target.value),
                  })
                }
              >
                <option value={-1}>— выберите —</option>
                {q.definitions.map((d, ix) => {
                  const short = d.slice(0, 120) + (d.length > 120 ? "…" : "");
                  return (
                    <option key={ix} value={ix}>
                      {String.fromCharCode(97 + ix)}) {short}
                    </option>
                  );
                })}
              </select>
            </div>
          ))}
        </div>
        <div className="text-sm space-y-2 text-slate-700 dark:text-slate-300">
          <p className="font-medium text-base text-slate-900 dark:text-slate-100">Definitions</p>
          <ol className="list-decimal pl-5 space-y-3">
            {q.definitions.map((d, ix) => (
              <li key={ix}>
                <span className="text-base text-slate-900 dark:text-slate-100">{d}</span>
                {ruBelowEn(d, q.definitions_ru[ix]) && (
                  <span className="block text-sm text-slate-600 dark:text-slate-400 mt-1">{ruBelowEn(d, q.definitions_ru[ix])}</span>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>
      {reveal && (
        <div className="rounded-xl bg-slate-100 dark:bg-slate-900 p-4 text-sm space-y-2">
          <p>{q.explanation_ru}</p>
          <ul className="list-disc pl-5 space-y-2">
            {q.terms.map((t, i) => (
              <li key={t}>
                <strong className="text-base text-slate-900 dark:text-slate-100">{t}</strong>
                {ruBelowEn(t, q.terms_ru[i]) && (
                  <span className="block text-xs text-slate-500 mt-0.5">{ruBelowEn(t, q.terms_ru[i])}</span>
                )}
                <span className="text-slate-700 dark:text-slate-300"> → {q.correct[t]}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {!reveal && filled && (
        <p className={`text-sm font-medium ${ok ? "text-emerald-600" : "text-amber-600"}`}>
          {ok ? "Все пары верны." : "Есть ошибки — после проверки увидите правильные связи."}
        </p>
      )}
    </div>
  );
}

export function gradeType2(q: Type2Q, map: Record<string, number>): boolean {
  return q.terms.every((t) => {
    const ix = map[t];
    return ix >= 0 && q.definitions[ix] === q.correct[t];
  });
}

export function emptyMap2(q: Type2Q): Record<string, number> {
  return Object.fromEntries(q.terms.map((t) => [t, -1]));
}

export function correctMap2(q: Type2Q): Record<string, number> {
  return Object.fromEntries(
    q.terms.map((t) => {
      const def = q.correct[t];
      const ix = q.definitions.indexOf(def);
      return [t, ix];
    }),
  );
}
