"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { BottomNav } from "@/components/nav/BottomNav";

/** Маршруты, на которых показывается bottom nav (mobile) и desktop toolbar */
const MAIN_ROUTES = ["/objects", "/crm", "/settings", "/activity"];

function showMainNav(pathname: string): boolean {
  if (pathname === "/" || pathname === "/login" || pathname === "/register") return false;
  if (pathname.startsWith("/objects/") && pathname !== "/objects" && pathname !== "/objects/new") return false;
  return MAIN_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNav = showMainNav(pathname);

  if (showNav) {
    return (
      <div className="flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden">
        {/* Desktop: компактный toolbar сверху */}
        <div className="hidden sm:block shrink-0 z-20 bg-white/95 backdrop-blur border-b border-slate-100 safe-top">
          <div className="flex items-center justify-between px-4 sm:px-6 h-12">
            <div className="flex items-center gap-4">
              <Link href="/objects" className="text-sm font-medium text-slate-700 hover:text-chestro-600 transition">
                Объекты
              </Link>
              <Link href="/crm" className="text-sm font-medium text-slate-700 hover:text-chestro-600 transition">
                Статистика
              </Link>
              <Link href="/settings" className="text-sm font-medium text-slate-700 hover:text-chestro-600 transition">
                Настройки
              </Link>
            </div>
          </div>
        </div>

        {/* Скроллируемая область */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          {children}
        </div>

        <BottomNav />
      </div>
    );
  }

  return <>{children}</>;
}
