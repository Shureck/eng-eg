import { useQuestionLang } from "../context/QuestionLangContext";

export default function Lightning() {
  const { bank, questionUiRussian } = useQuestionLang();
  const rows: { k: string; a: string }[] = [];

  for (const q of bank.type1) {
    const ix = q.options.findIndex((o) => o.key === q.correct);
    const ok = q.options.find((o) => o.key === q.correct)?.text ?? "";
    const ru = ix >= 0 ? q.options_ru[ix] : "";
    const ans = questionUiRussian ? ru || ok : ok;
    rows.push({ k: q.keyword_hint, a: `${q.correct}) ${ans}` });
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
    rows.push({ k: q.keyword_hint, a: bits });
  }
  for (const q of bank.type3) {
    rows.push({
      k: q.keyword_hint,
      a: questionUiRussian ? q.translation_ru || q.full_sentence : q.full_sentence,
    });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Молниеносный режим</h1>
      <p className="text-sm text-slate-500">
        Быстрый список «ключ → ответ». Прокручивайте перед экзаменом.
      </p>
      <ul className="space-y-2 font-mono text-sm">
        {rows.map((r, i) => (
          <li key={i} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 break-words">
            <span className="text-sky-600 dark:text-sky-400">{r.k}</span>
            <span className="text-slate-400 mx-2">→</span>
            <span>{r.a}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
