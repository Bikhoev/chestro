"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useStore } from "@/lib/store";
import {
  getMeasurementSummary,
  getRoomsFromObject,
  calcPlasterMaterials,
  calcTilingMaterials,
  calcScreedMaterials,
  calcPaintingMaterials,
  calcElectricalMaterials,
  calcPlumbingMaterials,
  PLASTER_DEFAULTS,
  TILING_DEFAULTS,
  SCREED_DEFAULTS,
  PAINTING_DEFAULTS,
  ELECTRICAL_DEFAULTS,
  PLUMBING_DEFAULTS,
} from "@/lib/calculations";
import { ACTIVITIES } from "@/lib/constants";
import Link from "next/link";
import type {
  ActivityType,
  PlasterRules,
  TilingRules,
  ScreedRules,
  PaintingRules,
  ElectricalRules,
  PlumbingRules,
} from "@/lib/types";
import { EmptyState } from "@/components/ui/EmptyState";

function getOrderLinesPlaster(
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

function getOrderLinesTiling(t: ReturnType<typeof calcTilingMaterials>): string[] {
  return [
    `Клей для плитки: ${t.tileGlueBags} меш.`,
    `Затирка: ${t.groutKg} кг`,
    `Крестики: ${t.crossesCount} шт.`,
    `Грунтовка: ${t.primerBuckets} вед.`,
  ];
}

function getOrderLinesScreed(m: ReturnType<typeof calcScreedMaterials>): string[] {
  return [`Сухая смесь для стяжки: ${m.mixKg} кг (≈ ${Math.ceil(m.mixKg / 50)} меш. по 50 кг)`];
}

function getOrderLinesPainting(p: ReturnType<typeof calcPaintingMaterials>): string[] {
  return [
    `Краска: ${p.paintLiters} л`,
    `Грунтовка: ${p.primerBuckets} вед.`,
  ];
}

function getOrderLinesElectrical(e: ReturnType<typeof calcElectricalMaterials>): string[] {
  return [
    `Кабель: ${e.cableM} м.п.`,
    `Подрозетники: ${e.boxes} шт.`,
  ];
}

function getOrderLinesPlumbing(p: ReturnType<typeof calcPlumbingMaterials>): string[] {
  return [
    `Трубы: ${p.pipeM} м.п.`,
    `Фитинги: ${p.fittings} шт.`,
  ];
}

const RULE_LABELS_PLASTER: { key: keyof PlasterRules; label: string; suffix: string }[] = [
  { key: "drySqmPerBag", label: "Смесь сухие помещения", suffix: "м²/меш." },
  { key: "wetSqmPerBag", label: "Смесь санузлы", suffix: "м²/меш." },
  { key: "beaconsPer100Sqm", label: "Маяки", suffix: "шт./100 м²" },
  { key: "angleProfilesPer100LinearM", label: "Угловой профиль", suffix: "шт./100 м.п." },
  { key: "primerSqmPerBucket", label: "Грунтовка", suffix: "м²/ведро" },
  { key: "betonokontaktSqmPerBucket", label: "Бетоноконтакт", suffix: "м²/ведро" },
];

const RULE_LABELS_TILING: { key: keyof TilingRules; label: string; suffix: string }[] = [
  { key: "glueSqmPerBag", label: "Клей", suffix: "м²/мешок" },
  { key: "groutKgPerSqm", label: "Затирка", suffix: "кг/м²" },
  { key: "crossesPerSqm", label: "Крестики", suffix: "шт./м²" },
  { key: "primerSqmPerBucket", label: "Грунтовка", suffix: "м²/ведро" },
];

const RULE_LABELS_SCREED: { key: keyof ScreedRules; label: string; suffix: string }[] = [
  { key: "mixKgPerSqmCm", label: "Смесь", suffix: "кг/(м²×см)" },
];

const RULE_LABELS_PAINTING: { key: keyof PaintingRules; label: string; suffix: string }[] = [
  { key: "paintSqmPerLiter", label: "Краска", suffix: "м²/л (слой)" },
  { key: "layers", label: "Слоёв", suffix: "шт." },
  { key: "primerSqmPerBucket", label: "Грунтовка", suffix: "м²/ведро" },
];

const RULE_LABELS_ELECTRICAL: { key: keyof ElectricalRules; label: string; suffix: string }[] = [
  { key: "cableMPerPoint", label: "Кабель на точку", suffix: "м" },
  { key: "boxesPerPoint", label: "Подрозетников на точку", suffix: "шт." },
];

const RULE_LABELS_PLUMBING: { key: keyof PlumbingRules; label: string; suffix: string }[] = [
  { key: "pipeMPerPoint", label: "Труб на точку", suffix: "м" },
  { key: "fittingsPerPoint", label: "Фитингов на точку", suffix: "шт." },
];

export default function MaterialsPage() {
  const params = useParams();
  const id = params.id as string;
  const { getObject, updateObject } = useStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const obj = mounted ? getObject(id) : null;
  const activityType = obj?.activityType ?? "plastering";
  const [activeTab, setActiveTab] = useState<ActivityType>(activityType);
  const [rulesExpanded, setRulesExpanded] = useState<Record<string, boolean>>({});

  const [plasterRules, setPlasterRules] = useState<PlasterRules>({});
  const [hasConcreteWalls, setHasConcreteWalls] = useState(false);
  const [tilingRules, setTilingRules] = useState<TilingRules>({});
  const [screedRules, setScreedRules] = useState<ScreedRules>({});
  const [screedThicknessCm, setScreedThicknessCm] = useState(5);
  const [paintingRules, setPaintingRules] = useState<PaintingRules>({});
  const [electricalRules, setElectricalRules] = useState<ElectricalRules>({});
  const [electricalPoints, setElectricalPoints] = useState(0);
  const [plumbingRules, setPlumbingRules] = useState<PlumbingRules>({});
  const [plumbingPoints, setPlumbingPoints] = useState(0);
  const [plumbingLinearM, setPlumbingLinearM] = useState(0);

  useEffect(() => {
    if (!obj) return;
    setActiveTab(activityType);
    setPlasterRules(obj.plasterRules ?? {});
    setHasConcreteWalls(obj.hasConcreteWalls ?? false);
    setTilingRules(obj.tilingRules ?? {});
    setScreedRules(obj.screedRules ?? {});
    setScreedThicknessCm(obj.screedThicknessCm ?? 5);
    setPaintingRules(obj.paintingRules ?? {});
    setElectricalRules(obj.electricalRules ?? {});
    setElectricalPoints(obj.electricalPoints ?? 0);
    setPlumbingRules(obj.plumbingRules ?? {});
    setPlumbingPoints(obj.plumbingPoints ?? 0);
    setPlumbingLinearM(obj.plumbingLinearM ?? 0);
  }, [obj?.id, activityType, obj?.plasterRules, obj?.hasConcreteWalls, obj?.tilingRules, obj?.screedRules, obj?.screedThicknessCm, obj?.paintingRules, obj?.electricalRules, obj?.electricalPoints, obj?.plumbingRules, obj?.plumbingPoints, obj?.plumbingLinearM]);

  const save = (data: Record<string, unknown>) => updateObject(id, data);

  if (!mounted) {
    return (
      <div className="px-4 sm:px-6 py-6 space-y-4">
        <div className="h-12 bg-slate-200/60 rounded-2xl animate-pulse" />
        <div className="h-48 bg-slate-200/60 rounded-2xl animate-pulse" />
      </div>
    );
  }
  if (!obj) return null;

  const summary = getMeasurementSummary(getRoomsFromObject(obj), obj.walls);
  const hasMeasurements = summary.totalWallSqM > 0 || summary.slopesLinearM > 0 || summary.totalFloorSqM > 0;

  const plaster = calcPlasterMaterials(summary, { rules: plasterRules, hasConcreteWalls });
  const tiling = calcTilingMaterials(summary.totalWallSqM, summary.totalFloorSqM, tilingRules);
  const screed = calcScreedMaterials(summary.totalFloorSqM, screedThicknessCm, screedRules);
  const painting = calcPaintingMaterials(summary.totalWallSqM, summary.totalFloorSqM, paintingRules);
  const electrical = calcElectricalMaterials(electricalPoints, electricalRules);
  const plumbing = calcPlumbingMaterials(plumbingPoints, plumbingLinearM, plumbingRules);

  const toggleRules = (key: string) =>
    setRulesExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const copyOrder = async (lines: string[]) => {
    const text = lines.join("\n");
    if (!text) return;
    try {
      await navigator.clipboard?.writeText(text);
    } catch {}
  };

  const MaterialSection = ({
    title,
    emptyMessage,
    needsMeasurements,
    children,
    orderLines,
  }: {
    title: string;
    emptyMessage?: string;
    needsMeasurements?: boolean;
    children: React.ReactNode;
    orderLines: string[];
  }) => (
    <section className="bg-white/80 backdrop-blur rounded-3xl border border-slate-200/80 shadow-[0_8px_30px_rgba(15,23,42,0.06)] overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <h3 className="font-bold text-slate-900 text-lg">{title}</h3>
      </div>
      <div className="p-5 space-y-5">
        {needsMeasurements && !hasMeasurements ? (
          <EmptyState
            title="Нет замеров"
            description={emptyMessage ?? "Добавьте помещения в разделе «Замеры» и укажите площади."
            }
            action={
              <Link
                href={`/objects/${id}/measurement`}
                className="inline-flex items-center gap-2 rounded-2xl bg-chestro-600 text-white font-semibold px-5 py-2.5 shadow-lg shadow-chestro-600/25 hover:bg-chestro-700 hover:scale-[1.02] transition-all"
              >
                Перейти к замерам
              </Link>
            }
          />
        ) : (
          <>
            {children}
            <div className="pt-4 border-t border-slate-100">
              <div className="bg-slate-50/80 rounded-2xl border border-slate-200/60 p-4">
                <pre className="text-sm text-slate-800 whitespace-pre-wrap font-sans leading-relaxed">
                  {orderLines.length ? orderLines.join("\n") : "— Нет данных —"}
                </pre>
              </div>
              <button
                type="button"
                onClick={() => copyOrder(orderLines)}
                disabled={orderLines.length === 0}
                className="mt-3 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-chestro-600 text-white font-semibold px-5 py-2.5 shadow-lg shadow-chestro-600/25 hover:bg-chestro-700 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 transition-all"
              >
                Скопировать список
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );

  const renderRulesBlock = <K extends string>({
    id: blockId,
    labels,
    values,
    defaults,
    onSet,
  }: {
    id: string;
    labels: { key: K; label: string; suffix: string }[];
    values: Partial<Record<K, number>>;
    defaults: Record<K, number>;
    onSet: (key: K, value: number) => void;
  }) => (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => toggleRules(blockId)}
        className="flex items-center justify-between w-full py-2 text-left text-sm font-medium text-slate-700 hover:text-chestro-700 transition"
      >
        <span>Правила расчёта</span>
        <span className={`text-slate-400 transition-transform ${rulesExpanded[blockId] ? "rotate-180" : ""}`}>▾</span>
      </button>
      {rulesExpanded[blockId] && (
        <div className="space-y-3 pl-1 border-l-2 border-chestro-200/60">
          <ul className="space-y-2">
            {labels.map(({ key, label, suffix }) => (
              <li key={String(key)} className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-slate-600 w-full sm:w-44">{label}</span>
                <input
                  type="number"
                  min={0.1}
                  step={0.5}
                  value={values[key] ?? defaults[key]}
                  onChange={(e) => onSet(key, parseFloat(e.target.value) || defaults[key])}
                  className="w-24 rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm focus:border-chestro-500 focus:ring-2 focus:ring-chestro-500/20 outline-none"
                />
                <span className="text-xs text-slate-500">{suffix}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const tabs = ACTIVITIES.filter((a) => a.id !== "other");
  const currentTabContent = activeTab;

  return (
    <div className="px-4 sm:px-6 py-6 space-y-6 max-w-4xl">
      <p className="text-sm text-slate-600">
        Расчёт материалов по замерам. Выберите вид работ — правила и список для закупки появятся ниже.
      </p>

      {/* Вкладки видов работ */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 ${
              activeTab === tab.id
                ? "bg-chestro-600 text-white shadow-lg shadow-chestro-600/25 scale-[1.02]"
                : "bg-white text-slate-600 border-2 border-slate-200 hover:border-chestro-300 hover:bg-chestro-50/50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Штукатурка */}
      {currentTabContent === "plastering" && (
        <MaterialSection
          title="Штукатурка"
          needsMeasurements
          emptyMessage="Добавьте помещения (стены, откосы) в разделе «Замеры»."
          orderLines={getOrderLinesPlaster(plaster, hasConcreteWalls)}
        >
          {renderRulesBlock({
            id: "plaster",
            labels: RULE_LABELS_PLASTER,
            values: plasterRules,
            defaults: { ...PLASTER_DEFAULTS } as Record<keyof PlasterRules, number>,
            onSet: (k, v) => {
              const next = { ...plasterRules, [k]: v };
              setPlasterRules(next);
              save({ plasterRules: next });
            },
          })}
          <label className="flex items-center gap-2 cursor-pointer mt-3">
            <input
              type="checkbox"
              checked={hasConcreteWalls}
              onChange={(e) => {
                const v = e.target.checked;
                setHasConcreteWalls(v);
                save({ hasConcreteWalls: v });
              }}
              className="rounded-lg border-slate-300 text-chestro-600 focus:ring-chestro-500"
            />
            <span className="text-sm text-slate-700">Есть бетонные стены — включить бетоноконтакт</span>
          </label>
        </MaterialSection>
      )}

      {/* Плитка */}
      {currentTabContent === "tiling" && (
        <MaterialSection
          title="Плитка"
          needsMeasurements
          emptyMessage="Добавьте помещения и укажите площади стен и пола в разделе «Замеры»."
          orderLines={getOrderLinesTiling(tiling)}
        >
          {renderRulesBlock({
            id: "tiling",
            labels: RULE_LABELS_TILING,
            values: tilingRules,
            defaults: { ...TILING_DEFAULTS } as Record<keyof TilingRules, number>,
            onSet: (k, v) => {
              const next = { ...tilingRules, [k]: v };
              setTilingRules(next);
              save({ tilingRules: next });
            },
          })}
          <p className="text-xs text-slate-500 mt-2">
            Сумма: стены {summary.totalWallSqM.toFixed(1)} м² + пол {summary.totalFloorSqM.toFixed(1)} м²
          </p>
        </MaterialSection>
      )}

      {/* Стяжка */}
      {currentTabContent === "screed" && (
        <MaterialSection
          title="Стяжка пола"
          needsMeasurements
          emptyMessage="Добавьте помещения с площадью пола в разделе «Замеры»."
          orderLines={getOrderLinesScreed(screed)}
        >
          {renderRulesBlock({
            id: "screed",
            labels: RULE_LABELS_SCREED,
            values: screedRules,
            defaults: { ...SCREED_DEFAULTS } as Record<keyof ScreedRules, number>,
            onSet: (k, v) => {
              const next = { ...screedRules, [k]: v };
              setScreedRules(next);
              save({ screedRules: next });
            },
          })}
          <div className="flex items-center gap-2 mt-3">
            <label className="text-sm text-slate-600">Толщина стяжки, см</label>
            <input
              type="number"
              min={1}
              max={15}
              value={screedThicknessCm}
              onChange={(e) => {
                const v = Math.max(1, Math.min(15, parseInt(e.target.value, 10) || 5));
                setScreedThicknessCm(v);
                save({ screedThicknessCm: v });
              }}
              className="w-20 rounded-xl border-2 border-slate-200 px-3 py-2 text-sm focus:border-chestro-500"
            />
          </div>
          <p className="text-xs text-slate-500">
            Площадь пола: {summary.totalFloorSqM.toFixed(1)} м² × {screedThicknessCm} см
          </p>
        </MaterialSection>
      )}

      {/* Покраска */}
      {currentTabContent === "painting" && (
        <MaterialSection
          title="Покраска"
          needsMeasurements
          emptyMessage="Добавьте помещения (стены и площадь пола = потолок) в разделе «Замеры»."
          orderLines={getOrderLinesPainting(painting)}
        >
          {renderRulesBlock({
            id: "painting",
            labels: RULE_LABELS_PAINTING,
            values: paintingRules,
            defaults: { ...PAINTING_DEFAULTS } as Record<keyof PaintingRules, number>,
            onSet: (k, v) => {
              const next = { ...paintingRules, [k]: v };
              setPaintingRules(next);
              save({ paintingRules: next });
            },
          })}
          <p className="text-xs text-slate-500 mt-2">
            Стены {summary.totalWallSqM.toFixed(1)} м² + потолок {summary.totalFloorSqM.toFixed(1)} м²
          </p>
        </MaterialSection>
      )}

      {/* Электрика */}
      {currentTabContent === "electrical" && (
        <MaterialSection title="Электрика" orderLines={getOrderLinesElectrical(electrical)}>
          {renderRulesBlock({
            id: "electrical",
            labels: RULE_LABELS_ELECTRICAL,
            values: electricalRules,
            defaults: { ...ELECTRICAL_DEFAULTS } as Record<keyof ElectricalRules, number>,
            onSet: (k, v) => {
              const next = { ...electricalRules, [k]: v };
              setElectricalRules(next);
              save({ electricalRules: next });
            },
          })}
          <div className="mt-3">
            <label className="block text-sm text-slate-600 mb-1">Количество точек (розетки, выключатели)</label>
            <input
              type="number"
              min={0}
              value={electricalPoints}
              onChange={(e) => {
                const v = Math.max(0, parseInt(e.target.value, 10) || 0);
                setElectricalPoints(v);
                save({ electricalPoints: v });
              }}
              className="w-32 rounded-xl border-2 border-slate-200 px-3 py-2 text-sm focus:border-chestro-500"
            />
          </div>
        </MaterialSection>
      )}

      {/* Сантехника */}
      {currentTabContent === "plumbing" && (
        <MaterialSection title="Сантехника" orderLines={getOrderLinesPlumbing(plumbing)}>
          {renderRulesBlock({
            id: "plumbing",
            labels: RULE_LABELS_PLUMBING,
            values: plumbingRules,
            defaults: { ...PLUMBING_DEFAULTS } as Record<keyof PlumbingRules, number>,
            onSet: (k, v) => {
              const next = { ...plumbingRules, [k]: v };
              setPlumbingRules(next);
              save({ plumbingRules: next });
            },
          })}
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Точек (краны, унитазы и т.п.)</label>
              <input
                type="number"
                min={0}
                value={plumbingPoints}
                onChange={(e) => {
                  const v = Math.max(0, parseInt(e.target.value, 10) || 0);
                  setPlumbingPoints(v);
                  save({ plumbingPoints: v });
                }}
                className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm focus:border-chestro-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Погонные метры труб</label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={plumbingLinearM}
                onChange={(e) => {
                  const v = Math.max(0, parseFloat(e.target.value.replace(",", ".")) || 0);
                  setPlumbingLinearM(v);
                  save({ plumbingLinearM: v });
                }}
                className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm focus:border-chestro-500"
              />
            </div>
          </div>
        </MaterialSection>
      )}
    </div>
  );
}
