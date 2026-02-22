"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { ACTIVITIES } from "@/lib/constants";
import { formatRubles, round2 } from "@/lib/calculations";
import { PageShell } from "@/components/ui/PageShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageSkeleton } from "@/components/ui/Skeleton";

const HINT_KEY = "chestro_seen_export_hint";

export default function ObjectsPage() {
  const router = useRouter();
  const { objects, selectedActivity, deleteObject } = useStore();
  const [mounted, setMounted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem(HINT_KEY) && objects.length > 0) {
      setShowHint(true);
    }
  }, [objects.length]);

  const dismissHint = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(HINT_KEY, "1");
      setShowHint(false);
    }
  };

  const activityLabel = mounted
    ? (ACTIVITIES.find((a) => a.id === selectedActivity)?.label ?? "Объекты")
    : "Объекты";

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"updated" | "date">("updated");

  const showEmptyState = objects.length === 0;

  const filteredObjects = objects
    .filter((o) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        o.client.name.toLowerCase().includes(q) ||
        o.client.location.toLowerCase().includes(q) ||
        (o.client.phone ?? "").includes(q)
      );
    })
    .slice()
    .sort((a, b) => {
      if (sortBy === "updated") return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      const da = a.dateStart ?? a.createdAt;
      const db = b.dateStart ?? b.createdAt;
      return new Date(db).getTime() - new Date(da).getTime();
    });

  const handleDelete = (e: React.MouseEvent, objectId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window !== "undefined" && window.confirm("Удалить объект? Данные по замеру, смете и расходам будут потеряны.")) {
      deleteObject(objectId);
      router.refresh();
    }
  };

  if (!mounted) return <PageSkeleton />;

  return (
    <PageShell>
      <PageHeader
        title="Объекты"
        subtitle={activityLabel}
        actions={
          <Link
            href="/objects/new"
            className="flex items-center justify-center w-12 h-12 rounded-2xl bg-chestro-600 text-white shadow-lg shadow-chestro-600/25 hover:bg-chestro-700 active:scale-95 transition"
            aria-label="Добавить объект"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
              <path d="M12 5v14M5 12h14" />
            </svg>
          </Link>
        }
      />
      <main className="flex-1 px-4 sm:px-6 py-6 overflow-auto">
        {!showEmptyState && (
          <div className="mb-5 p-4 rounded-2xl bg-white/80 backdrop-blur border border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.04)]">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-sm">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" aria-hidden>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                </span>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Поиск по клиенту, адресу..."
                  className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:border-chestro-500 focus:ring-4 focus:ring-chestro-500/15 outline-none transition-all hover:border-slate-300"
                  aria-label="Поиск объектов"
                />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <label htmlFor="sort-objects" className="text-sm text-slate-500 shrink-0">
                  Сортировка:
                </label>
                <select
                  id="sort-objects"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "updated" | "date")}
                  className="input-field w-full sm:w-auto sm:min-w-[180px] py-3"
                >
                  <option value="updated">По обновлению</option>
                  <option value="date">По дате начала</option>
                </select>
              </div>
            </div>
          </div>
        )}
        {showHint && (
          <div className="mb-4 p-3 rounded-2xl bg-chestro-50 border border-chestro-200 flex items-center justify-between gap-2">
            <p className="text-sm text-chestro-800">
              Резервная копия: в <Link href="/settings" className="font-medium underline">Настройках</Link> можно экспортировать и импортировать данные (JSON).
            </p>
            <button type="button" onClick={dismissHint} className="p-1.5 text-chestro-600 hover:text-chestro-800 rounded-lg shrink-0" aria-label="Закрыть">
              ✕
            </button>
          </div>
        )}
        {showEmptyState ? (
          <EmptyState
            title="Пока нет объектов"
            description="Нажмите + чтобы добавить первый объект"
            action={
              <Link href="/objects/new" className="btn-primary py-3 px-6">
                Добавить объект
              </Link>
            }
          />
        ) : (
          <ul className="space-y-4">
            {filteredObjects.map((obj) => (
              <li key={obj.id} className="card p-5">
                <Link href={`/objects/${obj.id}`} className="block">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold text-slate-900">{obj.client.name}</div>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {obj.client.houseOrFlat === "house" ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">Дом</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">Кв.</span>
                      )}
                      {(obj.invoices ?? []).length > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-chestro-100 text-chestro-700">
                          {(obj.invoices ?? []).length} сч.
                        </span>
                      )}
                      {(() => {
                        const expNonOver = obj.expenses.filter((e) => e.category !== "overrun");
                        const debt = round2(
                          expNonOver
                            .filter((e) => e.paid === false)
                            .reduce((s, e) => s + e.amount - (e.remainderAmount ?? 0), 0)
                        );
                        return debt > 0 ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Долг {formatRubles(debt)}</span>
                        ) : null;
                      })()}
                    </div>
                  </div>
                  <div className="text-sm text-slate-600 mt-1">{obj.client.location}</div>
                  {obj.client.phone ? (
                    <div className="text-xs text-slate-500 mt-1.5">Телефон: {obj.client.phone}</div>
                  ) : null}
                </Link>
                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                  <Link href={`/objects/${obj.id}/edit`} className="btn-secondary py-2 px-4 text-sm flex-1 text-center">
                    Изменить
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, obj.id)}
                    className="py-2 px-4 text-sm font-medium text-red-600 border border-red-200 rounded-xl hover:bg-red-50"
                  >
                    Удалить
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </PageShell>
  );
}
