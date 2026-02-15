"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { getMeasurementSummary, formatRubles, round2 } from "@/lib/calculations";

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

export default function CrmPage() {
  const { objects } = useStore();
  const [months, setMonths] = useState(3);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const stats = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setMonth(start.getMonth() - months);

    const inRange = objects.filter((obj) => {
      const dateStr = obj.dateStart ?? obj.createdAt;
      const date = new Date(dateStr);
      if (Number.isNaN(date.getTime())) return false;
      return date >= start && date <= now;
    });

    const totals = inRange.reduce(
      (acc, obj) => {
        const summary = getMeasurementSummary(obj.rooms, obj.walls);
        acc.dryRoomsSqM += summary.dryRoomsSqM;
        acc.wetRoomsSqM += summary.wetRoomsSqM;
        acc.slopesLinearM += summary.slopesLinearM;
        acc.totalWallSqM += summary.totalWallSqM;
        acc.totalVolume += summary.totalWallSqM + summary.slopesLinearM;

        acc.estimateTotal += obj.estimate.reduce((s, i) => s + i.total, 0);
        acc.expensesTotal += obj.expenses.reduce((s, e) => s + e.amount, 0);
        acc.advancesTotal += obj.advances.reduce((s, a) => s + a.amount, 0);

        return acc;
      },
      {
        dryRoomsSqM: 0,
        wetRoomsSqM: 0,
        slopesLinearM: 0,
        totalWallSqM: 0,
        totalVolume: 0,
        estimateTotal: 0,
        expensesTotal: 0,
        advancesTotal: 0,
        clientsCount: inRange.length,
      }
    );

    return {
      ...totals,
      dryRoomsSqM: round2(totals.dryRoomsSqM),
      wetRoomsSqM: round2(totals.wetRoomsSqM),
      slopesLinearM: round2(totals.slopesLinearM),
      totalWallSqM: round2(totals.totalWallSqM),
      totalVolume: round2(totals.totalVolume),
      estimateTotal: round2(totals.estimateTotal),
      expensesTotal: round2(totals.expensesTotal),
      advancesTotal: round2(totals.advancesTotal),
    };
  }, [objects, months]);

  if (!mounted) return <div />;

  return (
    <div className="min-h-screen flex flex-col safe-top safe-bottom bg-surface">
      <header className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">CRM статистика</h1>
          <p className="text-sm text-slate-600">Сводка по объектам и финансам</p>
        </div>
        <Link href="/objects" className="btn-secondary px-4 py-2 text-sm">
          К объектам
        </Link>
      </header>

      <main className="flex-1 px-6 py-6 space-y-6">
        <section className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-500">Период</div>
              <div className="font-medium text-slate-900">
                Последние {months} мес.
              </div>
            </div>
            <select
              className="input-field text-sm"
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
            >
              {MONTH_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m} мес.
                </option>
              ))}
            </select>
          </div>
          <div className="text-sm text-slate-600">
            Объектов за период: <span className="font-semibold text-slate-900">{stats.clientsCount}</span>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3">
          <div className="card p-4">
            <div className="text-sm text-slate-500">Доход по смете</div>
            <div className="text-xl font-semibold text-slate-900">{formatRubles(stats.estimateTotal)}</div>
          </div>
          <div className="card p-4">
            <div className="text-sm text-slate-500">Расходы</div>
            <div className="text-xl font-semibold text-slate-900">{formatRubles(stats.expensesTotal)}</div>
          </div>
          <div className="card p-4">
            <div className="text-sm text-slate-500">Авансы получены</div>
            <div className="text-xl font-semibold text-slate-900">{formatRubles(stats.advancesTotal)}</div>
          </div>
        </section>

        <section className="card p-4 space-y-2">
          <div className="font-semibold text-slate-900">Объёмы работ</div>
          <div className="text-sm text-slate-700">
            Сухие помещения: <span className="font-medium">{stats.dryRoomsSqM.toFixed(2)} м²</span>
          </div>
          <div className="text-sm text-slate-700">
            Санузлы: <span className="font-medium">{stats.wetRoomsSqM.toFixed(2)} м²</span>
          </div>
          <div className="text-sm text-slate-700">
            Откосы: <span className="font-medium">{stats.slopesLinearM.toFixed(2)} м.п.</span>
          </div>
          <div className="text-sm text-slate-700">
            Стены всего: <span className="font-medium">{stats.totalWallSqM.toFixed(2)} м²</span>
          </div>
          <div className="text-sm text-slate-700">
            Итоговый объём (стены м² + откосы м.п.):{" "}
            <span className="font-semibold">{stats.totalVolume.toFixed(2)}</span>
          </div>
        </section>
      </main>
    </div>
  );
}
