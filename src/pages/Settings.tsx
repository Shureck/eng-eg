import { useProgress } from "../hooks/useProgress";
import { buildProgressBackup, importProgressBackup, resetAllTrainerData } from "../lib/progressBackup";

export default function Settings() {
  const { refresh } = useProgress();

  async function exportJson() {
    const backup = await buildProgressBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `exam-progress-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function importJson(file: File) {
    const text = await file.text();
    const result = await importProgressBackup(text);
    await refresh();
    alert(
      result.format === "v2"
        ? `Импорт (полный бэкап): записей прогресса ${result.progressRows}. Страница будет перезагружена.`
        : `Импорт (старый формат): только коробки SRS, записей ${result.progressRows}. Страница будет перезагружена.`,
    );
    window.location.reload();
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-xl font-bold">Настройки</h1>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Прогресс хранится локально (IndexedDB и фрагменты в localStorage). Экспорт сохраняет коробки SRS, очередь и
        позицию в режиме SRS-тренировки, то же для «Слабых мест», а также место остановки в «Обучении». Файлы старого
        формата (простой массив) по-прежнему импортируются — восстанавливаются только записи по карточкам.
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="min-h-touch px-4 rounded-xl bg-sky-600 text-white font-medium" onClick={() => void exportJson()}>
          Экспорт прогресса
        </button>
        <label className="min-h-touch px-4 rounded-xl border border-slate-300 dark:border-slate-600 font-medium cursor-pointer inline-flex items-center">
          Импорт
          <input type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && void importJson(e.target.files[0])} />
        </label>
      </div>
      <button
        type="button"
        className="min-h-touch px-4 rounded-xl bg-red-600 text-white font-medium"
        onClick={() => {
          if (confirm("Сбросить весь прогресс (включая очереди SRS и слабых, позицию обучения)?")) {
            void resetAllTrainerData().then(() => refresh());
          }
        }}
      >
        Сбросить прогресс
      </button>
      <section className="text-sm text-slate-500 space-y-2">
        <p>
          Пересборка банка из PDF:{" "}
          <code className="bg-slate-100 dark:bg-slate-900 px-1 rounded">python3 scripts/build_bank.py</code> (опционально{" "}
          <code className="bg-slate-100 dark:bg-slate-900 px-1 rounded">--translate</code>).
        </p>
      </section>
    </div>
  );
}
