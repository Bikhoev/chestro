"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store";
import type { AppState } from "@/lib/types";
import { PageShell } from "@/components/ui/PageShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageSkeleton } from "@/components/ui/Skeleton";

export default function SettingsPage() {
  const router = useRouter();
  const { objects, hasSkippedAuth, selectedActivity, replaceState } = useStore();
  const [mounted, setMounted] = useState(false);
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleExport = () => {
    if (typeof window === "undefined") return;
    const state: AppState = {
      hasSkippedAuth,
      userId: null,
      selectedActivity,
      objects: objects.map((o) => ({ ...o, invoices: o.invoices ?? [] })),
    };
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chestro-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError("");
    setImportSuccess(false);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw = reader.result as string;
        const parsed = JSON.parse(raw) as AppState;
        if (!parsed || !Array.isArray(parsed.objects)) {
          setImportError("Неверный формат файла: ожидается объект с полем objects");
          return;
        }
        const objCount = (parsed.objects ?? []).length;
        if (
          objCount > 0 &&
          !window.confirm(
            `Будет заменено ${objCount} объект(ов). Текущие данные будут потеряны. Продолжить?`
          )
        ) {
          e.target.value = "";
          return;
        }
        const normalized: AppState = {
          hasSkippedAuth: parsed.hasSkippedAuth ?? false,
          userId: parsed.userId ?? null,
          selectedActivity: parsed.selectedActivity ?? null,
          objects: (parsed.objects ?? []).map((o) => ({ ...o, invoices: o.invoices ?? [] })),
        };
        replaceState(normalized);
        setImportSuccess(true);
        e.target.value = "";
        setTimeout(() => router.push("/objects"), 800);
      } catch (err) {
        setImportError("Не удалось прочитать файл. Убедитесь, что это JSON-резервная копия Chestro.");
      }
    };
    reader.readAsText(file, "UTF-8");
  };

  if (!mounted) return <PageSkeleton />;

  return (
    <PageShell>
      <PageHeader title="Настройки" backHref="/objects" backLabel="К объектам" />

      <main className="flex-1 px-4 sm:px-6 py-6">
        <section className="card p-4 max-w-md">
        <h2 className="font-semibold text-slate-900 mb-2">Резервная копия</h2>
        <p className="text-sm text-slate-600 mb-4">
          Экспорт сохраняет все объекты, замеры, сметы, расходы и счета в один JSON-файл. Импорт заменяет текущие данные загруженным файлом.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button type="button" onClick={handleExport} className="btn-primary py-2.5 px-4">
            Экспорт в JSON
          </button>
          <label className="btn-secondary py-2.5 px-4 text-center cursor-pointer">
            Импорт из JSON
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
        {importError && <p className="text-sm text-red-600 mt-2">{importError}</p>}
        {importSuccess && <p className="text-sm text-green-600 mt-2">Данные загружены. Переход к объектам...</p>}
        </section>
      </main>
    </PageShell>
  );
}
