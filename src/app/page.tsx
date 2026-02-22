"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { Skeleton } from "@/components/ui/Skeleton";

export default function HomePage() {
  const router = useRouter();
  const { hasSkippedAuth, selectedActivity, skipAuth } = useStore();
  const { user, logout } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (hasSkippedAuth && selectedActivity) {
      router.replace("/objects");
      return;
    }
    if (hasSkippedAuth && !selectedActivity) {
      router.replace("/activity");
    }
  }, [mounted, hasSkippedAuth, selectedActivity, router]);

  if (!mounted || (hasSkippedAuth && !selectedActivity)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-surface">
        <Skeleton className="h-12 w-48 mb-4" />
        <Skeleton className="h-4 w-64 mb-8" />
        <Skeleton className="h-12 w-full max-w-sm" />
      </div>
    );
  }

  if (hasSkippedAuth && selectedActivity) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-surface">
        <Skeleton className="h-12 w-48 mb-4" />
        <Skeleton className="h-4 w-64" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col safe-top safe-bottom bg-surface">
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-sm w-full">
          <div className="card p-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-chestro-600/10 text-chestro-700 flex items-center justify-center text-2xl font-bold">
              C
            </div>
            <h1 className="mt-4 text-3xl font-bold text-slate-900 tracking-tight">Chestro</h1>
            <p className="mt-2 text-slate-600">
              Умный учёт объектов, замеров и смет для строителей
            </p>

            <div className="mt-6 grid grid-cols-2 gap-2 text-xs text-slate-600">
              <div className="rounded-2xl bg-slate-100/80 px-3 py-2">Замеры</div>
              <div className="rounded-2xl bg-slate-100/80 px-3 py-2">Сметы</div>
              <div className="rounded-2xl bg-slate-100/80 px-3 py-2">Расходы</div>
              <div className="rounded-2xl bg-slate-100/80 px-3 py-2">Материалы</div>
            </div>

            {user && (
              <p className="mt-4 text-sm text-slate-600">
                Вы вошли как <span className="font-medium text-slate-800">{user.name}</span>
              </p>
            )}
            <div className="mt-8 flex flex-col gap-3">
              {!user ? (
                <>
                  <button
                    type="button"
                    onClick={() => router.push("/login")}
                    className="btn-primary w-full py-3.5 text-base"
                  >
                    Войти
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/register")}
                    className="btn-secondary w-full py-3.5 text-base"
                  >
                    Регистрация
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => logout()}
                  className="btn-secondary w-full py-3.5 text-base"
                >
                  Выйти
                </button>
              )}
              <Link
                href="/activity"
                onClick={() => skipAuth()}
                className="btn-ghost w-full py-3 text-center"
              >
                Продолжить без входа
              </Link>
              <p className="text-xs text-slate-500 mt-1">
                Далее выберите вид работ (штукатурка, плитка и др.)
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
