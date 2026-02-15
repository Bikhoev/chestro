"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { formatRubles, round2 } from "@/lib/calculations";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import type { ExpenseCategory, Expense } from "@/lib/types";

export default function ExpensesPage() {
  const params = useParams();
  const id = params.id as string;
  const { getObject, addExpense, deleteExpense, updateExpense } = useStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const obj = mounted ? getObject(id) : null;

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("materials");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [remainderAmount, setRemainderAmount] = useState("");
  const [paid, setPaid] = useState(true);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState<ExpenseCategory>("materials");
  const [editDescription, setEditDescription] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editRemainderAmount, setEditRemainderAmount] = useState("");
  const [editPaid, setEditPaid] = useState(true);
  const [showCombined, setShowCombined] = useState(false);
  const [showOnlyUnpaid, setShowOnlyUnpaid] = useState(false);

  if (!mounted) return <div className="px-6 py-6" />;
  if (!obj) return null;

  const expensesNonOverrun = obj.expenses.filter((e) => e.category !== "overrun");
  const totalExpensesGross = round2(expensesNonOverrun.reduce((s, e) => s + e.amount, 0));
  const totalRemainders = round2(
    expensesNonOverrun.reduce((s, e) => s + (e.remainderAmount ?? 0), 0)
  );
  const totalExpenses = round2(totalExpensesGross - totalRemainders);
  const totalOverrun = round2(
    obj.expenses.filter((e) => e.category === "overrun").reduce((s, e) => s + e.amount, 0)
  );
  const totalCombined = round2(totalExpenses + totalOverrun);
  const effectiveAmount = (e: Expense) => round2(e.amount - (e.remainderAmount ?? 0));
  const totalDebt = round2(
    expensesNonOverrun
      .filter((e) => e.paid === false)
      .reduce((s, e) => s + effectiveAmount(e), 0)
  );

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(amount.replace(",", "."));
    if (!value || value <= 0) return;
    const remainder = remainderAmount.trim() ? parseFloat(remainderAmount.replace(",", ".")) : undefined;
    const safeRemainder = remainder != null && !Number.isNaN(remainder) && remainder >= 0 ? Math.min(remainder, value) : undefined;
    addExpense(id, {
      date,
      amount: value,
      category,
      description: description.trim() || (EXPENSE_CATEGORIES.find((c) => c.id === category)?.label ?? category),
      ...(safeRemainder != null && safeRemainder > 0 ? { remainderAmount: round2(safeRemainder) } : {}),
      paid,
    });
    setAmount("");
    setDescription("");
    setRemainderAmount("");
    setPaid(true);
    setDate(new Date().toISOString().slice(0, 10));
  };

  const startEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setEditAmount(String(exp.amount));
    setEditCategory(exp.category);
    setEditDescription(exp.description);
    setEditDate(exp.date.slice(0, 10));
    setEditRemainderAmount(exp.remainderAmount != null ? String(exp.remainderAmount) : "");
    setEditPaid(exp.paid !== false);
  };

  const togglePaid = (exp: Expense) => {
    updateExpense(id, exp.id, { paid: exp.paid === false });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;
    const value = parseFloat(editAmount.replace(",", "."));
    if (!value || value <= 0) return;
    const remainder = editRemainderAmount.trim() ? parseFloat(editRemainderAmount.replace(",", ".")) : undefined;
    const safeRemainder = remainder != null && !Number.isNaN(remainder) && remainder >= 0 ? Math.min(remainder, value) : undefined;
    updateExpense(id, editingExpense.id, {
      date: editDate,
      amount: value,
      category: editCategory,
      description: editDescription.trim() || (EXPENSE_CATEGORIES.find((c) => c.id === editCategory)?.label ?? editCategory),
      remainderAmount: safeRemainder != null && safeRemainder > 0 ? round2(safeRemainder) : undefined,
      paid: editPaid,
    });
    setEditingExpense(null);
  };

  const cancelEdit = () => {
    setEditingExpense(null);
  };

  return (
    <div className="px-6 py-6 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <section className="card p-4">
          <h2 className="font-semibold text-slate-900 mb-1">Расход</h2>
          <p className="text-xs text-slate-500 mb-1">Закупки за свой счёт (в смете), с учётом остатков</p>
          <p className="text-2xl font-bold text-slate-900">{formatRubles(totalExpenses)}</p>
          {totalRemainders > 0 && (
            <p className="text-xs text-slate-500 mt-1">Вычтено остатков: −{formatRubles(totalRemainders)}</p>
          )}
        </section>
        <section className="card p-4">
          <h2 className="font-semibold text-slate-900 mb-1">Перерасход</h2>
          <p className="text-xs text-slate-500 mb-1">Непредвиденные затраты на клиенте</p>
          <p className="text-2xl font-bold text-slate-900">{formatRubles(totalOverrun)}</p>
        </section>
      </div>

      {totalDebt > 0 && (
        <section className="card p-4 border-amber-200 bg-amber-50/50">
          <h2 className="font-semibold text-amber-900 mb-1">Задолженность</h2>
          <p className="text-xs text-amber-700 mb-1">Неоплаченные расходы</p>
          <p className="text-2xl font-bold text-amber-800">{formatRubles(totalDebt)}</p>
        </section>
      )}

      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showCombined}
            onChange={(e) => setShowCombined(e.target.checked)}
            className="rounded border-slate-300 text-chestro-600 focus:ring-chestro-500"
          />
          <span className="text-sm text-slate-700">Показать общую сумму (расход + перерасход)</span>
        </label>
        {obj.expenses.some((e) => e.paid === false) && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showOnlyUnpaid}
              onChange={(e) => setShowOnlyUnpaid(e.target.checked)}
              className="rounded border-slate-300 text-chestro-600 focus:ring-chestro-500"
            />
            <span className="text-sm text-slate-700">Только неоплаченные в списке</span>
          </label>
        )}
      </div>
      {showCombined && (
        <section className="card p-4 bg-chestro-50/50 border-chestro-200">
          <h2 className="font-semibold text-slate-900 mb-1">Всего (расход + перерасход)</h2>
          <p className="text-2xl font-bold text-chestro-800">{formatRubles(totalCombined)}</p>
        </section>
      )}

      <section className="card p-4">
        <h2 className="font-semibold text-slate-900 mb-3">Добавить расход</h2>
        <p className="text-xs text-slate-500 mb-2">
          Расход — закупка для клиента за свой счёт (в смете). Перерасход — непредвиденные затраты на клиенте. Остаток — неиспользованный материал, вычитается из расхода.
        </p>
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
            <label className="block text-sm text-slate-600 mb-1">Остаток (неиспользованный материал), ₽</label>
            <input
              type="number"
              value={remainderAmount}
              onChange={(e) => setRemainderAmount(e.target.value)}
              className="input-field"
              placeholder="0 — если часть материала осталась"
              min={0}
              step={0.01}
            />
            <p className="text-xs text-slate-500 mt-0.5">Вычитается из суммы расхода при подсчёте</p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={paid}
              onChange={(e) => setPaid(e.target.checked)}
              className="rounded border-slate-300 text-chestro-600 focus:ring-chestro-500"
            />
            <span className="text-sm text-slate-700">Оплачен</span>
          </label>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Категория</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="input-field"
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Описание</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field"
              placeholder="Например: аренда перфоратора"
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
            Добавить расход
          </button>
        </form>
      </section>

      {editingExpense && (
        <section className="card p-4 border-2 border-chestro-200">
          <h2 className="font-semibold text-slate-900 mb-3">Изменить расход</h2>
          <form onSubmit={handleUpdate} className="space-y-3">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Сумма, ₽</label>
              <input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Категория</label>
              <select value={editCategory} onChange={(e) => setEditCategory(e.target.value as ExpenseCategory)} className="input-field">
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Описание</label>
              <input type="text" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Остаток (неиспользованный материал), ₽</label>
              <input
                type="number"
                value={editRemainderAmount}
                onChange={(e) => setEditRemainderAmount(e.target.value)}
                className="input-field"
                placeholder="0"
                min={0}
                step={0.01}
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editPaid}
                onChange={(e) => setEditPaid(e.target.checked)}
                className="rounded border-slate-300 text-chestro-600 focus:ring-chestro-500"
              />
              <span className="text-sm text-slate-700">Оплачен</span>
            </label>
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

      {obj.expenses.length > 0 && (
        <section>
          <h2 className="font-semibold text-slate-900 mb-3">История</h2>
          <ul className="space-y-2">
            {obj.expenses
              .filter((exp) => !showOnlyUnpaid || exp.paid === false)
              .slice()
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((exp) => (
                <li key={exp.id} className="card p-3 flex items-center justify-between gap-2 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900">{exp.description}</p>
                    <p className="text-xs text-slate-500">
                      {EXPENSE_CATEGORIES.find((c) => c.id === exp.category)?.label ?? exp.category} ·{" "}
                      {new Date(exp.date).toLocaleDateString("ru-RU")}
                    </p>
                    <button
                      type="button"
                      onClick={() => togglePaid(exp)}
                      className={`mt-1 text-xs font-medium px-2 py-0.5 rounded-lg transition ${
                        exp.paid === false
                          ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                      title={exp.paid === false ? "Отметить как оплаченный" : "Отметить как неоплаченный"}
                    >
                      {exp.paid === false ? "Не оплачен" : "Оплачен"}
                    </button>
                    {exp.remainderAmount != null && exp.remainderAmount > 0 && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        Остаток: −{formatRubles(exp.remainderAmount)} → к списанию {formatRubles(round2(exp.amount - exp.remainderAmount))}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    {exp.remainderAmount != null && exp.remainderAmount > 0 ? (
                      <>
                        <p className="text-sm text-slate-500">{formatRubles(exp.amount)}</p>
                        <p className="font-semibold text-slate-900">{formatRubles(round2(exp.amount - exp.remainderAmount))}</p>
                      </>
                    ) : (
                      <p className="font-semibold text-slate-900">{formatRubles(exp.amount)}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 w-full sm:w-auto">
                    <button type="button" onClick={() => startEdit(exp)} className="p-2 text-slate-500 hover:text-chestro-600 rounded-lg text-sm">Изменить</button>
                    <button type="button" onClick={() => deleteExpense(id, exp.id)} className="p-2 text-slate-400 hover:text-red-600 rounded-lg" aria-label="Удалить">✕</button>
                  </div>
                </li>
              ))}
          </ul>
        </section>
      )}
    </div>
  );
}
