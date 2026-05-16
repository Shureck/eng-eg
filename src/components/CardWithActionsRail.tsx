import type { ReactNode } from "react";

const DEFAULT_RAIL =
  "w-full md:w-[12rem] shrink-0 md:sticky md:top-28 md:self-start flex flex-col gap-2";

/** Основной блок карточки слева, кнопки действий — узкая колонка справа (не прыгают по высоте контента) */
export function CardWithActionsRail({
  children,
  actions,
  railClassName,
  compact,
}: {
  children: ReactNode;
  actions: ReactNode;
  /** Заменить классы правой колонки (ширина, отступы и т.д.) */
  railClassName?: string;
  /** Узкие отступы (SRS / мобильный экран) */
  compact?: boolean;
}) {
  const gap = compact ? "gap-2 md:gap-3" : "gap-4 md:gap-6";
  const innerSpace = compact ? "space-y-2" : "space-y-4";
  return (
    <div className={`flex flex-col md:flex-row md:items-start ${gap}`}>
      <div className={`flex-1 min-w-0 ${innerSpace}`}>{children}</div>
      <div className={railClassName ?? DEFAULT_RAIL}>{actions}</div>
    </div>
  );
}
