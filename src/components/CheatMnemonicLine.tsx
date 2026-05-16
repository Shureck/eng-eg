/** Цветные «якоря» для шпаргалки: ключ из формулировки ↔ ключ из ответа */

const HOOK_STYLES = [
  "rounded px-1 py-0.5 bg-amber-200/95 text-amber-950 dark:bg-amber-500/35 dark:text-amber-50 font-semibold",
  "rounded px-1 py-0.5 bg-orange-200/95 text-orange-950 dark:bg-orange-500/35 dark:text-orange-50 font-semibold",
];
const ANS_STYLES = [
  "rounded px-1 py-0.5 bg-violet-200/95 text-violet-950 dark:bg-violet-500/35 dark:text-violet-50 font-semibold",
  "rounded px-1 py-0.5 bg-sky-200/95 text-sky-950 dark:bg-sky-500/35 dark:text-sky-50 font-semibold",
];

function splitHook(hook: string): string[] {
  return hook
    .split(/\s*\/\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Ответ: буквы через запятую, пары 1-b, либо фразы через «/», либо одна строка */
export function splitAnswerKey(answerKey: string): string[] {
  const t = answerKey.trim();
  if (/^\d+\s*-\s*[a-z]/i.test(t) && t.includes(",")) {
    return t.split(",").map((s) => s.trim()).filter(Boolean);
  }
  if (/^([A-Za-z]\s*,\s*)+[A-Za-z]\s*$/.test(t)) {
    return t.split(",").map((s) => s.trim());
  }
  if (/\s\/\s/.test(t)) {
    return t.split(/\s*\/\s*/).map((s) => s.trim()).filter(Boolean);
  }
  return [t];
}

export function QuestionKeyOnlyLine({
  hook,
  dense = false,
  className = "",
}: {
  hook: string;
  dense?: boolean;
  className?: string;
}) {
  const t = hook.trim();
  if (!t) return null;
  const hParts = splitHook(t);
  if (hParts.length === 0) return null;
  const gap = dense ? "gap-1" : "gap-2";
  const textSize = dense ? "text-xs" : "text-sm";

  return (
    <div className={`flex flex-wrap items-baseline ${gap} ${textSize} ${className}`}>
      <span className="text-slate-500 dark:text-slate-400 shrink-0">Ключ вопроса:</span>
      <span className="flex flex-wrap items-baseline gap-x-1 gap-y-1">
        {hParts.map((p, i) => (
          <mark key={`qk-${i}`} className={HOOK_STYLES[i % HOOK_STYLES.length]}>
            {p}
          </mark>
        ))}
      </span>
    </div>
  );
}

export function CheatMnemonicLine({
  hook,
  answerKey,
  className = "",
  dense = false,
}: {
  hook: string;
  answerKey: string;
  className?: string;
  /** меньше отступы под карточку SRS */
  dense?: boolean;
}) {
  const hParts = splitHook(hook);
  const aParts = splitAnswerKey(answerKey);
  const gap = dense ? "gap-1" : "gap-2";
  const textSize = dense ? "text-xs" : "text-sm";

  return (
    <div className={`flex flex-wrap items-baseline ${gap} ${textSize} ${className}`}>
      <span className="text-slate-500 dark:text-slate-400 shrink-0">Шпаргалка:</span>
      <span className="flex flex-wrap items-baseline gap-x-1 gap-y-1">
        {hParts.map((p, i) => (
          <mark key={`h-${i}`} className={HOOK_STYLES[i % HOOK_STYLES.length]}>
            {p}
          </mark>
        ))}
      </span>
      <span className="text-slate-400 shrink-0">→</span>
      <span className="flex flex-wrap items-baseline gap-x-1 gap-y-1">
        {aParts.map((p, i) => (
          <mark key={`a-${i}`} className={ANS_STYLES[i % ANS_STYLES.length]}>
            {p}
          </mark>
        ))}
      </span>
    </div>
  );
}
