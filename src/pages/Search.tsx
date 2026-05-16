import { useMemo, useState } from "react";
import { useQuestionLang } from "../context/QuestionLangContext";
import { useProgress } from "../hooks/useProgress";

export default function SearchPage() {
  const { bank } = useQuestionLang();
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("");
  const { map, ready } = useProgress();

  const hits = useMemo(() => {
    const ql = q.trim().toLowerCase();
    const tl = tag.trim().toLowerCase();
    const out: { id: string; title: string; box: number }[] = [];

    const push = (kind: string, id: number, text: string, tags: string[]) => {
      const key = `${kind}-${id}`;
      const row = map.get(key);
      const box = row?.box ?? 0;
      const hay = text.toLowerCase();
      const tagsOk = !tl || tags.some((t) => t.includes(tl));
      const qOk = !ql || hay.includes(ql);
      if (tagsOk && qOk) out.push({ id: key, title: text.slice(0, 120), box });
    };

    for (const x of bank.type1)
      push(
        "t1",
        x.id,
        x.question +
          " " +
          x.translation_ru +
          " " +
          x.options.map((o) => o.text).join(" ") +
          " " +
          x.options_ru.join(" "),
        x.tags,
      );
    for (const x of bank.type2)
      push(
        "t2",
        x.id,
        x.terms.join(" ") +
          " " +
          x.terms_ru.join(" ") +
          " " +
          x.definitions.join(" ") +
          " " +
          x.definitions_ru.join(" ") +
          " " +
          x.translation_ru,
        x.tags,
      );
    for (const x of bank.type3)
      push(
        "t3",
        x.id,
        x.full_sentence +
          " " +
          x.translation_ru +
          " " +
          x.words.map((w) => w.text + " " + w.text_ru).join(" "),
        x.tags,
      );

    return out;
  }, [q, tag, map, bank]);

  if (!ready) return <p className="text-slate-500">Загрузка…</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Поиск</h1>
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          className="min-h-touch rounded-xl border border-slate-300 dark:border-slate-600 px-3 bg-white dark:bg-slate-900"
          placeholder="Текст вопроса или ответа"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <input
          className="min-h-touch rounded-xl border border-slate-300 dark:border-slate-600 px-3 bg-white dark:bg-slate-900"
          placeholder="Тег (calculus, micro…)"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
        />
      </div>
      <ul className="space-y-2 text-sm">
        {hits.map((h) => (
          <li key={h.id} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 flex justify-between gap-2">
            <span className="break-words">
              <span className="font-mono text-xs text-slate-500">{h.id}</span> — {h.title}…
            </span>
            <span className="shrink-0 text-xs rounded px-2 py-1 bg-slate-100 dark:bg-slate-800">коробка {h.box}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
