"use client";

import { createContext, useContext, useCallback, useReducer, ReactNode } from "react";
import { v4 as uuid } from "uuid";
import type {
  AppState,
  ObjectProject,
  ClientInfo,
  ActivityType,
  Room,
  WallItem,
  Expense,
  Advance,
  EstimateItem,
  Invoice,
} from "./types";

const STORAGE_KEY = "chestro_app_state";

const defaultState: AppState = {
  hasSkippedAuth: false,
  userId: null,
  selectedActivity: null,
  objects: [],
};

type Action =
  | { type: "SKIP_AUTH" }
  | { type: "SET_ACTIVITY"; payload: ActivityType }
  | { type: "ADD_OBJECT"; payload: { id: string; client: ClientInfo; activityType: ActivityType } }
  | { type: "UPDATE_OBJECT"; payload: Partial<ObjectProject> & { id: string } }
  | { type: "DELETE_OBJECT"; payload: string }
  | { type: "HYDRATE"; payload: AppState };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SKIP_AUTH":
      return { ...state, hasSkippedAuth: true };
    case "SET_ACTIVITY":
      return { ...state, selectedActivity: action.payload };
    case "ADD_OBJECT": {
      const now = new Date().toISOString();
      const obj: ObjectProject = {
        id: action.payload.id,
        client: action.payload.client,
        activityType: action.payload.activityType,
        rooms: [],
        walls: [],
        estimate: [],
        expenses: [],
        advances: [],
        notes: [],
        invoices: [],
        createdAt: now,
        updatedAt: now,
      };
      return { ...state, objects: [obj, ...state.objects] };
    }
    case "UPDATE_OBJECT": {
      const { id, ...rest } = action.payload;
      const updated = state.objects.map((o) =>
        o.id === id ? { ...o, ...rest, updatedAt: new Date().toISOString() } : o
      );
      return { ...state, objects: updated };
    }
    case "DELETE_OBJECT":
      return { ...state, objects: state.objects.filter((o) => o.id !== action.payload) };
    case "HYDRATE":
      return action.payload;
    default:
      return state;
  }
}

function loadState(): AppState {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as AppState;
    const objects = (parsed.objects ?? []).map((o) => ({
      ...o,
      invoices: o.invoices ?? [],
    }));
    return { ...defaultState, ...parsed, objects };
  } catch {
    return defaultState;
  }
}

