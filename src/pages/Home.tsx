import { useMemo } from "react";
import { Link } from "react-router-dom";
import { BANK, learnKeyOrder } from "../data/bank";
import { defaultProgress } from "../lib/db";
import { useProgress } from "../hooks/useProgress";
import { boxStats } from "../lib/srs";

export default function Home() {
  const { map, ready } = useProgress();
  const stats = useMemo(() => {
    const rows = learnKeyOrder().map((k) => map.get(k) ?? defaultProgress(k));
    return boxStats(rows);
  }, [map]);

  const n = BANK.type1.length + BANK.type2.length + BANK.type3.length;

  if (!ready) return <p className="text-slate-500">Загрузка прогресса…</p>;

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Подготовка к закрытому тесту</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Банк {n} вопросов (150 закрытых + 25 соответствий + 25 порядка). На экзамене — 35 случайных.
          Все данные и прогресс хранятся только в вашем браузере (IndexedDB).
        </p>
      </section>

      <section className="grid gap-3">
        <h2 className="font-semibold text-lg">Прогресс по коробкам SRS</h2>
        <div className="grid gap-2">
          {[
            ["Новые / каждую сессию (0–1)", stats[0] + stats[1]],
            ["Интервал ~24 ч (2)", stats[2]],
            ["Интервал ~72 ч (3)", stats[3]],
          ].map(([label, val]) => (
            <div key={String(label)} className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 flex justify-between gap-2">
              <span>{label}</span>
              <span className="font-mono font-semibold">{val}</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-slate-500">
          Выучено (коробка 3): <strong>{stats[3]}</strong> / {n}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-lg">Режимы</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <Link
            to="/learn"
            className="rounded-xl border border-sky-500/40 bg-sky-500/10 p-4 hover:bg-sky-500/15 min-h-touch flex flex-col gap-1"
          >
            <span className="font-semibold">Обучение</span>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Первый проход с подсветкой ответов и переводами
            </span>
          </Link>
          <Link
            to="/train"
            className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 hover:bg-emerald-500/15 min-h-touch flex flex-col gap-1"
          >
            <span className="font-semibold">SRS-тренировка</span>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Интервальные повторения (Лейтнер 0–3)
            </span>
          </Link>
          <Link
            to="/weak"
            className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 hover:bg-amber-500/15 min-h-touch flex flex-col gap-1"
          >
            <span className="font-semibold">Слабые места</span>
            <span className="text-sm text-slate-600 dark:text-slate-400">Ошибки и отмеченные «сложные»</span>
          </Link>
          <Link
            to="/exam"
            className="rounded-xl border border-violet-500/40 bg-violet-500/10 p-4 hover:bg-violet-500/15 min-h-touch flex flex-col gap-1"
          >
            <span className="font-semibold">Пробный экзамен</span>
            <span className="text-sm text-slate-600 dark:text-slate-400">35 вопросов, 35 минут</span>
          </Link>
          <Link
            to="/lightning"
            className="rounded-xl border border-slate-300 dark:border-slate-600 p-4 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-touch flex flex-col gap-1"
          >
            <span className="font-semibold">Молниеносный</span>
            <span className="text-sm text-slate-600 dark:text-slate-400">Ключ → ответ перед входом</span>
          </Link>
          <Link
            to="/search"
            className="rounded-xl border border-slate-300 dark:border-slate-600 p-4 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-touch flex flex-col gap-1"
          >
            <span className="font-semibold">Поиск по банку</span>
          </Link>
        </div>
      </section>

      <section className="rounded-xl bg-slate-100 dark:bg-slate-900 p-4 space-y-2 text-sm">
        <h2 className="font-semibold">Рекомендуемый план</h2>
        <ul className="list-disc pl-5 space-y-1 text-slate-700 dark:text-slate-300">
          <li>
            <strong>День 1:</strong> режим «Обучение» — пройти все {n} карточек.
          </li>
          <li>
            <strong>Дни 2–4:</strong> «SRS» по 1–1,5 часа.
          </li>
          <li>
            <strong>День 5:</strong> «Слабые места» + пробный экзамен.
          </li>
          <li>
            <strong>День экзамена:</strong> «Молниеносный» за 15 минут до начала.
          </li>
        </ul>
      </section>
    </div>
  );
}
