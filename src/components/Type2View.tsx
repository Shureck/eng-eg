import type { Type2Q } from "../types";

export function Type2View({
  q,
  map,
  setMap,
  showRu,
  questionUiRussian,
  reveal,
  disabled,
}: {
  q: Type2Q;
  map: Record<string, number>;
  setMap: (m: Record<string, number>) => void;
  showRu: boolean;
  questionUiRussian: boolean;
  reveal: boolean;
  disabled: boolean;
}) {
  const ok = q.terms.every((t) => {
    const ix = map[t];
    if (ix < 0) return false;
    return q.definitions[ix] === q.correct[t];
  });

  const filled = q.terms.every((t) => map[t] >= 0);

  return (
    <div className="space-y-4">
      <p className="text-lg font-medium">Сопоставьте термины и определения</p>
      {!questionUiRussian && showRu && (
        <p className="text-slate-600 dark:text-slate-400">{q.translation_ru}</p>
      )}
      {questionUiRussian && (
        <p className="text-slate-600 dark:text-slate-400 text-sm">{q.translation_ru}</p>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          {q.terms.map((t, i) => (
            <div key={t}>
              <div className="font-semibold">
                {i + 1}. {questionUiRussian ? q.terms_ru[i] ?? t : t}
              </div>
              {!questionUiRussian && showRu && (
                <div className="text-sm text-slate-600 dark:text-slate-400">{q.terms_ru[i]}</div>
              )}
              {questionUiRussian && <div className="text-sm text-slate-600 dark:text-slate-400">{t}</div>}
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
                  const label = questionUiRussian ? q.definitions_ru[ix] ?? d : d;
                  const short = label.slice(0, 120) + (label.length > 120 ? "…" : "");
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
          <p className="font-medium">{questionUiRussian ? "Определения (справочно)" : "Определения (англ.)"}</p>
          <ol className="list-decimal pl-5 space-y-2">
            {q.definitions.map((d, ix) => (
              <li key={ix}>
                {questionUiRussian ? (
                  <>
                    <span>{q.definitions_ru[ix] ?? d}</span>
                    <span className="block text-slate-500 text-xs mt-0.5">{d}</span>
                  </>
                ) : (
                  <>
                    {showRu && q.definitions_ru[ix] && (
                      <span className="block text-slate-500">{q.definitions_ru[ix]}</span>
                    )}
                    <span>{d}</span>
                  </>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>
      {reveal && (
        <div className="rounded-xl bg-slate-100 dark:bg-slate-900 p-4 text-sm space-y-2">
          <p>{q.explanation_ru}</p>
          <ul className="list-disc pl-5">
            {q.terms.map((t, i) => (
              <li key={t}>
                <strong>{questionUiRussian ? q.terms_ru[i] ?? t : t}</strong> → {q.correct[t]}
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
