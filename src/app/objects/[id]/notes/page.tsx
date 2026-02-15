"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useStore } from "@/lib/store";
import type { ObjectProject } from "@/lib/types";
import { ACTIVITIES } from "@/lib/constants";
import { getMeasurementSummary, formatRubles, round2 } from "@/lib/calculations";

function buildAutoSummary(obj: ObjectProject) {
  const activityLabel =
    ACTIVITIES.find((a) => a.id === obj.activityType)?.label ?? "Не выбрано";
  const summary = getMeasurementSummary(obj.rooms, obj.walls);
  const totalVolume = round2(summary.totalWallSqM + summary.slopesLinearM);
  const totalEstimate = round2(
    obj.estimate.reduce((sum, item) => sum + item.total, 0)
  );
  const totalExpenses = round2(
    obj.expenses.reduce((sum, e) => sum + e.amount, 0)
  );
  const overrunExpenses = round2(
    obj.expenses
      .filter((e) => e.category === "overrun")
      .reduce((sum, e) => sum + e.amount, 0)
  );
  const totalAdvances = round2(
    obj.advances.reduce((sum, a) => sum + a.amount, 0)
  );
  const clientInfoLines = [
    obj.client.name ? `Клиент: ${obj.client.name}` : null,
    obj.client.location ? `Адрес: ${obj.client.location}` : null,
    obj.client.houseOrFlat
      ? `Тип объекта: ${obj.client.houseOrFlat === "apartment" ? "Квартира" : "Дом"}`
      : null,
    obj.client.phone ? `Телефон: ${obj.client.phone}` : null,
    obj.client.comment ? `Комментарий: ${obj.client.comment}` : null,
  ].filter(Boolean);
  const lines: string[] = [
    `Объект Chestro — краткое саммари`,
    "",
    ...(clientInfoLines as string[]),
    `Вид работ: ${activityLabel}`,
    obj.dateStart || obj.dateEnd
      ? `Сроки: ${obj.dateStart ?? "—"} — ${obj.dateEnd ?? "—"}`
      : "",
    "",
    "Замеры:",
    `• Сухие помещения: ${summary.dryRoomsSqM.toFixed(2)} м²`,
    `• Санузлы: ${summary.wetRoomsSqM.toFixed(2)} м²`,
    `• Откосы: ${summary.slopesLinearM.toFixed(2)} м.п.`,
    `• Итоговый объём (стены м² + откосы м.п.): ${totalVolume.toFixed(2)}`,
    "",
    "Смета:",
    `• Всего по смете: ${formatRubles(totalEstimate)}`,
    "",
    "Расходы:",
    `• Всего расходов: ${formatRubles(totalExpenses)}`,
    `• Перерасход (на клиенте): ${formatRubles(overrunExpenses)}`,
    "",
    "Авансы:",
    `• Всего авансов: ${formatRubles(totalAdvances)}`,
  ].filter((line) => line !== "");
  return lines.join("\n");
}

export default function NotesPage() {
  const params = useParams();
  const id = params.id as string;
  const { getObject, addNote, updateObject } = useStore();
  const [text, setText] = useState("");
  const [summaryText, setSummaryText] = useState("");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const obj = mounted ? getObject(id) : null;

  useEffect(() => {
    if (!obj) return;
    setSummaryText(obj.summaryNote ?? buildAutoSummary(obj));
  }, [obj?.id, obj?.summaryNote, obj?.updatedAt]);

  if (!mounted) return <div className="px-6 py-6" />;
  if (!obj) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    addNote(id, t);
    setText("");
  };

  const handleSaveSummary = () => {
    const value = summaryText.trim();
    updateObject(id, { summaryNote: value || undefined });
  };

  const handleCopySummary = async () => {
    const value = summaryText.trim();
    if (!value) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="px-6 py-6 space-y-6">
      <section className="card p-4 space-y-3">
        <h2 className="font-semibold text-slate-900">Саммари по объекту</h2>
        <p className="text-xs text-slate-500">
          Здесь собрана основная информация по объекту. Можно отредактировать и
          скопировать одним нажатием.
        </p>
        <textarea
          value={summaryText}
          onChange={(e) => setSummaryText(e.target.value)}
          className="input-field min-h-[180px] resize-y text-sm"
          rows={6}
        />
        <div className="flex gap-2">
          <button
            type="button"
            className="btn-secondary flex-1"
            onClick={handleCopySummary}
          >
            Скопировать текст
          </button>
          <button
            type="button"
            className="btn-primary flex-1"
            onClick={handleSaveSummary}
          >
            Сохранить саммари
          </button>
        </div>
      </section>

      <section className="card p-4">
        <h2 className="font-semibold text-slate-900 mb-3">Новая заметка</h2>
        <form onSubmit={handleAdd} className="space-y-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="input-field min-h-[100px] resize-y"
            placeholder="Заметка по объекту..."
            rows={4}
          />
          <button type="submit" className="btn-primary w-full">
            Добавить
          </button>
        </form>
      </section>

      {obj.notes.length === 0 ? (
        <p className="text-center text-slate-500 text-sm">Пока нет заметок.</p>
      ) : (
        <ul className="space-y-3">
          {obj.notes
            .slice()
            .reverse()
            .map((note, i) => (
              <li key={i} className="card p-4">
                <p className="text-slate-800 whitespace-pre-wrap">{note}</p>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