function saveState(state: AppState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

interface StoreContextValue extends AppState {
  skipAuth: () => void;
  setActivity: (activity: ActivityType) => void;
  addObject: (client: ClientInfo, activityType: ActivityType) => string;
  updateObject: (id: string, data: Partial<ObjectProject>) => void;
  deleteObject: (id: string) => void;
  getObject: (id: string) => ObjectProject | undefined;
  setRooms: (objectId: string, rooms: Room[]) => void;
  addRoom: (objectId: string, room: Room) => void;
  updateRoom: (objectId: string, roomId: string, data: Partial<Room>) => void;
  deleteRoom: (objectId: string, roomId: string) => void;
  setExpenses: (objectId: string, expenses: Expense[]) => void;
  addExpense: (objectId: string, expense: Omit<Expense, "id">) => void;
  deleteExpense: (objectId: string, expenseId: string) => void;
  updateExpense: (objectId: string, expenseId: string, data: Partial<Expense>) => void;
  setAdvances: (objectId: string, advances: Advance[]) => void;
  addAdvance: (objectId: string, advance: Omit<Advance, "id">) => void;
  deleteAdvance: (objectId: string, advanceId: string) => void;
  updateAdvance: (objectId: string, advanceId: string, data: Partial<Advance>) => void;
  setEstimate: (objectId: string, items: EstimateItem[]) => void;
  setDates: (objectId: string, dateStart?: string, dateEnd?: string) => void;
  addNote: (objectId: string, note: string) => void;
  setWalls: (objectId: string, walls: WallItem[]) => void;
  addWall: (objectId: string, wall: WallItem) => void;
  updateWall: (objectId: string, wallId: string, data: Partial<WallItem>) => void;
  deleteWall: (objectId: string, wallId: string) => void;
  addInvoice: (objectId: string, invoice: Omit<Invoice, "id">) => void;
  deleteInvoice: (objectId: string, invoiceId: string) => void;
  /** Заменить всё состояние (для импорта). Передайте валидный AppState. */
  replaceState: (state: AppState) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, defaultState, () => loadState());

  const skipAuth = useCallback(() => dispatch({ type: "SKIP_AUTH" }), []);
  const setActivity = useCallback((activity: ActivityType) => dispatch({ type: "SET_ACTIVITY", payload: activity }), []);
  const addObject = useCallback((client: ClientInfo, activityType: ActivityType) => {
    const id = uuid();
    dispatch({ type: "ADD_OBJECT", payload: { id, client, activityType } });
    return id;
  }, []);

  const updateObject = useCallback((id: string, data: Partial<ObjectProject>) => {
    dispatch({ type: "UPDATE_OBJECT", payload: { id, ...data } });
  }, []);

  const deleteObject = useCallback((id: string) => dispatch({ type: "DELETE_OBJECT", payload: id }), []);

  const getObject = useCallback(
    (id: string) => state.objects.find((o) => o.id === id),
    [state.objects]
  );

  const setRooms = useCallback(
    (objectId: string, rooms: Room[]) => {
      const obj = state.objects.find((o) => o.id === objectId);
      if (obj) dispatch({ type: "UPDATE_OBJECT", payload: { id: objectId, rooms } });
    },
    [state.objects]
  );

  const addRoom = useCallback(
    (objectId: string, room: Room) => {
      const obj = state.objects.find((o) => o.id === objectId);
      if (obj) dispatch({ type: "UPDATE_OBJECT", payload: { id: objectId, rooms: [...obj.rooms, room] } });
    },
    [state.objects]
  );

  const updateRoom = useCallback(
    (objectId: string, roomId: string, data: Partial<Room>) => {
      const obj = state.objects.find((o) => o.id === objectId);
      if (!obj) return;
      const rooms = obj.rooms.map((r) => (r.id === roomId ? { ...r, ...data } : r));
      dispatch({ type: "UPDATE_OBJECT", payload: { id: objectId, rooms } });
    },
    [state.objects]
  );

  const deleteRoom = useCallback(
    (objectId: string, roomId: string) => {
      const obj = state.objects.find((o) => o.id === objectId);
      if (!obj) return;
      const rooms = obj.rooms.filter((r) => r.id !== roomId);
      dispatch({ type: "UPDATE_OBJECT", payload: { id: objectId, rooms } });
    },
    [state.objects]
  );

  const setExpenses = useCallback(
    (objectId: string, expenses: Expense[]) => {
      const obj = state.objects.find((o) => o.id === objectId);
      if (obj) dispatch({ type: "UPDATE_OBJECT", payload: { id: objectId, expenses } });
    },
    [state.objects]
  );

  const addExpense = useCallback(
    (objectId: string, expense: Omit<Expense, "id">) => {
      const obj = state.objects.find((o) => o.id === objectId);
      if (!obj) return;
      const newExpense: Expense = { ...expense, id: uuid() };
      dispatch({ type: "UPDATE_OBJECT", payload: { id: objectId, expenses: [...obj.expenses, newExpense] } });
    },
    [state.objects]
  );

  const deleteExpense = useCallback(
    (objectId: string, expenseId: string) => {
      const obj = state.objects.find((o) => o.id === objectId);
      if (!obj) return;
      dispatch({ type: "UPDATE_OBJECT", payload: { id: objectId, expenses: obj.expenses.filter((e) => e.id !== expenseId) } });
    },
    [state.objects]
  );

  const updateExpense = useCallback(
    (objectId: string, expenseId: string, data: Partial<Expense>) => {
      const obj = state.objects.find((o) => o.id === objectId);
      if (!obj) return;
      const expenses = obj.expenses.map((e) => (e.id === expenseId ? { ...e, ...data } : e));
      dispatch({ type: "UPDATE_OBJECT", payload: { id: objectId, expenses } });
    },
    [state.objects]
  );

  const setAdvances = useCallback(
    (objectId: string, advances: Advance[]) => {
      const obj = state.objects.find((o) => o.id === objectId);
      if (obj) dispatch({ type: "UPDATE_OBJECT", payload: { id: objectId, advances } });
    },
    [state.objects]
  );

  const addAdvance = useCallback(
    (objectId: string, advance: Omit<Advance, "id">) => {
      const obj = state.objects.find((o) => o.id === objectId);
      if (!obj) return;
      const newAdvance: Advance = { ...advance, id: uuid() };
      dispatch({ type: "UPDATE_OBJECT", payload: { id: objectId, advances: [...obj.advances, newAdvance] } });
    },
    [state.objects]
  );

  const deleteAdvance = useCallback(
    (objectId: string, advanceId: string) => {
      const obj = state.objects.find((o) => o.id === objectId);
      if (!obj) return;
      dispatch({ type: "UPDATE_OBJECT", payload: { id: objectId, advances: obj.advances.filter((a) => a.id !== advanceId) } });
    },
    [state.objects]
  );

  const updateAdvance = useCallback(
    (objectId: string, advanceId: string, data: Partial<Advance>) => {
      const obj = state.objects.find((o) => o.id === objectId);
      if (!obj) return;
      const advances = obj.advances.map((a) => (a.id === advanceId ? { ...a, ...data } : a));
      dispatch({ type: "UPDATE_OBJECT", payload: { id: objectId, advances } });
    },
    [state.objects]
  );

  const setEstimate = useCallback(
    (objectId: string, items: EstimateItem[]) => {
      const obj = state.objects.find((o) => o.id === objectId);
      if (obj) dispatch({ type: "UPDATE_OBJECT", payload: { id: objectId, estimate: items } });
    },
    [state.objects]
  );

  const setDates = useCallback(
    (objectId: string, dateStart?: string, dateEnd?: string) => {
      dispatch({ type: "UPDATE_OBJECT", payload: { id: objectId, dateStart, dateEnd } });
    },
    []
  );

  const addNote = useCallback(
    (objectId: string, note: string) => {
      const obj = state.objects.find((o) => o.id === objectId);
      if (!obj) return;
      dispatch({ type: "UPDATE_OBJECT", payload: { id: objectId, notes: [...obj.notes, note] } });
    },
    [state.objects]
  );

  const setWalls = useCallback(
    (objectId: string, walls: WallItem[]) => {
      const obj = state.objects.find((o) => o.id === objectId);
      if (obj) dispatch({ type: "UPDATE_OBJECT", payload: { id: objectId, walls } });
    },
    [state.objects]
  );

  const addWall = useCallback(
    (objectId: string, wall: WallItem) => {
      const obj = state.objects.find((o) => o.id === objectId);
      if (obj) dispatch({ type: "UPDATE_OBJECT", payload: { id: objectId, walls: [...obj.walls, wall] } });
    },
    [state.objects]
  );

  const updateWall = useCallback(
    (objectId: string, wallId: string, data: Partial<WallItem>) => {
      const obj = state.objects.find((o) => o.id === objectId);
      if (!obj) return;
      const walls = obj.walls.map((w) => (w.id === wallId ? { ...w, ...data } : w));
      dispatch({ type: "UPDATE_OBJECT", payload: { id: objectId, walls } });
    },
    [state.objects]
  );

  const deleteWall = useCallback(
    (objectId: string, wallId: string) => {
      const obj = state.objects.find((o) => o.id === objectId);
      if (!obj) return;
      const walls = obj.walls.filter((w) => w.id !== wallId);
      dispatch({ type: "UPDATE_OBJECT", payload: { id: objectId, walls } });
    },
    [state.objects]
  );

  const addInvoice = useCallback(
    (objectId: string, invoice: Omit<Invoice, "id">) => {
      const obj = state.objects.find((o) => o.id === objectId);
      if (!obj) return;
      const newInvoice: Invoice = { ...invoice, id: uuid() };
      const invoices = [...(obj.invoices ?? []), newInvoice];
      dispatch({ type: "UPDATE_OBJECT", payload: { id: objectId, invoices } });
    },
    [state.objects]
  );

  const deleteInvoice = useCallback(
    (objectId: string, invoiceId: string) => {
      const obj = state.objects.find((o) => o.id === objectId);
      if (!obj) return;
      const invoices = (obj.invoices ?? []).filter((inv) => inv.id !== invoiceId);
      dispatch({ type: "UPDATE_OBJECT", payload: { id: objectId, invoices } });
    },
    [state.objects]
  );

  const replaceState = useCallback((newState: AppState) => {
    const normalized = {
      ...newState,
      objects: (newState.objects ?? []).map((o) => ({ ...o, invoices: o.invoices ?? [] })),
    };
    dispatch({ type: "HYDRATE", payload: normalized });
  }, []);

  if (typeof window !== "undefined") {
    saveState(state);
  }

  const value: StoreContextValue = {
    ...state,
    skipAuth,
    setActivity,
    addObject,
    updateObject,
    deleteObject,
    getObject,
    setRooms,
    addRoom,
    updateRoom,
    deleteRoom,
    setExpenses,
    addExpense,
    deleteExpense,
    updateExpense,
    setAdvances,
    addAdvance,
    deleteAdvance,
    updateAdvance,
    setEstimate,
    setDates,
    addNote,
    setWalls,
    addWall,
    updateWall,
    deleteWall,
    addInvoice,
    deleteInvoice,
    replaceState,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
