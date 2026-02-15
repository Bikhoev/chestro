"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { getMeasurementSummary, calcRoomWallArea, calcWallArea } from "@/lib/calculations";
import { ROOM_TYPES } from "@/lib/constants";
import type { Room, RoomType, WallItem } from "@/lib/types";
import { v4 as uuid } from "uuid";

export default function MeasurementPage() {
  const params = useParams();
  const id = params.id as string;
  const { getObject, addRoom, updateRoom, deleteRoom, addWall, updateWall, deleteWall } = useStore();
  const [mounted, setMounted] = useState(false);
  const [addingRoom, setAddingRoom] = useState(false);
  const [addingWall, setAddingWall] = useState(false);
  const [newWallName, setNewWallName] = useState("");
  const [newWallLength, setNewWallLength] = useState("");
  const [newWallHeight, setNewWallHeight] = useState("");
  const [newWallOpenings, setNewWallOpenings] = useState("");
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomType, setNewRoomType] = useState<RoomType>("dry");
  const [newRoomHeight, setNewRoomHeight] = useState("");
  const [newPerimeterM, setNewPerimeterM] = useState("");
  const [newOpenings, setNewOpenings] = useState("");
  const [newSlopeM, setNewSlopeM] = useState("");

  useEffect(() => setMounted(true), []);
  const obj = mounted ? getObject(id) : null;

  if (!mounted || !obj) {
    return <div className="px-4 sm:px-6 py-6 max-w-full overflow-x-hidden box-border" />;
  }

  const summary = getMeasurementSummary(obj.rooms, obj.walls);

  const handleAddRoom = () => {
    const name = newRoomName.trim() || `Помещение ${obj.rooms.length + 1}`;
    if (newRoomType === "slope") {
      const linearM = parseFloat(newSlopeM.replace(",", ".")) || 0;
      addRoom(id, {
        id: uuid(),
        name,
        type: "slope",
        slopeLinearM: linearM,
      });
    } else {
      const heightM = parseFloat(newRoomHeight.replace(",", ".")) || 0;
      const perimeterM = parseFloat(newPerimeterM.replace(",", ".")) || 0;
      const openingsSqM = parseFloat(newOpenings.replace(",", ".")) || 0;
      const wallAreaSqM = calcRoomWallArea(perimeterM, heightM, openingsSqM);
      addRoom(id, {
        id: uuid(),
        name,
        type: newRoomType,
        heightM: heightM || undefined,
        perimeterM: perimeterM || undefined,
        wallAreaSqM,
        openingsSqM: openingsSqM || undefined,
      });
    }
    setAddingRoom(false);
    setNewRoomName("");
    setNewRoomType("dry");
    setNewRoomHeight("");
    setNewPerimeterM("");
    setNewOpenings("");
    setNewSlopeM("");
  };

  const recalcAndSaveRoom = (room: Room, updates: Partial<Room>) => {
    const next = { ...room, ...updates };
    if (next.type !== "slope") {
      const heightM = next.heightM ?? 0;
      const perimeterM = next.perimeterM ?? 0;
      const openingsSqM = next.openingsSqM ?? 0;
      next.wallAreaSqM = calcRoomWallArea(perimeterM, heightM, openingsSqM);
    }
    updateRoom(id, room.id, next);
  };

  return (
    <div className="px-4 sm:px-6 py-6 space-y-6 max-w-full overflow-x-hidden box-border">
      {/* Сводка */}
      <section className="card p-4">
        <h2 className="font-semibold text-slate-900 mb-3">Итого по замерам</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
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
          <div className="bg-chestro-50 rounded-xl p-3">
            <p className="text-chestro-700">Итоговый объём</p>
            <p className="font-semibold text-chestro-800">
              {(summary.totalWallSqM + summary.slopesLinearM).toFixed(2)}
            </p>
            <p className="text-xs text-chestro-600/80 mt-0.5">стены м² + откосы м.п.</p>
          </div>
        </div>
      </section>

      {/* Список комнат */}
      <section>
        <h2 className="font-semibold text-slate-900 mb-3">Помещения</h2>
        <ul className="space-y-3">
          {obj.rooms.map((room) => (
            <li key={room.id} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900">{room.name}</p>
                  <p className="text-sm text-slate-500">
                    {room.type === "slope"
                      ? "Откосы"
                      : room.type === "wet"
                        ? "Санузел"
                        : "Сухое помещение"}
                  </p>
                  {room.type !== "slope" && (
                    <p className="text-sm text-slate-700 mt-1">
                      Периметр × высота → {(room.wallAreaSqM ?? 0).toFixed(2)} м²
                      {room.openingsSqM ? ` (минус проёмы ${room.openingsSqM} м²)` : ""}
                    </p>
                  )}
                  {room.type === "slope" && (
                    <p className="text-sm text-slate-700 mt-1">{(room.slopeLinearM ?? 0).toFixed(2)} м.п.</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => deleteRoom(id, room.id)}
                  className="p-2 text-slate-400 hover:text-red-600 rounded-lg"
                  aria-label="Удалить"
                >
                  ✕
                </button>
              </div>
              {room.type !== "slope" && (
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <label className="text-slate-500 block">Периметр, м</label>
                    <input
                      type="number"
                      step="0.01"
                      value={room.perimeterM ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        recalcAndSaveRoom(room, { perimeterM: v ? parseFloat(v.replace(",", ".")) : undefined });
                      }}
                      className="input-field py-2 text-sm"
                      placeholder="Сумма всех сторон"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block">Высота, м</label>
                    <input
                      type="number"
                      step="0.01"
                      value={room.heightM ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        recalcAndSaveRoom(room, { heightM: v ? parseFloat(v.replace(",", ".")) : undefined });
                      }}
                      className="input-field py-2 text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-slate-500 block">Площадь проёмов, м²</label>
                    <input
                      type="number"
                      step="0.01"
                      value={room.openingsSqM ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        recalcAndSaveRoom(room, { openingsSqM: v ? parseFloat(v.replace(",", ".")) : undefined });
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
      </section>

      {/* Одна кнопка «Добавить помещение» */}
      {!addingRoom ? (
        <button
          type="button"
          onClick={() => setAddingRoom(true)}
          className="w-full card p-4 flex items-center justify-center gap-2 text-chestro-600 font-medium border-2 border-dashed border-chestro-200 hover:border-chestro-400 hover:bg-chestro-50/50 transition"
        >
          <span className="text-xl">+</span>
          {obj.rooms.length > 0 ? "Добавить ещё помещение" : "Добавить помещение"}
        </button>
      ) : (
        <div className="card p-4 space-y-4">
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
                  placeholder="Сумма всех сторон (длина+длина+ширина+ширина)"
                />
                <p className="text-xs text-slate-500 mt-1">Площадь стен = периметр × высота (минус проёмы).</p>
              </div>
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
              <div>
                <label className="block text-sm text-slate-600 mb-1">Площадь проёмов (окна, двери), м²</label>
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
            <button type="button" onClick={handleAddRoom} className="btn-primary flex-1">
              Добавить
            </button>
            <button type="button" onClick={() => setAddingRoom(false)} className="btn-secondary">
              Отмена
            </button>
          </div>
        </div>
      )}

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
              <button type="button" onClick={() => setAddingWall(false)} className="btn-secondary">
                Отмена
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
