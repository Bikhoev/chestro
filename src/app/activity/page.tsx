"use client";

import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { ACTIVITIES } from "@/lib/constants";
import { PageShell } from "@/components/ui/PageShell";
import { PageHeader } from "@/components/ui/PageHeader";

export default function ActivityPage() {
  const router = useRouter();
  const { setActivity, selectedActivity } = useStore();

  const handleSelect = (id: typeof selectedActivity) => {
    if (!id) return;
    setActivity(id);
    router.push("/objects");
  };

  return (
    <PageShell>
      <PageHeader
        title="Выберите вид работ"
        subtitle="От выбора зависит логика замеров и подсчёта материалов"
        backHref="/"
        backLabel="Назад"
      />
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
    </PageShell>
  );
}
