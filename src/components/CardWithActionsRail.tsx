import type { ReactNode } from "react";

const DEFAULT_RAIL =
  "w-full md:w-[12rem] shrink-0 md:sticky md:top-28 md:self-start flex flex-col gap-2";

/** Основной блок карточки слева, кнопки действий — узкая колонка справа (не прыгают по высоте контента) */
export function CardWithActionsRail({
  children,
  actions,
  railClassName,
}: {
  children: ReactNode;
  actions: ReactNode;
  /** Заменить классы правой колонки (ширина, отступы и т.д.) */
  railClassName?: string;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
      <div className="flex-1 min-w-0 space-y-4">{children}</div>
      <div className={railClassName ?? DEFAULT_RAIL}>{actions}</div>
    </div>
  );
}
