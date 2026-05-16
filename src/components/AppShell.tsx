import { NavLink, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { useQuestionLang } from "../context/QuestionLangContext";

const linkCls = ({ isActive }: { isActive: boolean }) =>
  `min-h-touch px-3 py-2 rounded-lg text-sm font-medium ${
    isActive ? "bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900" : "hover:bg-slate-200 dark:hover:bg-slate-800"
  }`;

export default function AppShell() {
  const { questionUiRussian, setQuestionUiRussian } = useQuestionLang();
  const [dark, setDark] = useState(() => localStorage.getItem("theme") === "dark");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-3 py-3 flex flex-wrap gap-2 items-center justify-between">
          <NavLink to="/" className="font-semibold text-slate-900 dark:text-white">
            Экономика EN — тренажёр
          </NavLink>
          <nav className="flex flex-wrap gap-1 items-center">
            <NavLink to="/learn" className={linkCls}>
              Обучение
            </NavLink>
            <NavLink to="/train" className={linkCls}>
              SRS
            </NavLink>
            <NavLink to="/weak" className={linkCls}>
              Слабые
            </NavLink>
            <NavLink to="/exam" className={linkCls}>
              Экзамен
            </NavLink>
            <NavLink to="/lightning" className={linkCls}>
              Молния
            </NavLink>
            <NavLink to="/search" className={linkCls}>
              Поиск
            </NavLink>
            <NavLink to="/settings" className={linkCls}>
              ⚙︎
            </NavLink>
            <button
              type="button"
              title="Русские переводы из банка (подстрочник под английским текстом)"
              className={`min-h-touch px-3 rounded-lg border text-sm ${
                questionUiRussian
                  ? "border-sky-600 bg-sky-500/15 text-sky-800 dark:text-sky-200"
                  : "border-slate-300 dark:border-slate-600"
              }`}
              onClick={() => setQuestionUiRussian(!questionUiRussian)}
            >
              RU
            </button>
            <button
              type="button"
              className="min-h-touch px-3 rounded-lg border border-slate-300 dark:border-slate-600 text-sm"
              onClick={() => setDark(!dark)}
            >
              {dark ? "☀︎" : "☾"}
            </button>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-3xl w-full mx-auto px-3 py-6">
        <Outlet />
      </main>
    </div>
  );
}
