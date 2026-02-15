"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store";

type Tab = { path: string; label: string };
type TabWithShort = Tab & { shortLabel?: string };

const MAIN_TABS: Tab[] = [{ path: "", label: "Обзор" }];
const WORK_TABS: Tab[] = [
  { path: "/measurement", label: "Замеры" },
  { path: "/estimate", label: "Смета" },
];
const FINANCE_TABS: Tab[] = [
  { path: "/expenses", label: "Расходы" },
  { path: "/advances", label: "Авансы" },
];
const MORE_TABS: TabWithShort[] = [
  { path: "/materials", label: "Материалы", shortLabel: "Матер." },
  { path: "/invoices", label: "Счета", shortLabel: "Счета" },
];
const STANDALONE_TABS: Tab[] = [{ path: "/notes", label: "Заметки" }];

export default function ObjectLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const id = params.id as string;
  const { getObject } = useStore();
  const [mounted, setMounted] = useState(false);
  const [openMenu, setOpenMenu] = useState<"work" | "finance" | "more" | null>(null);
  const [dropdownRect, setDropdownRect] = useState<{ top: number; right: number } | null>(null);
  const workRef = useRef<HTMLDivElement>(null);
  const financeRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => setOpenMenu(null), [pathname]);

  const openDropdown = useCallback((menu: "work" | "finance" | "more") => {
    const ref = menu === "work" ? workRef.current : menu === "finance" ? financeRef.current : moreRef.current;
    if (ref && typeof window !== "undefined") {
      const rect = ref.getBoundingClientRect();
      setDropdownRect({ top: rect.bottom + 8, right: Math.min(rect.right, window.innerWidth - 16) });
    } else {
      setDropdownRect(null);
    }
    setOpenMenu(menu);
  }, []);

  useEffect(() => {
    if (!openMenu) {
      setDropdownRect(null);
      return;
    }
    const close = (e: MouseEvent) => {
      const target = e.target as Node;
      const ref =
        openMenu === "work" ? workRef.current : openMenu === "finance" ? financeRef.current : moreRef.current;
      if (ref && !ref.contains(target)) setOpenMenu(null);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [openMenu]);

  const obj = mounted ? getObject(id) : null;

  if (mounted && !obj) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <p className="text-slate-600">Объект не найден</p>
        <Link href="/objects" className="btn-primary mt-4">
          К списку объектов
        </Link>
      </div>
    );
  }

  const basePath = `/objects/${id}`;
  const currentPath = pathname.replace(basePath, "").replace(/^\//, "") || "";
  const activeSegment = currentPath.split("/")[0] || "";
  const isInWork = WORK_TABS.some((t) => t.path.replace(/^\//, "") === activeSegment);
  const isInFinance = FINANCE_TABS.some((t) => t.path.replace(/^\//, "") === activeSegment);
  const isInMore = MORE_TABS.some((t) => t.path.replace(/^\//, "") === activeSegment);
  const activeWorkLabel = WORK_TABS.find((t) => t.path.replace(/^\//, "") === activeSegment)?.label;
  const activeFinanceLabel = FINANCE_TABS.find((t) => t.path.replace(/^\//, "") === activeSegment)?.label;
  const activeMoreTab = MORE_TABS.find((t) => t.path.replace(/^\//, "") === activeSegment);
  const activeMoreLabel = activeMoreTab?.shortLabel ?? activeMoreTab?.label ?? "Ещё";
  const title = obj?.client.name ?? "—";
  const subtitle = obj?.client.location ?? "—";

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col safe-top safe-bottom bg-surface overflow-x-hidden w-full max-w-[100vw] box-border">
      <header className="shrink-0 border-b border-slate-100 w-full max-w-[100vw] box-border relative z-20 bg-white/95 backdrop-blur">
        <div className="flex items-center gap-3 px-4 sm:px-6 py-4 min-w-0">
          <Link href="/objects" className="p-2 -ml-2 text-slate-600 shrink-0" aria-label="Назад">
            ←
          </Link>
          <div className="flex-1 min-w-0 overflow-hidden">
            <h1 className="text-lg font-semibold text-slate-900 truncate">{title}</h1>
            <p className="text-sm text-slate-600 truncate">{subtitle}</p>
          </div>
        </div>

        <nav
          className="flex items-stretch gap-2 px-4 sm:px-6 pb-4 pt-0.5 pr-2 overflow-x-auto overflow-y-hidden scrollbar-hide tabs-scroll w-full min-w-0"
          role="tablist"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {MAIN_TABS.map((tab) => {
            const segment = tab.path ? tab.path.replace(/^\//, "") : "";
            const isActive = segment === activeSegment;
            const href = tab.path ? `${basePath}${tab.path}` : basePath;
            return (
              <Link
                key={tab.path || "overview"}
                href={href}
                role="tab"
                aria-selected={isActive}
                className={`shrink-0 px-4 py-2.5 rounded-2xl text-sm font-medium whitespace-nowrap transition-all duration-200 active:scale-95 ${
                  isActive ? "bg-chestro-600 text-white shadow-md shadow-chestro-600/20" : "text-slate-600 hover:bg-slate-100 hover:scale-[1.02]"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}

          <div className="relative shrink-0" ref={workRef}>
            <button
              type="button"
              onClick={() => (openMenu === "work" ? setOpenMenu(null) : openDropdown("work"))}
              aria-expanded={openMenu === "work"}
              aria-haspopup="true"
              className={`shrink-0 px-4 py-2.5 rounded-2xl text-sm font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-1 active:scale-95 ${
                isInWork ? "bg-chestro-600 text-white shadow-md shadow-chestro-600/20" : "text-slate-600 hover:bg-slate-100 hover:scale-[1.02]"
              }`}
            >
              {isInWork && activeWorkLabel ? activeWorkLabel : "Работы"}
              <span className="text-slate-200/80" aria-hidden>▾</span>
            </button>
          </div>

          <div className="relative shrink-0" ref={financeRef}>
            <button
              type="button"
              onClick={() => (openMenu === "finance" ? setOpenMenu(null) : openDropdown("finance"))}
              aria-expanded={openMenu === "finance"}
              aria-haspopup="true"
              className={`shrink-0 px-4 py-2.5 rounded-2xl text-sm font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-1 active:scale-95 ${
                isInFinance ? "bg-chestro-600 text-white shadow-md shadow-chestro-600/20" : "text-slate-600 hover:bg-slate-100 hover:scale-[1.02]"
              }`}
            >
              {isInFinance && activeFinanceLabel ? activeFinanceLabel : "Финансы"}
              <span className="text-slate-200/80" aria-hidden>▾</span>
            </button>
          </div>

          {STANDALONE_TABS.map((tab) => {
            const segment = tab.path ? tab.path.replace(/^\//, "") : "";
            const isActive = segment === activeSegment;
            const href = tab.path ? `${basePath}${tab.path}` : basePath;
            return (
              <Link
                key={tab.path || "notes"}
                href={href}
                role="tab"
                aria-selected={isActive}
                className={`shrink-0 px-4 py-2.5 rounded-2xl text-sm font-medium whitespace-nowrap transition-all duration-200 active:scale-95 ${
                  isActive ? "bg-chestro-600 text-white shadow-md shadow-chestro-600/20" : "text-slate-600 hover:bg-slate-100 hover:scale-[1.02]"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}

          <div className="relative shrink-0" ref={moreRef}>
            <button
              type="button"
              onClick={() => (openMenu === "more" ? setOpenMenu(null) : openDropdown("more"))}
              aria-expanded={openMenu === "more"}
              aria-haspopup="true"
              className={`shrink-0 px-4 py-2.5 rounded-2xl text-sm font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-1 active:scale-95 ${
                isInMore ? "bg-chestro-600 text-white shadow-md shadow-chestro-600/20" : "text-slate-600 hover:bg-slate-100 hover:scale-[1.02]"
              }`}
            >
              {isInMore && activeMoreLabel ? activeMoreLabel : "Ещё"}
              <span className="text-slate-200/80" aria-hidden>▾</span>
            </button>
          </div>
        </nav>
      </header>

      {mounted &&
        openMenu &&
        dropdownRect &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed py-1.5 bg-white border border-slate-200 rounded-2xl shadow-2xl min-w-[10rem] w-max max-w-[calc(100vw-2rem)] z-[9999]"
            role="menu"
            style={{
              top: dropdownRect.top,
              right: typeof window !== "undefined" ? window.innerWidth - dropdownRect.right : 0,
            }}
          >
            {(openMenu === "work" ? WORK_TABS : openMenu === "finance" ? FINANCE_TABS : MORE_TABS).map(
              (tab) => {
                const segment = tab.path.replace(/^\//, "");
                const isActive = segment === activeSegment;
                const href = `${basePath}${tab.path}`;
                return (
                  <Link
                    key={tab.path}
                    href={href}
                    role="menuitem"
                    onClick={() => setOpenMenu(null)}
                    className={`block w-full px-4 py-2.5 text-sm font-medium whitespace-nowrap text-left ${
                      isActive ? "bg-chestro-50 text-chestro-800" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {tab.label}
                  </Link>
                );
              }
            )}
          </div>,
          document.body
        )}

      <main className="flex-1 overflow-x-hidden overflow-y-auto min-h-0 w-full max-w-[100vw] box-border relative z-0">
        {children}
      </main>
    </div>
  );
}
