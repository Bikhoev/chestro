"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { getMeasurementSummary, getRoomsFromObject, calcRoomWallArea, calcWallArea } from "@/lib/calculations";
import { ROOM_TYPES } from "@/lib/constants";
import type { Room, RoomType } from "@/lib/types";
import { v4 as uuid } from "uuid";
import { Skeleton } from "@/components/ui/Skeleton";

export default function MeasurementPage() {
  const params = useParams();
  const id = params.id as string;
  const { getObject, addFloor, updateFloor, deleteFloor, addRoom, updateRoom, deleteRoom, addWall, updateWall, deleteWall } = useStore();
  const [mounted, setMounted] = useState(false);
  const [addingRoom, setAddingRoom] = useState(false);
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);
  const [editingFloorLabel, setEditingFloorLabel] = useState<string | null>(null);
  const [newWallName, setNewWallName] = useState("");
  const [newWallLength, setNewWallLength] = useState("");
  const [newWallHeight, setNewWallHeight] = useState("");
  const [newWallOpenings, setNewWallOpenings] = useState("");
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomType, setNewRoomType] = useState<RoomType>("dry");
  const [newRoomHeight, setNewRoomHeight] = useState("");
  const [newPerimeterM, setNewPerimeterM] = useState("");
  const [newFloorArea, setNewFloorArea] = useState("");
  const [newOpenings, setNewOpenings] = useState("");
  const [newSlopeM, setNewSlopeM] = useState("");
  const [addingWall, setAddingWall] = useState(false);

  useEffect(() => setMounted(true), []);
  const obj = mounted ? getObject(id) : null;

  if (!mounted || !obj) {
    return (
      <div className="px-4 sm:px-6 py-6 space-y-4 max-w-full overflow-x-hidden box-border">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const floors = obj.floors ?? [];
  const summary = getMeasurementSummary(getRoomsFromObject(obj), obj.walls);

  const handleAddRoom = (floorId: string) => {
    const floor = floors.find((f) => f.id === floorId);
    const roomCount = floor ? floor.rooms.length : 0;
    const name = newRoomName.trim() || `Комната ${roomCount + 1}`;
    const defaultH = floor?.defaultHeightM;
    if (newRoomType === "slope") {
      const linearM = parseFloat(newSlopeM.replace(",", ".")) || 0;
      addRoom(id, floorId, {
        id: uuid(),
        name,
        type: "slope",
        slopeLinearM: linearM,
      });
    } else {
      const heightM = parseFloat(newRoomHeight.replace(",", ".")) ?? defaultH ?? 0;
      const perimeterM = parseFloat(newPerimeterM.replace(",", ".")) || 0;
      const openingsSqM = parseFloat(newOpenings.replace(",", ".")) || 0;
      const wallAreaSqM = calcRoomWallArea(perimeterM, heightM, openingsSqM);
      const floorAreaSqM = parseFloat(newFloorArea.replace(",", ".")) || undefined;
      addRoom(id, floorId, {
        id: uuid(),
        name,
        type: newRoomType,
        heightM: heightM || undefined,
        perimeterM: perimeterM || undefined,
        wallAreaSqM,
        floorAreaSqM,
        openingsSqM: openingsSqM || undefined,
      });
    }
    setAddingRoom(false);
    setSelectedFloorId(null);
    setNewRoomName("");
    setNewRoomType("dry");
    setNewRoomHeight("");
    setNewPerimeterM("");
    setNewFloorArea("");
    setNewOpenings("");
    setNewSlopeM("");
  };

  const recalcAndSaveRoom = (room: Room, floor: { defaultHeightM?: number }, updates: Partial<Room>) => {
    const next = { ...room, ...updates };
    if (next.type !== "slope") {
      const heightM = next.heightM ?? floor.defaultHeightM ?? 0;
      const perimeterM = next.perimeterM ?? 0;
      const openingsSqM = next.openingsSqM ?? 0;
      next.wallAreaSqM = calcRoomWallArea(perimeterM, heightM, openingsSqM);
    }
    updateRoom(id, room.id, next);
  };

  return (
    <div className="px-4 sm:px-6 py-6 space-y-6 max-w-full overflow-x-hidden box-border">
      {/* Этажи и помещения */}
      {floors.map((floor) => (
        <section key={floor.id} className="card p-4">
          <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
            <div className="flex items-center gap-2 min-w-0">
              {editingFloorLabel === floor.id ? (
                <input
                  type="text"
                  value={floor.label}
                  onChange={(e) => updateFloor(id, floor.id, { label: e.target.value })}
                  onBlur={() => setEditingFloorLabel(null)}
                  className="input-field py-2 text-sm font-semibold w-40"
                  autoFocus
                />
              ) : (
                <h2
                  className="font-semibold text-slate-900 cursor-pointer hover:text-chestro-600"
                  onClick={() => setEditingFloorLabel(floor.id)}
                >
                  {floor.label}
                </h2>
              )}
            </div>
            {floors.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  if (floor.rooms.length > 0 && typeof window !== "undefined" && !window.confirm(`Удалить этаж «${floor.label}» и все помещения (${floor.rooms.length})?`)) return;
                  deleteFloor(id, floor.id);
                }}
                className="text-sm text-slate-500 hover:text-red-600"
              >
                Удалить этаж
              </button>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm text-slate-600 mb-1">Высота для всех помещений на этаже, м</label>
            <input
              type="number"
              step="0.01"
              value={floor.defaultHeightM ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                updateFloor(id, floor.id, { defaultHeightM: v ? parseFloat(v.replace(",", ".")) : undefined });
              }}
              className="input-field py-2 text-sm w-24"
              placeholder="2.7"
            />
            <p className="text-xs text-slate-500 mt-1">Подставляется в новые помещения, если не указана своя высота.</p>
          </div>

          <ul className="space-y-3">
            {floor.rooms.map((room) => (
              <li key={room.id} className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900">{room.name}</p>
                    <p className="text-sm text-slate-500">
                      {room.type === "slope" ? "Откосы" : room.type === "wet" ? "Санузел" : "Сухое помещение"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-sm font-semibold text-slate-900">
                      {room.type === "slope"
                        ? `${(room.slopeLinearM ?? 0).toFixed(2)} м.п.`
                        : `${(room.wallAreaSqM ?? 0).toFixed(2)} м²`}
                      {room.type !== "slope" && (room.floorAreaSqM ?? 0) > 0 && (
                        <span className="text-slate-500 ml-1">/ {room.floorAreaSqM!.toFixed(1)} м² пол</span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteRoom(id, room.id)}
                      className="p-2 text-slate-400 hover:text-red-600 rounded-lg"
                      aria-label="Удалить"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                {room.type !== "slope" && (
                  <div className={`mt-3 grid gap-2 text-sm ${floor.defaultHeightM == null ? "grid-cols-2" : ""}`}>
                    <div>
                      <label className="text-slate-500 block">Периметр, м</label>
                      <input
                        type="number"
                        step="0.01"
                        value={room.perimeterM ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          recalcAndSaveRoom(room, floor, { perimeterM: v ? parseFloat(v.replace(",", ".")) : undefined });
                        }}
                        className="input-field py-2 text-sm"
                        placeholder="Сумма всех сторон"
                      />
                    </div>
                    {floor.defaultHeightM == null && (
                      <div>
                        <label className="text-slate-500 block">Высота, м</label>
                        <input
                          type="number"
                          step="0.01"
                          value={room.heightM ?? ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            recalcAndSaveRoom(room, floor, { heightM: v ? parseFloat(v.replace(",", ".")) : undefined });
                          }}
                          className="input-field py-2 text-sm"
                        />
                      </div>
                    )}
                    <div>
                      <label className="text-slate-500 block">Площадь пола, м²</label>
                      <input
                        type="number"
                        step="0.01"
                        value={room.floorAreaSqM ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          recalcAndSaveRoom(room, floor, { floorAreaSqM: v ? parseFloat(v.replace(",", ".")) : undefined });
                        }}
                        className="input-field py-2 text-sm"
                        placeholder="Плитка, стяжка, потолок"
                      />
                    </div>
                    <div className={floor.defaultHeightM == null ? "col-span-2" : ""}>
                      <label className="text-slate-500 block">Площадь проёмов, м²</label>
                      <input
                        type="number"
                        step="0.01"
                        value={room.openingsSqM ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          recalcAndSaveRoom(room, floor, { openingsSqM: v ? parseFloat(v.replace(",", ".")) : undefined });
                        }}
                        className="input-field py-2 text-sm"
                        placeholder="0"
                      />
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>

          {addingRoom && selectedFloorId === floor.id ? (
            <div className="mt-4 p-4 bg-white rounded-xl border border-chestro-200 space-y-4">
              <h3 className="font-semibold text-slate-900">Новое помещение</h3>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Название (необязательно)</label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="input-field"
                  placeholder="Кухня, Коридор..."
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-2">Тип</label>
                <div className="flex flex-wrap gap-2">
                  {ROOM_TYPES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setNewRoomType(t.id)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${
                        newRoomType === t.id
                          ? "border-chestro-500 bg-chestro-50 text-chestro-800"
                          : "border-slate-200 bg-white text-slate-600"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              {newRoomType === "slope" ? (
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Погонные метры откосов</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newSlopeM}
                    onChange={(e) => setNewSlopeM(e.target.value)}
                    className="input-field"
                    placeholder="0"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Периметр комнаты, м</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newPerimeterM}
                      onChange={(e) => setNewPerimeterM(e.target.value)}
                      className="input-field"
                      placeholder="Сумма всех сторон"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Площадь пола, м²</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newFloorArea}
                      onChange={(e) => setNewFloorArea(e.target.value)}
                      className="input-field"
                      placeholder="Для плитки, стяжки, покраски потолка"
                    />
                  </div>
                  {floor.defaultHeightM == null && (
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Высота помещения, м</label>
                      <input
                        type="number"
                        step="0.01"
                        value={newRoomHeight}
                        onChange={(e) => setNewRoomHeight(e.target.value)}
                        className="input-field"
                        placeholder="2.7"
                      />
                    </div>
                  )}
                  {floor.defaultHeightM != null && (
                    <p className="text-sm text-slate-600">Высота: {floor.defaultHeightM} м (с этажа)</p>
                  )}
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Площадь проёмов, м²</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newOpenings}
                      onChange={(e) => setNewOpenings(e.target.value)}
                      className="input-field"
                      placeholder="0"
                    />
                  </div>
                </>
              )}
              <div className="flex gap-2">
                <button type="button" onClick={() => handleAddRoom(floor.id)} className="btn-primary flex-1">
                  Добавить
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddingRoom(false);
                    setSelectedFloorId(null);
                  }}
                  className="btn-secondary"
                >
                  Отмена
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setSelectedFloorId(floor.id);
                setAddingRoom(true);
                setNewRoomHeight(floor.defaultHeightM != null ? String(floor.defaultHeightM) : "");
              }}
              className="mt-4 w-full p-4 flex items-center justify-center gap-2 text-chestro-600 font-medium border-2 border-dashed border-chestro-200 hover:border-chestro-400 hover:bg-chestro-50/50 rounded-xl transition"
            >
              <span className="text-xl">+</span>
              {floor.rooms.length > 0 ? "Добавить ещё помещение" : "Добавить помещение"}
            </button>
          )}
        </section>
      ))}

      <button
        type="button"
        onClick={() => addFloor(id)}
        className="w-full card p-4 flex items-center justify-center gap-2 text-slate-600 font-medium border-2 border-dashed border-slate-200 hover:border-chestro-300 hover:text-chestro-600 transition"
      >
        <span className="text-xl">+</span>
        Добавить этаж
      </button>

      {/* Отдельные стены */}
      <section className="pt-6 border-t border-slate-100">
        <h2 className="font-semibold text-slate-900 mb-3">Отдельные стены</h2>
        <p className="text-sm text-slate-500 mb-3">Если нужно учесть стену отдельно (длина × высота − проёмы).</p>
        {obj.walls.length > 0 && (
          <ul className="space-y-3 mb-4">
            {obj.walls.map((wall) => (
              <li key={wall.id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-900">{wall.name}</p>
                    <p className="text-sm text-slate-600">
                      {wall.lengthM} м × {wall.heightM} м → {(wall.areaSqM ?? 0).toFixed(2)} м²
                      {wall.openingsSqM ? ` (минус проёмы ${wall.openingsSqM} м²)` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteWall(id, wall.id)}
                    className="p-2 text-slate-400 hover:text-red-600 rounded-lg"
                    aria-label="Удалить"
                  >
                    ✕
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <label className="text-slate-500 block">Длина, м</label>
                    <input
                      type="number"
                      step="0.01"
                      value={wall.lengthM ?? ""}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value.replace(",", ".")) || 0;
                        const area = calcWallArea(v, wall.heightM ?? 0, wall.openingsSqM ?? 0);
                        updateWall(id, wall.id, { lengthM: v, areaSqM: area });
                      }}
                      className="input-field py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block">Высота, м</label>
                    <input
                      type="number"
                      step="0.01"
                      value={wall.heightM ?? ""}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value.replace(",", ".")) || 0;
                        const area = calcWallArea(wall.lengthM ?? 0, v, wall.openingsSqM ?? 0);
                        updateWall(id, wall.id, { heightM: v, areaSqM: area });
                      }}
                      className="input-field py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block">Проёмы, м²</label>
                    <input
                      type="number"
                      step="0.01"
                      value={wall.openingsSqM ?? ""}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value.replace(",", ".")) || 0;
                        const area = calcWallArea(wall.lengthM ?? 0, wall.heightM ?? 0, v);
                        updateWall(id, wall.id, { openingsSqM: v, areaSqM: area });
                      }}
                      className="input-field py-2 text-sm"
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        {!addingWall ? (
          <button
            type="button"
            onClick={() => setAddingWall(true)}
            className="w-full card p-3 flex items-center justify-center gap-2 text-slate-600 font-medium border border-dashed border-slate-200 hover:border-chestro-300 hover:text-chestro-600 transition"
          >
            <span>+</span> Добавить стену
          </button>
        ) : (
          <div className="card p-4 space-y-3">
            <input
              type="text"
              value={newWallName}
              onChange={(e) => setNewWallName(e.target.value)}
              className="input-field"
              placeholder="Название стены"
            />
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Длина, м</label>
                <input
                  type="number"
                  step="0.01"
                  value={newWallLength}
                  onChange={(e) => setNewWallLength(e.target.value)}
                  className="input-field py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Высота, м</label>
                <input
                  type="number"
                  step="0.01"
                  value={newWallHeight}
                  onChange={(e) => setNewWallHeight(e.target.value)}
                  className="input-field py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Проёмы, м²</label>
                <input
                  type="number"
                  step="0.01"
                  value={newWallOpenings}
                  onChange={(e) => setNewWallOpenings(e.target.value)}
                  className="input-field py-2 text-sm"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const lengthM = parseFloat(newWallLength.replace(",", ".")) || 0;
                  const heightM = parseFloat(newWallHeight.replace(",", ".")) || 0;
                  const openingsSqM = parseFloat(newWallOpenings.replace(",", ".")) || 0;
                  const areaSqM = calcWallArea(lengthM, heightM, openingsSqM);
                  addWall(id, {
                    id: uuid(),
                    name: newWallName.trim() || "Стена",
                    lengthM,
                    heightM,
                    areaSqM,
                    openingsSqM: openingsSqM || undefined,
                  });
                  setAddingWall(false);
                  setNewWallName("");
                  setNewWallLength("");
                  setNewWallHeight("");
                  setNewWallOpenings("");
                }}
                className="btn-primary flex-1"
              >
                Добавить
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddingWall(false);
                  setNewWallName("");
                  setNewWallLength("");
                  setNewWallHeight("");
                  setNewWallOpenings("");
                }}
                className="btn-secondary"
              >
                Отмена
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Итого по замерам */}
      <section className="card p-4">
        <h2 className="font-semibold text-slate-900 mb-3">Итого по замерам</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-slate-500">Сухие помещения</p>
            <p className="font-semibold text-slate-900">{summary.dryRoomsSqM.toFixed(2)} м²</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-slate-500">Санузлы</p>
            <p className="font-semibold text-slate-900">{summary.wetRoomsSqM.toFixed(2)} м²</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-slate-500">Откосы</p>
            <p className="font-semibold text-slate-900">{summary.slopesLinearM.toFixed(2)} м.п.</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-slate-500">Площадь пола</p>
            <p className="font-semibold text-slate-900">{summary.totalFloorSqM.toFixed(2)} м²</p>
          </div>
          <div className="bg-chestro-50 rounded-xl p-3">
            <p className="text-chestro-700">Итоговый объём</p>
            <p className="font-semibold text-chestro-800">
              {(summary.totalWallSqM + summary.slopesLinearM).toFixed(2)}
            </p>
            <p className="text-xs text-chestro-600/80 mt-0.5">стены м² + откосы м.п.</p>
          </div>
        </div>
        {(floors.some((f) => f.rooms.length > 0) || (obj.walls?.length ?? 0) > 0) && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-sm font-medium text-slate-700 mb-2">По помещениям и стенам:</p>
            <ul className="space-y-1 text-sm">
              {floors.map((floor) =>
                floor.rooms.map((room) => (
                  <li key={room.id} className="flex justify-between gap-2 text-slate-700">
                    <span className="truncate">
                      {floor.label} — {room.name}
                    </span>
                    <span className="font-medium shrink-0">
                      {room.type === "slope"
                        ? `${(room.slopeLinearM ?? 0).toFixed(2)} м.п.`
                        : `${(room.wallAreaSqM ?? 0).toFixed(2)} м²`}
                    </span>
                  </li>
                ))
              )}
              {(obj.walls ?? []).map((wall) => (
                <li key={wall.id} className="flex justify-between gap-2 text-slate-700">
                  <span className="truncate">Стена — {wall.name}</span>
                  <span className="font-medium shrink-0">
                    {(wall.areaSqM ?? calcWallArea(wall.lengthM ?? 0, wall.heightM ?? 0, wall.openingsSqM ?? 0)).toFixed(2)} м²
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
