"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { getMeasurementSummary, formatRubles, round2 } from "@/lib/calculations";

export default function ObjectOverviewPage() {
  const params = useParams();
  const id = params.id as string;
  const { getObject, setDates } = useStore();
  const [mounted, setMounted] = useState(false);
  const [editingDates, setEditingDates] = useState(false);
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");

  useEffect(() => setMounted(true), []);
  const obj = mounted ? getObject(id) : null;

  if (!mounted || !obj) {
    return <div className="px-4 sm:px-6 py-6 max-w-full overflow-hidden" />;
  }

  const summary = getMeasurementSummary(obj.rooms, obj.walls);
  const expensesNonOverrun = obj.expenses.filter((e) => e.category !== "overrun");
  const totalExpenses = round2(
    expensesNonOverrun.reduce((s, e) => s + e.amount - (e.remainderAmount ?? 0), 0)
  );
  const totalDebt = round2(
    expensesNonOverrun
      .filter((e) => e.paid === false)
      .reduce((s, e) => s + e.amount - (e.remainderAmount ?? 0), 0)
  );
  const totalAdvances = obj.advances.reduce((s, a) => s + a.amount, 0);
  const estimateTotal = obj.estimate.reduce((s, i) => s + i.total, 0);

  const saveDates = () => {
    setDates(id, dateStart || undefined, dateEnd || undefined);
    setEditingDates(false);
  };

  return (
    <div className="px-4 sm:px-6 py-6 space-y-6 max-w-full overflow-hidden">
      <section className="card p-4">
        <h2 className="font-semibold text-slate-900 mb-3">Клиент</h2>
        <p className="text-slate-700">{obj.client.name}</p>
        <p className="text-slate-600 text-sm">{obj.client.location}</p>
        <p className="text-slate-500 text-sm">{obj.client.houseOrFlat === "house" ? "Дом" : "Квартира"}</p>
        {obj.client.phone && <p className="text-slate-600 text-sm mt-1">{obj.client.phone}</p>}
        {obj.client.comment && <p className="text-slate-500 text-sm mt-2">{obj.client.comment}</p>}
      </section>

      <section className="card p-4">
        <h2 className="font-semibold text-slate-900 mb-2">Сроки работ</h2>
        {!editingDates ? (
          <>
            {(obj.dateStart || obj.dateEnd) ? (
              <p className="text-sm text-slate-600">
                {obj.dateStart && <span>Начало: {new Date(obj.dateStart).toLocaleDateString("ru-RU")}</span>}
                {obj.dateStart && obj.dateEnd && " · "}
                {obj.dateEnd && <span>Окончание: {new Date(obj.dateEnd).toLocaleDateString("ru-RU")}</span>}
              </p>
            ) : (
              <p className="text-sm text-slate-500">Не указаны</p>
            )}
            <button
              type="button"
              onClick={() => {
                setDateStart(obj.dateStart?.slice(0, 10) ?? "");
                setDateEnd(obj.dateEnd?.slice(0, 10) ?? "");
                setEditingDates(true);
              }}
              className="text-chestro-600 text-sm font-medium mt-2"
            >
              {obj.dateStart || obj.dateEnd ? "Изменить" : "Указать сроки"}
            </button>
          </>
        ) : (
          <div className="space-y-2">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Дата начала</label>
              <input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} className="input-field py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Дата окончания</label>
              <input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} className="input-field py-2 text-sm" />
            </div>
            <div className="flex gap-2 mt-2">
              <button type="button" onClick={saveDates} className="btn-primary py-2 text-sm">Сохранить</button>
              <button type="button" onClick={() => setEditingDates(false)} className="btn-secondary py-2 text-sm">Отмена</button>
            </div>
          </div>
        )}
      </section>

      {obj.rooms.length > 0 && (
        <section className="card p-4">
          <h2 className="font-semibold text-slate-900 mb-2">Замеры (сводка)</h2>
          <p className="text-sm text-slate-600">Сухие помещения: {summary.dryRoomsSqM.toFixed(2)} м²</p>
          <p className="text-sm text-slate-600">Санузлы: {summary.wetRoomsSqM.toFixed(2)} м²</p>
          <p className="text-sm text-slate-600">Откосы: {summary.slopesLinearM.toFixed(2)} м.п.</p>
          <p className="text-sm font-medium text-slate-800 mt-1">
            Итоговый объём: {(summary.totalWallSqM + summary.slopesLinearM).toFixed(2)} (стены м² + откосы м.п.)
          </p>
          <Link href={`/objects/${id}/measurement`} className="text-chestro-600 text-sm font-medium mt-2 inline-block">
            Открыть замеры →
          </Link>
        </section>
      )}

      {(estimateTotal > 0 || obj.estimate.length > 0) && (
        <section className="card p-4">
          <h2 className="font-semibold text-slate-900 mb-2">Смета</h2>
          <p className="text-lg font-semibold text-chestro-700">{formatRubles(estimateTotal)}</p>
          <Link href={`/objects/${id}/estimate`} className="text-chestro-600 text-sm font-medium mt-2 inline-block">
            Открыть смету →
          </Link>
        </section>
      )}

      {(totalExpenses > 0 || obj.expenses.length > 0) && (
        <section className="card p-4">
          <h2 className="font-semibold text-slate-900 mb-2">Расходы</h2>
          <p className="text-slate-700">{formatRubles(totalExpenses)}</p>
          {totalDebt > 0 && (
            <p className="text-sm text-amber-700 mt-1">Задолженность: {formatRubles(totalDebt)}</p>
          )}
          <Link href={`/objects/${id}/expenses`} className="text-chestro-600 text-sm font-medium mt-2 inline-block">
            Подробнее →
          </Link>
        </section>
      )}

      {(totalAdvances > 0 || obj.advances.length > 0) && (
        <section className="card p-4">
          <h2 className="font-semibold text-slate-900 mb-2">Авансы</h2>
          <p className="text-slate-700">{formatRubles(totalAdvances)}</p>
          <Link href={`/objects/${id}/advances`} className="text-chestro-600 text-sm font-medium mt-2 inline-block">
            Подробнее →
          </Link>
        </section>
      )}

      {obj.rooms.length === 0 && obj.estimate.length === 0 && obj.expenses.length === 0 && obj.advances.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <p className="mb-4">Данных пока нет. Начните с замеров или сметы.</p>
          <Link href={`/objects/${id}/measurement`} className="btn-primary inline-block">
            Добавить замеры
          </Link>
        </div>
      )}
    </div>
  );
}
