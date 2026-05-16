import { useQuestionLang } from "../context/QuestionLangContext";
import { CheatMnemonicLine } from "../components/CheatMnemonicLine";
import { getCheatT1, getCheatT2, getCheatT3 } from "../data/lightningCheatSheet";

export default function Lightning() {
  const { bank, questionUiRussian } = useQuestionLang();

  const rows: {
    id: string;
    cheat?: { hook: string; answerKey: string };
    fallbackK: string;
    fallbackA: string;
  }[] = [];

  for (const q of bank.type1) {
    const ix = q.options.findIndex((o) => o.key === q.correct);
    const ok = q.options.find((o) => o.key === q.correct)?.text ?? "";
    const ru = ix >= 0 ? q.options_ru[ix] : "";
    const ans = questionUiRussian ? ru || ok : ok;
    rows.push({
      id: `t1-${q.id}`,
      cheat: getCheatT1(q.id),
      fallbackK: q.keyword_hint,
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
    rows.push({
      id: `t2-${q.id}`,
      cheat: getCheatT2(q.id),
      fallbackK: q.keyword_hint,
      fallbackA: bits,
    });
  }
  for (const q of bank.type3) {
    rows.push({
      id: `t3-${q.id}`,
      cheat: getCheatT3(q.id),
      fallbackK: q.keyword_hint,
      fallbackA: questionUiRussian ? q.translation_ru || q.full_sentence : q.full_sentence,
    });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Молниеносный режим</h1>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Формат шпаргалки: <strong>ключевые слова из вопроса</strong> →{" "}
        <strong>ключ из правильного ответа</strong>. Цвета чередуются по частям фразы — можно цепляться за форму, не
        вчитываясь в смысл. Если для карточки нет строки в таблице, показывается прежний «keyword → ответ».
      </p>

      <ul className="space-y-3 text-sm">
        {rows.map((r, i) => (
          <li
            key={r.id}
            className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 break-words bg-white/50 dark:bg-slate-900/40"
          >
            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mb-1">
              {i + 1}. <span className="text-slate-400">{r.id}</span>
            </div>
            {r.cheat ? (
              <CheatMnemonicLine hook={r.cheat.hook} answerKey={r.cheat.answerKey} />
            ) : (
              <div className="font-mono flex flex-wrap items-baseline gap-2">
                <span className="text-sky-600 dark:text-sky-400">{r.fallbackK}</span>
                <span className="text-slate-400">→</span>
                <span>{r.fallbackA}</span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
