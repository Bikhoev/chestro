// Типы деятельности в строительстве
export type ActivityType =
  | "plastering"   // Штукатурка
  | "tiling"       // Плитка
  | "screed"       // Стяжка пола
  | "electrical"   // Электрика
  | "plumbing"     // Сантехника
  | "painting"     // Покраска
  | "other";       // Другое / под ключ

// Тип помещения (для измерений штукатурки и т.п.)
export type RoomType = "dry" | "wet" | "slope"; // сухое, санузел, откосы

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  heightM?: number;            // высота в м (для сухих/мокрых)
  perimeterM?: number;        // периметр комнаты в м (сумма всех сторон, вводится пользователем)
  wallAreaSqM?: number;       // площадь стен = периметр × высота − проёмы (вычисляется)
  floorAreaSqM?: number;      // площадь пола в м² (плитка, стяжка, потолок)
  slopeLinearM?: number;      // погонные метры откосов (только для type === "slope")
  openingsSqM?: number;       // площадь проёмов для вычета
  note?: string;
}

/** Этаж: название и помещения. Одна высота на этаже — defaultHeightM подставляется в помещения при расчёте. */
export interface Floor {
  id: string;
  label: string;           // например "Этаж 1", "Цоколь"
  defaultHeightM?: number;  // высота для всех помещений на этаже (м)
  rooms: Room[];
}

// Отдельная стена (опционально)
export interface WallItem {
  id: string;
  name: string;
  lengthM: number;
  heightM: number;
  areaSqM: number;
  openingsSqM?: number;
}

export interface MeasurementSummary {
  dryRoomsSqM: number;
  wetRoomsSqM: number;
  slopesLinearM: number;
  totalWallSqM: number;
  totalSlopesM: number;
  totalFloorSqM: number;   // сумма площадей пола (плитка, стяжка, потолок)
}

/** Правила расчёта для плитки */
export interface TilingRules {
  glueSqmPerBag?: number;      // м² на 1 мешок клея
  groutKgPerSqm?: number;      // кг затирки на м²
  crossesPerSqm?: number;      // крестиков на м²
  primerSqmPerBucket?: number; // м² на ведро грунтовки
}

/** Правила расчёта для стяжки */
export interface ScreedRules {
  mixKgPerSqmCm?: number;      // кг смеси на м² на 1 см толщины
}

/** Правила расчёта для покраски */
export interface PaintingRules {
  paintSqmPerLiter?: number;   // м² на 1 л краски (один слой)
  layers?: number;             // количество слоёв
  primerSqmPerBucket?: number; // м² на ведро грунтовки
}

/** Правила расчёта для электрики */
export interface ElectricalRules {
  cableMPerPoint?: number;     // м кабеля на точку
  boxesPerPoint?: number;      // подрозетников на точку
}

/** Правила расчёта для сантехники */
export interface PlumbingRules {
  pipeMPerPoint?: number;      // м труб на точку
  fittingsPerPoint?: number;   // фитингов на точку
}

export interface ClientInfo {
  name: string;
  location: string;
  houseOrFlat: "house" | "apartment";
  phone?: string;
  comment?: string;
}

export type ExpenseCategory =
  | "materials"
  | "tool_rental"
  | "transport"
  | "overrun"   // перерасход — затраты на клиенте при непредвиденных обстоятельствах
  | "other";

export interface Expense {
  id: string;
  date: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  /** Остаток неиспользованного материала в ₽ — вычитается из расхода при подсчёте */
  remainderAmount?: number;
  /** Оплачен ли расход (false = задолженность). По умолчанию true. */
  paid?: boolean;
}

export interface Advance {
  id: string;
  date: string;
  amount: number;
  purpose: string; // "материалы", "аренда инструмента" и т.д.
}

export interface EstimateItem {
  id: string;
  name: string;
  quantity: number;
  unit: string; // "м²", "м.п.", "шт."
  pricePerUnit: number;
  total: number;
}

/** Счёт для клиента (снимок сметы + реквизиты на дату) */
export interface Invoice {
  id: string;
  number: string;       // номер счёта, например "1", "2"
  date: string;          // дата счёта ISO
  client: ClientInfo;    // снимок данных клиента на момент создания
  items: EstimateItem[]; // копия позиций сметы
  total: number;
  createdAt: string;
}

/** Правила расчёта материалов для штукатурки (редактируемые пользователем) */
export interface PlasterRules {
  drySqmPerBag?: number;           // м² на 1 мешок смеси (сухие)
  wetSqmPerBag?: number;           // м² на 1 мешок (санузлы)
  beaconsPer100Sqm?: number;       // маяков на 100 м²
  angleProfilesPer100LinearM?: number; // угловых профилей на 100 м.п. откосов
  primerSqmPerBucket?: number;      // м² на ведро грунтовки
  betonokontaktSqmPerBucket?: number;  // м² на ведро бетоноконтакта
}

export interface ObjectProject {
  id: string;
  client: ClientInfo;
  activityType: ActivityType;
  dateStart?: string;
  dateEnd?: string;
  summaryNote?: string;
  /** Есть бетонные стены — учитывать бетоноконтакт в закупке */
  hasConcreteWalls?: boolean;
  /** Правила расчёта материалов (штукатурка) */
  plasterRules?: PlasterRules;
  /** Правила для плитки */
  tilingRules?: TilingRules;
  /** Правила для стяжки */
  screedRules?: ScreedRules;
  /** Правила для покраски */
  paintingRules?: PaintingRules;
  /** Правила для электрики */
  electricalRules?: ElectricalRules;
  /** Правила для сантехники */
  plumbingRules?: PlumbingRules;
  /** Толщина стяжки в см (для расчёта материалов) */
  screedThicknessCm?: number;
  /** Количество точек (розетки, выключатели) для электрики */
  electricalPoints?: number;
  /** Количество точек (краны, унитазы и т.п.) для сантехники */
  plumbingPoints?: number;
  /** Погонные метры труб для сантехники */
  plumbingLinearM?: number;
  /** Этажи с помещениями. При отсутствии — миграция из rooms в один этаж. */
  floors?: Floor[];
  /** @deprecated Используйте floors. Оставлено для миграции старых данных. */
  rooms?: Room[];
  walls: WallItem[];
  estimate: EstimateItem[];
  expenses: Expense[];
  advances: Advance[];
  notes: string[];
  invoices: Invoice[];
  createdAt: string;
  updatedAt: string;
}

export interface AppState {
  /** Версия схемы для миграций. Текущая: 1 */
  version?: number;
  hasSkippedAuth: boolean;
  userId: string | null;
  selectedActivity: ActivityType | null;
  objects: ObjectProject[];
}
