"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { ACTIVITIES } from "@/lib/constants";

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

  const showEmptyState = !mounted || objects.length === 0;

  const handleDelete = (e: React.MouseEvent, objectId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window !== "undefined" && window.confirm("Удалить объект? Данные по замеру, смете и расходам будут потеряны.")) {
      deleteObject(objectId);
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex flex-col safe-top safe-bottom bg-surface">
      <header className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white/95 backdrop-blur">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Объекты</h1>
          <p className="text-sm text-slate-600">{activityLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/settings" className="btn-secondary px-4 py-2 text-sm">
            Настройки
          </Link>
          <Link href="/crm" className="btn-secondary px-4 py-2 text-sm">
            Статистика
          </Link>
          <Link
            href="/objects/new"
            className="flex items-center justify-center w-12 h-12 rounded-2xl bg-chestro-600 text-white shadow-lg shadow-chestro-600/25 hover:bg-chestro-700 active:scale-95 transition"
            aria-label="Добавить объект"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
              <path d="M12 5v14M5 12h14" />
            </svg>
          </Link>
        </div>
      </header>
      <main className="flex-1 px-6 py-6 overflow-auto">
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
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-slate-600 mb-2">Пока нет объектов</p>
            <p className="text-sm text-slate-500 mb-6">Нажмите + чтобы добавить первый объект</p>
            <Link href="/objects/new" className="btn-primary py-3 px-6">
              Добавить объект
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {objects.map((obj) => (
              <li key={obj.id} className="card p-5">
                <Link href={`/objects/${obj.id}`} className="block">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold text-slate-900">{obj.client.name}</div>
                    <div className="text-xs text-slate-500">
                      {obj.client.houseOrFlat === "house" ? "Дом" : "Квартира"}
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
    </div>
  );
}
