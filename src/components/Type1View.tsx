import type { Type1Q } from "../types";
import type { CheatPair } from "../data/lightningCheatSheet";
import { CheatMnemonicLine, QuestionKeyOnlyLine } from "./CheatMnemonicLine";
import { ruBelowEn, stripQuestionIntro } from "../lib/bilingualLines";
import { speak } from "../lib/tts";

export function NegWarn({ on, compact }: { on: boolean; compact?: boolean }) {
  if (!on) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md bg-red-600/15 text-red-700 dark:text-red-400 px-2 py-1 font-semibold ${
        compact ? "text-xs mb-1" : "text-sm mb-2"
      }`}
    >
      ⚠ Отрицание в вопросе (NOT)
    </span>
  );
}

export function Type1View({
  q,
  mode,
  showRu: _showRu,
  questionUiRussian: _questionUiRussian,
  cheatMnemonic,
  questionKeyOnly,
  promptVariant = "full",
  pick,
  onPick,
  reveal,
  compact,
}: {
  q: Type1Q;
  mode: "learn" | "train" | "exam";
  /** @deprecated перевод показывается под EN, если есть в банке и отличается */
  showRu: boolean;
  /** @deprecated порядок текста фиксирован: EN крупно, RU мелко */
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
  /** Компактная вёрстка (SRS — меньше вертикальных отступов) */
  compact?: boolean;
}) {
  const disabledPick = mode === "learn" || reveal;

  const useKeywordOnly = promptVariant === "keyword" && mode === "train";

  const questionEn = stripQuestionIntro(q.question);
  const keywordEn = q.keyword_hint?.trim() || questionEn;

  const primaryQ = useKeywordOnly ? keywordEn : questionEn;

  const secondaryQ =
    mode === "exam"
      ? null
      : useKeywordOnly
        ? ruBelowEn(primaryQ, q.translation_ru)
        : ruBelowEn(questionEn, q.translation_ru);

  const dense = !!compact;

  return (
    <div className={dense ? "space-y-2" : "space-y-4"}>
      <NegWarn on={q.hasNegation} compact={dense} />
      {cheatMnemonic && mode !== "exam" && (
        <CheatMnemonicLine dense hook={cheatMnemonic.hook} answerKey={cheatMnemonic.answerKey} className="mb-1" />
      )}
      {!cheatMnemonic && questionKeyOnly && mode !== "exam" && (
        <QuestionKeyOnlyLine dense hook={questionKeyOnly} className="mb-1" />
      )}
      <div className="flex gap-2 flex-wrap items-start">
        <div className={dense ? "flex-1 space-y-1" : "flex-1 space-y-2"}>
          <p
            className={`whitespace-pre-wrap font-medium text-slate-900 dark:text-slate-100 ${
              dense ? "text-base md:text-lg leading-snug" : "text-lg md:text-xl leading-relaxed"
            }`}
          >
            {primaryQ}
          </p>
          {secondaryQ && (
            <p
              className={`text-slate-600 dark:text-slate-400 border-l-4 border-sky-500/80 whitespace-pre-wrap leading-snug ${
                dense ? "text-xs pl-2" : "text-sm pl-3"
              }`}
            >
              {secondaryQ}
            </p>
          )}
        </div>
        {mode !== "exam" && (
          <button
            type="button"
            className={`min-h-touch rounded-lg border border-slate-300 dark:border-slate-600 shrink-0 ${
              dense ? "px-2 text-lg" : "px-3 text-xl"
            }`}
            aria-label="Озвучить вопрос"
            onClick={() =>
              speak(useKeywordOnly ? keywordEn : questionEn, "en-US")
            }
          >
            🔊
          </button>
        )}
      </div>
      <div className={dense ? "grid gap-1.5" : "grid gap-2"}>
        {q.options.map((o, idx) => {
          const isCorrect = o.key === q.correct;
          const picked = pick === o.key;
          const primaryOpt = o.text;
          const secondaryOpt = mode !== "exam" ? ruBelowEn(o.text, q.options_ru[idx]) : null;

          let cls = dense
            ? "min-h-touch w-full text-left px-3 py-2 rounded-lg border transition flex flex-col gap-0.5 "
            : "min-h-touch w-full text-left px-4 py-3 rounded-xl border transition flex flex-col gap-1 ";
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
              <span className="font-semibold">{o.key})</span>{" "}
              <span className={dense ? "text-sm md:text-base" : "text-base md:text-lg"}>{primaryOpt}</span>
              {secondaryOpt != null && secondaryOpt !== "" && (
                <span
                  className={`text-slate-600 dark:text-slate-400 block ${dense ? "text-xs mt-0" : "text-sm mt-0.5"}`}
                >
                  {secondaryOpt}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {(reveal || mode === "learn") && mode !== "exam" && (
        <div className={`rounded-xl bg-slate-100 dark:bg-slate-900 space-y-2 ${dense ? "p-3" : "p-4"}`}>
          <p className="text-sm text-slate-700 dark:text-slate-300">{q.explanation_ru}</p>
          <button
            type="button"
            className="min-h-touch px-3 rounded-lg border border-slate-300 dark:border-slate-600"
            onClick={() => {
              const idx = q.options.findIndex((x) => x.key === q.correct);
              const ru = idx >= 0 ? q.options_ru[idx] : "";
              const en = q.options.find((x) => x.key === q.correct)?.text;
              speak(en || ru || "", "en-US");
            }}
          >
            🔊 Правильный ответ
          </button>
        </div>
      )}
    </div>
  );
}
