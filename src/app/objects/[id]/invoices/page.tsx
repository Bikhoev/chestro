"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { formatRubles, round2 } from "@/lib/calculations";
import type { Invoice } from "@/lib/types";

export default function InvoicesPage() {
  const params = useParams();
  const id = params.id as string;
  const { getObject, addInvoice, deleteInvoice } = useStore();
  const [mounted, setMounted] = useState(false);
  const [creating, setCreating] = useState(false);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);

  useEffect(() => setMounted(true), []);

  const obj = mounted ? getObject(id) : null;

  if (!mounted) return <div className="px-6 py-6" />;
  if (!obj) return null;

  const invoices = obj.invoices ?? [];
  const nextNumber = String(invoices.length + 1);
  const canCreate = obj.estimate.length > 0;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) return;
    const items = obj.estimate.map((i) => ({
      ...i,
      id: crypto.randomUUID(),
    }));
    const total = round2(items.reduce((s, i) => s + i.total, 0));
    addInvoice(id, {
      number: nextNumber,
      date: invoiceDate,
      client: { ...obj.client },
      items,
      total,
      createdAt: new Date().toISOString(),
    });
    setCreating(false);
    setInvoiceDate(new Date().toISOString().slice(0, 10));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="px-6 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="font-semibold text-slate-900">Счета</h2>
        <div className="flex items-center gap-2">
          <Link href={`/objects/${id}`} className="btn-secondary py-2 px-4 text-sm">
            ← К объекту
          </Link>
          {canCreate && (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="btn-primary py-2 px-4 text-sm"
            >
              Создать счёт
            </button>
          )}
        </div>
      </div>

      {creating && canCreate && (
        <section className="card p-4">
          <h3 className="font-semibold text-slate-900 mb-3">Новый счёт из сметы</h3>
          <p className="text-sm text-slate-600 mb-3">
            Будет создан счёт №{nextNumber} с текущими позициями сметы и данными клиента.
          </p>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Дата счёта</label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="input-field"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary">Создать</button>
              <button type="button" onClick={() => setCreating(false)} className="btn-secondary">
                Отмена
              </button>
            </div>
          </form>
        </section>
      )}

      {!canCreate && invoices.length === 0 && (
        <div className="card p-6 text-center text-slate-600">
          <p className="mb-2">Чтобы выставить счёт, сначала добавьте позиции в разделе «Смета».</p>
          <Link href={`/objects/${id}/estimate`} className="text-chestro-600 font-medium">
            Перейти к смете →
          </Link>
        </div>
      )}

      {invoices.length > 0 && (
        <section>
          <h3 className="font-semibold text-slate-900 mb-3">История счетов</h3>
          <ul className="space-y-2">
            {invoices
              .slice()
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((inv) => (
                <li key={inv.id} className="card p-3 flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <p className="font-medium text-slate-900">Счёт №{inv.number}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(inv.date).toLocaleDateString("ru-RU")} · {inv.client.name}
                    </p>
                  </div>
                  <p className="font-semibold text-slate-900">{formatRubles(inv.total)}</p>
                  <div className="flex items-center gap-1 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setViewInvoice(inv)}
                      className="btn-secondary py-2 px-3 text-sm"
                    >
                      Просмотр
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteInvoice(id, inv.id)}
                      className="py-2 px-3 text-sm text-red-600 border border-red-200 rounded-xl hover:bg-red-50"
                    >
                      Удалить
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        </section>
      )}

      {viewInvoice && (
        <>
          <div className="no-print flex gap-2">
            <button type="button" onClick={handlePrint} className="btn-primary">
              Печать / Сохранить как PDF
            </button>
            <button type="button" onClick={() => setViewInvoice(null)} className="btn-secondary">
              Закрыть
            </button>
          </div>
          <div className="invoice-print-area card p-6 max-w-2xl">
            <div className="mb-6">
              <h1 className="text-xl font-bold text-slate-900">Счёт №{viewInvoice.number}</h1>
              <p className="text-slate-600">от {new Date(viewInvoice.date).toLocaleDateString("ru-RU")}</p>
            </div>
            <div className="mb-6 text-slate-700">
              <p className="font-semibold">{viewInvoice.client.name}</p>
              <p>{viewInvoice.client.location}</p>
              <p className="text-sm">{viewInvoice.client.houseOrFlat === "house" ? "Дом" : "Квартира"}</p>
              {viewInvoice.client.phone && <p className="text-sm">Тел.: {viewInvoice.client.phone}</p>}
            </div>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 font-semibold text-slate-900">Наименование</th>
                  <th className="text-right py-2 font-semibold text-slate-900">Кол-во</th>
                  <th className="text-right py-2 font-semibold text-slate-900">Ед.</th>
                  <th className="text-right py-2 font-semibold text-slate-900">Цена</th>
                  <th className="text-right py-2 font-semibold text-slate-900">Сумма</th>
                </tr>
              </thead>
              <tbody>
                {viewInvoice.items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="py-2 text-slate-800">{item.name}</td>
                    <td className="text-right py-2 text-slate-700">{item.quantity}</td>
                    <td className="text-right py-2 text-slate-700">{item.unit}</td>
                    <td className="text-right py-2 text-slate-700">{formatRubles(item.pricePerUnit)}</td>
                    <td className="text-right py-2 font-medium text-slate-900">{formatRubles(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-4 text-right text-lg font-bold text-slate-900">
              Итого: {formatRubles(viewInvoice.total)}
            </p>
          </div>
        </>
      )}

    </div>
  );
}
