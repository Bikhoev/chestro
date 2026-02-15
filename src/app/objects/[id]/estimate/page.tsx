"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { getMeasurementSummary, formatRubles, round2 } from "@/lib/calculations";

export default function EstimatePage() {
  const params = useParams();
  const id = params.id as string;
  const { getObject, setEstimate } = useStore();
  const obj = getObject(id);
  const [onePriceForAll, setOnePriceForAll] = useState(false);
  const [priceAll, setPriceAll] = useState("");
  const [priceDrySqm, setPriceDrySqm] = useState("");
  const [priceWetSqm, setPriceWetSqm] = useState("");
  const [priceSlopeM, setPriceSlopeM] = useState("");

  if (!obj) return null;

  const summary = getMeasurementSummary(obj.rooms, obj.walls);
  const totalVolume = round2(summary.totalWallSqM + summary.slopesLinearM);

  const addFromMeasurements = () => {
    const items = [...obj.estimate];
    if (onePriceForAll) {
      const price = round2(parseFloat(priceAll.replace(",", ".")) || 0);
      if (totalVolume > 0 && price > 0) {
        const total = round2(totalVolume * price);
        items.push({
          id: crypto.randomUUID(),
          name: "Итоговый объём (стены + откосы)",
          quantity: totalVolume,
          unit: "ед.",
          pricePerUnit: price,
          total,
        });
      }
      setEstimate(id, items);
      setPriceAll("");
      return;
    }
    const dry = round2(parseFloat(priceDrySqm.replace(",", ".")) || 0);
    const wet = round2(parseFloat(priceWetSqm.replace(",", ".")) || 0);
    const slope = round2(parseFloat(priceSlopeM.replace(",", ".")) || 0);
    if (summary.dryRoomsSqM > 0 && dry > 0) {
      items.push({
        id: crypto.randomUUID(),
        name: "Штукатурка сухие помещения",
        quantity: summary.dryRoomsSqM,
        unit: "м²",
        pricePerUnit: dry,
        total: round2(summary.dryRoomsSqM * dry),
      });
    }
    if (summary.wetRoomsSqM > 0 && wet > 0) {
      items.push({
        id: crypto.randomUUID(),
        name: "Штукатурка санузлы",
        quantity: summary.wetRoomsSqM,
        unit: "м²",
        pricePerUnit: wet,
        total: round2(summary.wetRoomsSqM * wet),
      });
    }
    if (summary.slopesLinearM > 0 && slope > 0) {
      items.push({
        id: crypto.randomUUID(),
        name: "Откосы",
        quantity: summary.slopesLinearM,
        unit: "м.п.",
        pricePerUnit: slope,
        total: round2(summary.slopesLinearM * slope),
      });
    }
    setEstimate(id, items);
    setPriceDrySqm("");
    setPriceWetSqm("");
    setPriceSlopeM("");
  };

  const removeItem = (itemId: string) => {
    setEstimate(id, obj.estimate.filter((i) => i.id !== itemId));
  };

  const total = round2(obj.estimate.reduce((s, i) => s + i.total, 0));

  const handlePrint = () => window.print();

  return (
    <div className="px-6 py-6 space-y-6">
      {/* Расчёт из замеров */}
      {(summary.totalWallSqM > 0 || summary.slopesLinearM > 0) && (
        <section className="card p-4">
          <h2 className="font-semibold text-slate-900 mb-3">Добавить из замеров</h2>
          <label className="flex items-center gap-2 mb-3 cursor-pointer">
            <input
              type="checkbox"
              checked={onePriceForAll}
              onChange={(e) => setOnePriceForAll(e.target.checked)}
              className="rounded border-slate-300 text-chestro-600 focus:ring-chestro-500"
            />
            <span className="text-sm text-slate-600">Одна цена для всего</span>
          </label>
          <p className="text-sm text-slate-600 mb-3">Введите цену за единицу — смета посчитается по замерам.</p>
          <div className="space-y-3">
            {onePriceForAll ? (
              <>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Итоговый объём ({totalVolume.toFixed(2)}), ₽/ед.</label>
                  <input
                    type="number"
                    step="0.01"
                    value={priceAll}
                    onChange={(e) => setPriceAll(e.target.value)}
                    className="input-field"
                    placeholder="0"
                  />
                </div>
                <button type="button" onClick={addFromMeasurements} className="btn-primary w-full">
                  Добавить в смету
                </button>
              </>
            ) : (
              <>
                {summary.dryRoomsSqM > 0 && (
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Сухие помещения ({summary.dryRoomsSqM.toFixed(2)} м²), ₽/м²</label>
                    <input
                      type="number"
                      step="0.01"
                      value={priceDrySqm}
                      onChange={(e) => setPriceDrySqm(e.target.value)}
                      className="input-field"
                      placeholder="0"
                    />
                  </div>
                )}
                {summary.wetRoomsSqM > 0 && (
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Санузлы ({summary.wetRoomsSqM.toFixed(2)} м²), ₽/м²</label>
                    <input
                      type="number"
                      step="0.01"
                      value={priceWetSqm}
                      onChange={(e) => setPriceWetSqm(e.target.value)}
                      className="input-field"
                      placeholder="0"
                    />
                  </div>
                )}
                {summary.slopesLinearM > 0 && (
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Откосы ({summary.slopesLinearM.toFixed(2)} м.п.), ₽/м.п.</label>
                    <input
                      type="number"
                      step="0.01"
                      value={priceSlopeM}
                      onChange={(e) => setPriceSlopeM(e.target.value)}
                      className="input-field"
                      placeholder="0"
                    />
                  </div>
                )}
                <button type="button" onClick={addFromMeasurements} className="btn-primary w-full">
                  Добавить в смету
                </button>
              </>
            )}
          </div>
        </section>
      )}

      {/* Список сметы */}
      <section className="card overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Позиции сметы</h2>
        </div>
        {obj.estimate.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-sm">
            Нет позиций. Добавьте из замеров или введите вручную (в полной версии).
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {obj.estimate.map((item) => (
              <li key={item.id} className="p-4 flex items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-slate-900">{item.name}</p>
                  <p className="text-sm text-slate-500">
                    {Number(item.quantity).toFixed(2)} {item.unit} × {formatRubles(item.pricePerUnit)} = {formatRubles(round2(item.total))}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="p-2 text-slate-400 hover:text-red-600 rounded-lg shrink-0"
                  aria-label="Удалить"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
        {obj.estimate.length > 0 && (
          <div className="p-4 bg-chestro-50 border-t border-chestro-100">
            <p className="text-sm text-chestro-800">Итого</p>
            <p className="text-xl font-bold text-chestro-900">{formatRubles(total)}</p>
          </div>
        )}
      </section>

      {obj.estimate.length > 0 && (
        <>
          <div className="no-print">
            <button type="button" onClick={handlePrint} className="btn-primary">
              Печать / Сохранить как PDF
            </button>
          </div>
          <div className="estimate-print-area card p-6 max-w-2xl">
            <h1 className="text-xl font-bold text-slate-900 mb-2">Смета</h1>
            <p className="text-slate-600 mb-1">{obj.client.name}</p>
            <p className="text-sm text-slate-500 mb-4">{obj.client.location}</p>
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
                {obj.estimate.map((item) => (
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
            <p className="mt-4 text-right text-lg font-bold text-slate-900">Итого: {formatRubles(total)}</p>
          </div>
        </>
      )}
    </div>
  );
}
