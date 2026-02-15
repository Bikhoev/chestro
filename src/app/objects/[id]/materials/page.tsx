"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useStore } from "@/lib/store";
import {
  getMeasurementSummary,
  calcPlasterMaterials,
  PLASTER_DEFAULTS,
} from "@/lib/calculations";
import type { PlasterRules } from "@/lib/types";

const RULE_LABELS: { key: keyof PlasterRules; label: string; suffix: string }[] = [
  { key: "drySqmPerBag", label: "Смесь сухие помещения", suffix: "м² на 1 мешок" },
  { key: "wetSqmPerBag", label: "Смесь санузлы", suffix: "м² на 1 мешок" },
  { key: "beaconsPer100Sqm", label: "Маяки", suffix: "шт. на 100 м²" },
  { key: "angleProfilesPer100LinearM", label: "Угловой профиль (откосы)", suffix: "шт. на 100 м.п." },
  { key: "primerSqmPerBucket", label: "Грунтовка", suffix: "м² на ведро" },
  { key: "betonokontaktSqmPerBucket", label: "Бетоноконтакт", suffix: "м² на ведро" },
];

const DEFAULT_VALUES: Record<keyof PlasterRules, number> = {
  drySqmPerBag: PLASTER_DEFAULTS.drySqmPerBag,
  wetSqmPerBag: PLASTER_DEFAULTS.wetSqmPerBag,
  beaconsPer100Sqm: PLASTER_DEFAULTS.beaconsPer100Sqm,
  angleProfilesPer100LinearM: PLASTER_DEFAULTS.angleProfilesPer100LinearM,
  primerSqmPerBucket: PLASTER_DEFAULTS.primerSqmPerBucket,
  betonokontaktSqmPerBucket: PLASTER_DEFAULTS.betonokontaktSqmPerBucket,
};

function getOrderLines(
  plaster: ReturnType<typeof calcPlasterMaterials>,
  hasConcreteWalls: boolean
): string[] {
  const lines = [
    `Смесь сухие помещения: ${plaster.dryMixBags} меш.`,
    `Смесь санузлы: ${plaster.wetMixBags} меш.`,
    `Маяки: ${plaster.beacons} шт.`,
    `Угловой профиль (откосы): ${plaster.angleProfiles} шт.`,
    `Грунтовка: ${plaster.primerBuckets} вед.`,
  ];
  if (hasConcreteWalls && plaster.betonokontaktBuckets > 0) {
    lines.push(`Бетоноконтакт: ${plaster.betonokontaktBuckets} вед.`);
  }
  return lines;
}

export default function MaterialsPage() {
  const params = useParams();
  const id = params.id as string;
  const { getObject, updateObject } = useStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const obj = mounted ? getObject(id) : null;

  const [ruleValues, setRuleValues] = useState<PlasterRules>({});
  const [hasConcreteWalls, setHasConcreteWalls] = useState(false);

  useEffect(() => {
    if (!obj) return;
    setRuleValues(obj.plasterRules ?? {});
    setHasConcreteWalls(obj.hasConcreteWalls ?? false);
  }, [obj?.id, obj?.plasterRules, obj?.hasConcreteWalls]);

  if (!mounted) return <div className="px-6 py-6" />;
  if (!obj) return null;

  const summary = getMeasurementSummary(obj.rooms, obj.walls);
  const plaster = calcPlasterMaterials(summary, {
    rules: ruleValues,
    hasConcreteWalls,
  });

  const saveRules = (next: PlasterRules) => {
    setRuleValues(next);
    updateObject(id, { plasterRules: next });
  };

  const saveHasConcreteWalls = (value: boolean) => {
    setHasConcreteWalls(value);
    updateObject(id, { hasConcreteWalls: value });
  };

  const setRule = (key: keyof PlasterRules, value: number) => {
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) return;
    saveRules({ ...ruleValues, [key]: num });
  };

  const orderText = getOrderLines(plaster, hasConcreteWalls).join("\n");

  const copyOrder = async () => {
    if (!orderText) return;
    try {
      await navigator.clipboard?.writeText(orderText);
    } catch {}
  };

  const hasMeasurements = summary.totalWallSqM > 0 || summary.slopesLinearM > 0;

  return (
    <div className="px-6 py-6 space-y-6">
      <p className="text-sm text-slate-600">
        Расчёт по замерам для штукатурки. Правила можно менять ниже; внизу — список для закупки с копированием.
      </p>

      {!hasMeasurements ? (
        <div className="card p-6 text-center text-slate-500">
          Сначала добавьте замеры в разделе «Замеры».
        </div>
      ) : (
        <>
          {/* Верх: правила расчёта */}
          <section className="card p-4">
            <h2 className="font-semibold text-slate-900 mb-2">Правила расчёта</h2>
            <p className="text-xs text-slate-500 mb-3">
              Укажите расход на единицу; расчёт количества будет под списком.
            </p>
            <ul className="space-y-2">
              {RULE_LABELS.map(({ key, label, suffix }) => (
                <li key={key} className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-slate-700 w-full sm:w-48">{label}</span>
                  <input
                    type="number"
                    min={0.1}
                    step={0.5}
                    value={ruleValues[key] ?? DEFAULT_VALUES[key]}
                    onChange={(e) => setRule(key, parseFloat(e.target.value) || DEFAULT_VALUES[key])}
                    className="input-field w-24 py-2 text-sm"
                  />
                  <span className="text-xs text-slate-500">{suffix}</span>
                </li>
              ))}
            </ul>
            <label className="mt-4 flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasConcreteWalls}
                onChange={(e) => saveHasConcreteWalls(e.target.checked)}
                className="rounded border-slate-300 text-chestro-600 focus:ring-chestro-500"
              />
              <span className="text-sm text-slate-700">
                Есть бетонные стены — включить бетоноконтакт в закупку
              </span>
            </label>
            <p className="text-xs text-slate-500 mt-1">
              Бетоноконтакт нужен только при наличии бетонных стен (новострой, панельки и т.п.).
            </p>
          </section>

          {/* Низ: закупка, копировать текст */}
          <section className="card p-4">
            <h2 className="font-semibold text-slate-900 mb-2">Закупка (для заказа)</h2>
            <p className="text-xs text-slate-500 mb-3">
              Скопируйте список и отправьте поставщику или в торговую базу.
            </p>
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
              <pre className="text-sm text-slate-800 whitespace-pre-wrap font-sans">
                {orderText || "— Нет данных по замерам —"}
              </pre>
            </div>
            <button
              type="button"
              onClick={copyOrder}
              disabled={!orderText}
              className="btn-primary mt-3 w-full sm:w-auto"
            >
              Скопировать список
            </button>
          </section>
        </>
      )}
    </div>
  );
}
