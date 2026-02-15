"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store";

export default function NewObjectPage() {
  const router = useRouter();
  const { addObject, selectedActivity } = useStore();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [houseOrFlat, setHouseOrFlat] = useState<"house" | "apartment">("apartment");
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !location.trim()) return;
    const id = addObject(
      {
        name: name.trim(),
        location: location.trim(),
        houseOrFlat,
        phone: phone.trim() || undefined,
        comment: comment.trim() || undefined,
      },
      selectedActivity ?? "other"
    );
    router.push(`/objects/${id}`);
  };

  return (
    <div className="min-h-screen flex flex-col safe-top safe-bottom bg-surface">
      <header className="px-6 py-5 border-b border-slate-100 flex items-center gap-4">
        <Link href="/objects" className="p-2 -ml-2 text-slate-600" aria-label="Назад">
          ←
        </Link>
        <h1 className="text-xl font-semibold text-slate-900">Новый объект</h1>
      </header>
      <main className="flex-1 px-6 py-6 overflow-auto">
        <form onSubmit={handleSubmit} className="max-w-md space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Имя клиента *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="Иван Иванов"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Адрес / локация *</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="input-field"
              placeholder="г. Москва, ул. Примерная, 1"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Тип объекта</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setHouseOrFlat("apartment")}
                className={`flex-1 py-3 rounded-xl border text-sm font-medium transition ${
                  houseOrFlat === "apartment"
                    ? "border-chestro-500 bg-chestro-50 text-chestro-700"
                    : "border-slate-200 bg-white text-slate-600"
                }`}
              >
                Квартира
              </button>
              <button
                type="button"
                onClick={() => setHouseOrFlat("house")}
                className={`flex-1 py-3 rounded-xl border text-sm font-medium transition ${
                  houseOrFlat === "house"
                    ? "border-chestro-500 bg-chestro-50 text-chestro-700"
                    : "border-slate-200 bg-white text-slate-600"
                }`}
              >
                Дом
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Телефон (необязательно)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input-field"
              placeholder="+7 (999) 123-45-67"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Комментарий (необязательно)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="input-field min-h-[80px] resize-y"
              placeholder="Заметки по объекту"
              rows={3}
            />
          </div>
          <div className="pt-4 flex gap-3">
            <button type="submit" className="btn-primary flex-1 py-3.5">
              Создать объект
            </button>
            <Link href="/objects" className="btn-secondary py-3.5 px-6">
              Отмена
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
