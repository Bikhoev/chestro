import type { Room, MeasurementSummary, WallItem, PlasterRules } from "./types";

/** Округление до сотых (без бесконечных дробей) */
export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Площадь стен комнаты: периметр × высота − проёмы */
export function calcRoomWallArea(
  perimeterM: number,
  heightM: number,
  openingsSqM: number = 0
): number {
  const area = perimeterM * heightM;
  return round2(Math.max(0, area - openingsSqM));
}

/** Площадь одной стены: длина × высота − проёмы */
export function calcWallArea(lengthM: number, heightM: number, openingsSqM: number = 0): number {
  return round2(Math.max(0, lengthM * heightM - openingsSqM));
}

/** Сводка по измерениям (комнаты + отдельные стены) */
export function getMeasurementSummary(rooms: Room[], walls: WallItem[] = []): MeasurementSummary {
  let dryRoomsSqM = 0;
  let wetRoomsSqM = 0;
  let slopesLinearM = 0;

  for (const r of rooms) {
    if (r.type === "slope") {
      slopesLinearM += r.slopeLinearM ?? 0;
    } else if (r.type === "dry") {
      dryRoomsSqM += r.wallAreaSqM ?? 0;
    } else {
      wetRoomsSqM += r.wallAreaSqM ?? 0;
    }
  }

  const wallsSqM = walls.reduce((s, w) => s + (w.areaSqM ?? w.lengthM * w.heightM - (w.openingsSqM ?? 0)), 0);
  const totalWallSqM = round2(dryRoomsSqM + wetRoomsSqM + Math.max(0, wallsSqM));
  return {
    dryRoomsSqM: round2(dryRoomsSqM),
    wetRoomsSqM: round2(wetRoomsSqM),
    slopesLinearM: round2(slopesLinearM),
    totalWallSqM,
    totalSlopesM: round2(slopesLinearM),
  };
}

// ——— Штукатурка (значения по умолчанию) ———
export const PLASTER_DEFAULTS = {
  drySqmPerBag: 2,
  wetSqmPerBag: 2,
  beaconsPer100Sqm: 40,
  angleProfilesPer100LinearM: 37.5,
  primerSqmPerBucket: 200,
  betonokontaktSqmPerBucket: 200,
} as const;

export interface PlasterMaterials {
  dryMixBags: number;
  wetMixBags: number;
  beacons: number;
  angleProfiles: number;
  primerBuckets: number;
  betonokontaktBuckets: number;
}

export function calcPlasterMaterials(
  summary: MeasurementSummary,
  options?: { rules?: PlasterRules; hasConcreteWalls?: boolean }
): PlasterMaterials {
  const r = options?.rules ?? {};
  const drySqmPerBag = r.drySqmPerBag ?? PLASTER_DEFAULTS.drySqmPerBag;
  const wetSqmPerBag = r.wetSqmPerBag ?? PLASTER_DEFAULTS.wetSqmPerBag;
  const beaconsPer100 = r.beaconsPer100Sqm ?? PLASTER_DEFAULTS.beaconsPer100Sqm;
  const anglePer100 = r.angleProfilesPer100LinearM ?? PLASTER_DEFAULTS.angleProfilesPer100LinearM;
  const primerSqm = r.primerSqmPerBucket ?? PLASTER_DEFAULTS.primerSqmPerBucket;
  const betonSqm = r.betonokontaktSqmPerBucket ?? PLASTER_DEFAULTS.betonokontaktSqmPerBucket;
  const hasConcreteWalls = options?.hasConcreteWalls === true;

  return {
    dryMixBags: Math.ceil(summary.dryRoomsSqM / drySqmPerBag),
    wetMixBags: Math.ceil(summary.wetRoomsSqM / wetSqmPerBag),
    beacons: Math.ceil((summary.totalWallSqM / 100) * beaconsPer100),
    angleProfiles: Math.ceil((summary.slopesLinearM / 100) * anglePer100),
    primerBuckets: Math.ceil(summary.totalWallSqM / primerSqm) || 1,
    betonokontaktBuckets: hasConcreteWalls ? (Math.ceil(summary.totalWallSqM / betonSqm) || 1) : 0,
  };
}

// ——— Плитка (усреднённые подсказки) ———
export interface TilingMaterials {
  tileGlueBags: number;
  groutKg: number;
  primerBuckets: number;
  crossesCount: number;
}

const TILE_GLUE_SQM_PER_BAG = 10;
const GROUT_KG_PER_SQM = 1.5;
const CROSSES_PER_SQM = 20;

export function calcTilingMaterials(wallSqM: number, floorSqM?: number): TilingMaterials {
  const total = wallSqM + (floorSqM ?? 0);
  return {
    tileGlueBags: Math.ceil(total / TILE_GLUE_SQM_PER_BAG),
    groutKg: Math.ceil(total * GROUT_KG_PER_SQM),
    primerBuckets: Math.ceil(total / PRIMER_SQM_PER_BUCKET) || 1,
    crossesCount: Math.ceil(total * CROSSES_PER_SQM),
  };
}

// ——— Стяжка ———
const SCREED_MIX_KG_PER_SQM_CM = 20; // кг на м² на 1 см толщины

export function calcScreedMaterials(areaSqM: number, thicknessCm: number): { mixKg: number } {
  return {
    mixKg: Math.ceil(areaSqM * thicknessCm * SCREED_MIX_KG_PER_SQM_CM),
  };
}

// Форматирование денег
export function formatRubles(value: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(value);
}
