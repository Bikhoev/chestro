import { v4 as uuid } from "uuid";
import type { AppState, ObjectProject, Floor } from "./types";

const CURRENT_SCHEMA_VERSION = 1;

function migrateObjectProject(o: ObjectProject): ObjectProject {
  const invoices = o.invoices ?? [];
  if (o.floors && o.floors.length > 0) {
    return { ...o, invoices, floors: o.floors };
  }
  const rooms = o.rooms ?? [];
  const floors: Floor[] = [{ id: uuid(), label: "Этаж 1", rooms }];
  const { rooms: _r, ...rest } = o;
  return { ...rest, invoices, floors };
}

export function migrateAppState(state: AppState, defaultState: AppState): AppState {
  const version = state.version ?? 0;
  let migrated = { ...defaultState, ...state };

  if (version < CURRENT_SCHEMA_VERSION) {
    migrated = {
      ...migrated,
      objects: (migrated.objects ?? []).map(migrateObjectProject),
    };
  }

  return { ...migrated, version: CURRENT_SCHEMA_VERSION };
}
