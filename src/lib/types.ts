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
  slopeLinearM?: number;      // погонные метры откосов (только для type === "slope")
  openingsSqM?: number;       // площадь проёмов для вычета
  note?: string;
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
  /** Правила расчёта материалов (штукатурка); если не заданы — используются значения по умолчанию */
  plasterRules?: PlasterRules;
  rooms: Room[];
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
  hasSkippedAuth: boolean;
  userId: string | null;
  selectedActivity: ActivityType | null;
  objects: ObjectProject[];
}
