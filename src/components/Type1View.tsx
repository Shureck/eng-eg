import type { Type1Q } from "../types";
import type { CheatPair } from "../data/lightningCheatSheet";
import { CheatMnemonicLine, QuestionKeyOnlyLine } from "./CheatMnemonicLine";
import { speak } from "../lib/tts";

export function NegWarn({ on }: { on: boolean }) {
  if (!on) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-red-600/15 text-red-700 dark:text-red-400 px-2 py-1 text-sm font-semibold mb-2">
      ⚠ Отрицание в вопросе (NOT)
    </span>
  );
}

function stripQuestionIntro(en: string): string {
  return en
    .replace(/^Choose the correct variant\.\s*/i, "")
    .replace(/^Fill in the gap with the most appropriate word combination\.\s*/i, "")
    .trim();
}

export function Type1View({
  q,
  mode,
  showRu,
  questionUiRussian,
  cheatMnemonic,
  questionKeyOnly,
  promptVariant = "full",
  pick,
  onPick,
  reveal,
}: {
  q: Type1Q;
  mode: "learn" | "train" | "exam";
  /** Дублировать перевод под основным текстом (если основной язык интерфейса — англ.) */
  showRu: boolean;
  /** Основной текст вопроса и вариантов — русский (из translation_ru / options_ru) */
  questionUiRussian: boolean;
  /** Цветная шпаргалка «ключ → ответ» (SRS / обучение / слабые) */
  cheatMnemonic?: CheatPair | null;
  /** Строка «Ключ вопроса» без подсказки к ответу (если полная шпаргалка выключена) */
  questionKeyOnly?: string | null;
  /** SRS: только keyword_hint вместо полного текста вопроса */
  promptVariant?: "full" | "keyword";
  pick: string | null;
  onPick?: (k: string) => void;
  reveal: boolean;
}) {
  const disabledPick = mode === "learn" || reveal;

  const useKeywordOnly = promptVariant === "keyword" && mode === "train";

  const keywordOrFull =
    q.keyword_hint?.trim() ||
    (questionUiRussian ? q.translation_ru || q.question : q.question);

  const primaryQ = useKeywordOnly
    ? keywordOrFull
    : questionUiRussian
      ? q.translation_ru || q.question
      : q.question;
  const secondaryQ =
    useKeywordOnly
      ? null
      : mode !== "exam"
        ? questionUiRussian
          ? q.question
          : showRu
            ? q.translation_ru
            : null
        : null;

  return (
    <div className="space-y-4">
      <NegWarn on={q.hasNegation} />
      {cheatMnemonic && mode !== "exam" && (
        <CheatMnemonicLine dense hook={cheatMnemonic.hook} answerKey={cheatMnemonic.answerKey} className="mb-1" />
      )}
      {!cheatMnemonic && questionKeyOnly && mode !== "exam" && (
        <QuestionKeyOnlyLine dense hook={questionKeyOnly} className="mb-1" />
      )}
      <div className="flex gap-2 flex-wrap items-start">
        <div className="flex-1 space-y-2">
          <p className="text-lg leading-relaxed whitespace-pre-wrap">{primaryQ}</p>
          {secondaryQ && (
            <p className="text-sm text-slate-600 dark:text-slate-400 border-l-4 border-sky-500 pl-3 whitespace-pre-wrap">
              {questionUiRussian ? "English:" : "Перевод:"} {secondaryQ}
            </p>
          )}
        </div>
        {mode !== "exam" && (
          <button
            type="button"
            className="min-h-touch px-3 rounded-lg border border-slate-300 dark:border-slate-600 text-xl shrink-0"
            aria-label="Озвучить вопрос"
            onClick={() =>
              speak(
                useKeywordOnly
                  ? keywordOrFull
                  : questionUiRussian
                    ? q.translation_ru || stripQuestionIntro(q.question)
                    : stripQuestionIntro(q.question),
                questionUiRussian ? "ru-RU" : "en-US",
              )
            }
          >
            🔊
          </button>
        )}
      </div>
      <div className="grid gap-2">
        {q.options.map((o, idx) => {
          const isCorrect = o.key === q.correct;
          const picked = pick === o.key;
          const primaryOpt = questionUiRussian ? q.options_ru[idx] || o.text : o.text;
          const secondaryOpt =
            mode !== "exam"
              ? questionUiRussian
                ? o.text
                : showRu
                  ? q.options_ru[idx]
                  : null
              : null;

          let cls =
            "min-h-touch w-full text-left px-4 py-3 rounded-xl border transition flex flex-col gap-1 ";
          if (reveal || mode === "learn") {
            if (isCorrect) cls += "border-emerald-500 bg-emerald-500/10 font-medium ";
            else cls += "border-slate-200 dark:border-slate-700 opacity-70 ";
          } else {
            if (picked && !reveal) cls += "border-sky-600 bg-sky-500/10 ";
            else cls += "border-slate-200 dark:border-slate-700 hover:border-sky-400 ";
          }
          return (
            <button
              key={o.key}
              type="button"
              disabled={disabledPick}
              className={cls}
              onClick={() => !disabledPick && onPick?.(o.key)}
            >
              <span className="font-semibold">{o.key})</span> <span>{primaryOpt}</span>
              {secondaryOpt != null && secondaryOpt !== "" && (
                <span className="text-sm text-slate-600 dark:text-slate-400">{secondaryOpt}</span>
              )}
            </button>
          );
        })}
      </div>
      {(reveal || mode === "learn") && mode !== "exam" && (
        <div className="rounded-xl bg-slate-100 dark:bg-slate-900 p-4 space-y-2">
          <p className="text-sm text-slate-700 dark:text-slate-300">{q.explanation_ru}</p>
          <button
            type="button"
            className="min-h-touch px-3 rounded-lg border border-slate-300 dark:border-slate-600"
            onClick={() => {
              const idx = q.options.findIndex((x) => x.key === q.correct);
              const ru = idx >= 0 ? q.options_ru[idx] : "";
              const en = q.options.find((x) => x.key === q.correct)?.text;
              speak(questionUiRussian ? ru || en || "" : en || "", questionUiRussian ? "ru-RU" : "en-US");
            }}
          >
            🔊 Правильный ответ
          </button>
        </div>
      )}
    </div>
  );
}
