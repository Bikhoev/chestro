import type { ActivityType } from "./types";

export const ACTIVITIES: { id: ActivityType; label: string }[] = [
  { id: "plastering", label: "Штукатурка" },
  { id: "tiling", label: "Плитка" },
  { id: "screed", label: "Стяжка пола" },
  { id: "electrical", label: "Электрика" },
  { id: "plumbing", label: "Сантехника" },
  { id: "painting", label: "Покраска" },
  { id: "other", label: "Другое / под ключ" },
];

export const ROOM_TYPES = [
  { id: "dry" as const, label: "Сухое помещение" },
  { id: "wet" as const, label: "Санузел" },
  { id: "slope" as const, label: "Откосы" },
] as const;

export const EXPENSE_CATEGORIES = [
  { id: "materials" as const, label: "Материалы" },
  { id: "tool_rental" as const, label: "Аренда инструмента" },
  { id: "transport" as const, label: "Транспорт" },
  { id: "overrun" as const, label: "Перерасход" },
  { id: "other" as const, label: "Прочее" },
] as const;
