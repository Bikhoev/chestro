"use client";

interface PageShellProps {
  children: React.ReactNode;
  /** Отступ снизу для bottom nav (mobile). По умолчанию true если используется AppShell с nav */
  withBottomPadding?: boolean;
}

export function PageShell({ children, withBottomPadding = true }: PageShellProps) {
  return (
    <div
      className={`min-h-full flex flex-col safe-top safe-bottom bg-surface overflow-x-hidden max-w-[100vw] ${
        withBottomPadding ? "pb-4" : ""
      }`}
    >
      {children}
    </div>
  );
}
