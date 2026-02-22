"use client";

import Link from "next/link";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, backHref, backLabel = "Назад", actions }: PageHeaderProps) {
  return (
    <header className="shrink-0 px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex items-center gap-4 bg-white/95 backdrop-blur">
      {backHref ? (
        <Link
          href={backHref}
          className="p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg transition shrink-0"
          aria-label={backLabel}
        >
          ←
        </Link>
      ) : null}
      <div className="flex-1 min-w-0">
        <h1 className="text-lg sm:text-xl font-semibold text-slate-900 truncate">{title}</h1>
        {subtitle ? (
          <p className="text-sm text-slate-600 truncate mt-0.5">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2 shrink-0">{actions}</div> : null}
    </header>
  );
}
