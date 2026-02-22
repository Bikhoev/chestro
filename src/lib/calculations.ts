import type {
  Room,
  MeasurementSummary,
  WallItem,
  PlasterRules,
  Floor,
  TilingRules,
  ScreedRules,
  PaintingRules,
  ElectricalRules,
  PlumbingRules,
} from "./types";

/** Все помещения из этажей или legacy rooms (для обратной совместимости). */
export function getRoomsFromObject(obj: { floors?: Floor[]; rooms?: Room[] }): Room[] {
  if (obj.floors && obj.floors.length > 0) {
    return obj.floors.flatMap((f) => f.rooms);
  }
  return obj.rooms ?? [];
}

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
  let totalFloorSqM = 0;

  for (const r of rooms) {
    if (r.type === "slope") {
      slopesLinearM += r.slopeLinearM ?? 0;
    } else if (r.type === "dry") {
      dryRoomsSqM += r.wallAreaSqM ?? 0;
      totalFloorSqM += r.floorAreaSqM ?? 0;
    } else {
      wetRoomsSqM += r.wallAreaSqM ?? 0;
      totalFloorSqM += r.floorAreaSqM ?? 0;
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
    totalFloorSqM: round2(totalFloorSqM),
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

// ——— Плитка (с редактируемыми правилами) ———
export interface TilingMaterials {
  tileGlueBags: number;
  groutKg: number;
  primerBuckets: number;
  crossesCount: number;
}

export const TILING_DEFAULTS = {
  glueSqmPerBag: 5,
  groutKgPerSqm: 1.5,
  crossesPerSqm: 20,
  primerSqmPerBucket: 100,
} as const;

export function calcTilingMaterials(
  wallSqM: number,
  floorSqM: number,
  rules?: TilingRules
): TilingMaterials {
  const total = wallSqM + floorSqM;
  const gluePer = rules?.glueSqmPerBag ?? TILING_DEFAULTS.glueSqmPerBag;
  const groutPer = rules?.groutKgPerSqm ?? TILING_DEFAULTS.groutKgPerSqm;
  const crossesPer = rules?.crossesPerSqm ?? TILING_DEFAULTS.crossesPerSqm;
  const primerPer = rules?.primerSqmPerBucket ?? TILING_DEFAULTS.primerSqmPerBucket;
  return {
    tileGlueBags: Math.ceil(total / gluePer) || 0,
    groutKg: Math.ceil(total * groutPer) || 0,
    primerBuckets: Math.ceil(total / primerPer) || (total > 0 ? 1 : 0),
    crossesCount: Math.ceil(total * crossesPer) || 0,
  };
}

// ——— Стяжка (с редактируемыми правилами) ———
export const SCREED_DEFAULTS = { mixKgPerSqmCm: 20 } as const;

export function calcScreedMaterials(
  areaSqM: number,
  thicknessCm: number,
  rules?: ScreedRules
): { mixKg: number } {
  const kgPer = rules?.mixKgPerSqmCm ?? SCREED_DEFAULTS.mixKgPerSqmCm;
  return { mixKg: Math.ceil(areaSqM * thicknessCm * kgPer) || 0 };
}

// ——— Покраска (с редактируемыми правилами) ———
export interface PaintingMaterials {
  paintLiters: number;
  primerBuckets: number;
}

export const PAINTING_DEFAULTS = {
  paintSqmPerLiter: 10,
  layers: 2,
  primerSqmPerBucket: 150,
} as const;

export function calcPaintingMaterials(
  wallSqM: number,
  ceilingSqM: number,
  rules?: PaintingRules
): PaintingMaterials {
  const total = wallSqM + ceilingSqM;
  const sqmPerL = rules?.paintSqmPerLiter ?? PAINTING_DEFAULTS.paintSqmPerLiter;
  const layers = rules?.layers ?? PAINTING_DEFAULTS.layers;
  const primerPer = rules?.primerSqmPerBucket ?? PAINTING_DEFAULTS.primerSqmPerBucket;
  return {
    paintLiters: Math.ceil((total * layers) / sqmPerL) || 0,
    primerBuckets: Math.ceil(total / primerPer) || (total > 0 ? 1 : 0),
  };
}

// ——— Электрика (точечный расчёт) ———
export interface ElectricalMaterials {
  cableM: number;
  boxes: number;
}

export const ELECTRICAL_DEFAULTS = { cableMPerPoint: 15, boxesPerPoint: 1 } as const;

export function calcElectricalMaterials(points: number, rules?: ElectricalRules): ElectricalMaterials {
  const cablePer = rules?.cableMPerPoint ?? ELECTRICAL_DEFAULTS.cableMPerPoint;
  const boxesPer = rules?.boxesPerPoint ?? ELECTRICAL_DEFAULTS.boxesPerPoint;
  return {
    cableM: Math.ceil(points * cablePer) || 0,
    boxes: Math.ceil(points * boxesPer) || 0,
  };
}

// ——— Сантехника (точечный + погонный) ———
export interface PlumbingMaterials {
  pipeM: number;
  fittings: number;
}

export const PLUMBING_DEFAULTS = { pipeMPerPoint: 8, fittingsPerPoint: 3 } as const;

export function calcPlumbingMaterials(
  points: number,
  linearM: number,
  rules?: PlumbingRules
): PlumbingMaterials {
  const pipePer = rules?.pipeMPerPoint ?? PLUMBING_DEFAULTS.pipeMPerPoint;
  const fittingsPer = rules?.fittingsPerPoint ?? PLUMBING_DEFAULTS.fittingsPerPoint;
  return {
    pipeM: Math.ceil(points * pipePer + linearM) || 0,
    fittings: Math.ceil(points * fittingsPer) || 0,
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
