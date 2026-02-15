"use client";

import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { ACTIVITIES } from "@/lib/constants";

export default function ActivityPage() {
  const router = useRouter();
  const { setActivity, selectedActivity } = useStore();

  const handleSelect = (id: typeof selectedActivity) => {
    if (!id) return;
    setActivity(id);
    router.push("/objects");
  };

  return (
    <div className="min-h-screen flex flex-col safe-top safe-bottom bg-surface overflow-x-hidden max-w-[100vw]">
      <header className="px-4 sm:px-6 py-5 border-b border-slate-100 bg-white/95 backdrop-blur">
        <h1 className="text-xl font-semibold text-slate-900">Выберите вид работ</h1>
        <p className="mt-1 text-slate-600 text-sm">
          От выбора зависит логика замеров и подсчёта материалов
        </p>
      </header>
      <main className="flex-1 px-4 sm:px-6 py-6 overflow-x-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ACTIVITIES.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => handleSelect(a.id)}
              className="card p-4 text-left flex items-center justify-between hover:border-chestro-200 hover:bg-chestro-50/40 transition"
            >
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wide">Направление</div>
                <div className="font-semibold text-slate-800 mt-1">{a.label}</div>
              </div>
              <span className="text-slate-400">→</span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
