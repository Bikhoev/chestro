"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { formatRubles } from "@/lib/calculations";
import type { Advance } from "@/lib/types";

export default function AdvancesPage() {
  const params = useParams();
  const id = params.id as string;
  const { getObject, addAdvance, deleteAdvance, updateAdvance } = useStore();
  const obj = getObject(id);
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("Материалы");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [editingAdvance, setEditingAdvance] = useState<Advance | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editPurpose, setEditPurpose] = useState("");
  const [editDate, setEditDate] = useState("");

  if (!obj) return null;

  const total = obj.advances.reduce((s, a) => s + a.amount, 0);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(amount.replace(",", "."));
    if (!value || value <= 0) return;
    addAdvance(id, { date, amount: value, purpose: purpose.trim() || "Аванс" });
    setAmount("");
    setPurpose("Материалы");
    setDate(new Date().toISOString().slice(0, 10));
  };

  const startEdit = (adv: Advance) => {
    setEditingAdvance(adv);
    setEditAmount(String(adv.amount));
    setEditPurpose(adv.purpose);
    setEditDate(adv.date.slice(0, 10));
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdvance) return;
    const value = parseFloat(editAmount.replace(",", "."));
    if (!value || value <= 0) return;
    updateAdvance(id, editingAdvance.id, {
      date: editDate,
      amount: value,
      purpose: editPurpose.trim() || "Аванс",
    });
    setEditingAdvance(null);
  };

  const cancelEdit = () => {
    setEditingAdvance(null);
  };

  return (
    <div className="px-6 py-6 space-y-6">
      <section className="card p-4">
        <h2 className="font-semibold text-slate-900 mb-1">Всего авансов</h2>
        <p className="text-2xl font-bold text-chestro-700">{formatRubles(total)}</p>
        <p className="text-xs text-slate-500 mt-1">Получено с объекта на материалы и др.</p>
      </section>

      <section className="card p-4">
        <h2 className="font-semibold text-slate-900 mb-3">Добавить аванс</h2>
        <form onSubmit={handleAdd} className="space-y-3">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Сумма, ₽</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-field"
              placeholder="0"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Назначение</label>
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="input-field"
              placeholder="Материалы, аренда инструмента..."
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Дата</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input-field"
            />
          </div>
          <button type="submit" className="btn-primary w-full">
            Добавить аванс
          </button>
        </form>
      </section>

      {editingAdvance && (
        <section className="card p-4 border-2 border-chestro-200">
          <h2 className="font-semibold text-slate-900 mb-3">Изменить аванс</h2>
          <form onSubmit={handleUpdate} className="space-y-3">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Сумма, ₽</label>
              <input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Назначение</label>
              <input type="text" value={editPurpose} onChange={(e) => setEditPurpose(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Дата</label>
              <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="input-field" />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary flex-1">Сохранить</button>
              <button type="button" onClick={cancelEdit} className="btn-secondary">Отмена</button>
            </div>
          </form>
        </section>
      )}

      {obj.advances.length > 0 && (
        <section>
          <h2 className="font-semibold text-slate-900 mb-3">История</h2>
          <ul className="space-y-2">
            {obj.advances
              .slice()
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((adv) => (
                <li key={adv.id} className="card p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900">{adv.purpose}</p>
                    <p className="text-xs text-slate-500">{new Date(adv.date).toLocaleDateString("ru-RU")}</p>
                  </div>
                  <p className="font-semibold text-chestro-700 shrink-0">{formatRubles(adv.amount)}</p>
                  <div className="flex items-center gap-1 shrink-0">
                    <button type="button" onClick={() => startEdit(adv)} className="p-2 text-slate-500 hover:text-chestro-600 rounded-lg text-sm">Изменить</button>
                    <button type="button" onClick={() => deleteAdvance(id, adv.id)} className="p-2 text-slate-400 hover:text-red-600 rounded-lg" aria-label="Удалить">✕</button>
                  </div>
                </li>
              ))}
          </ul>
        </section>
      )}
    </div>
  );
}
