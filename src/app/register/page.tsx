"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Введите email и пароль");
      return;
    }
    const ok = register(email.trim(), password, name.trim());
    if (ok) {
      router.push("/");
    } else {
      setError("Проверьте введённые данные");
    }
  };

  return (
    <div className="min-h-screen flex flex-col safe-top safe-bottom bg-surface px-6 py-8">
      <header className="flex items-center gap-4">
        <button type="button" onClick={() => router.back()} className="p-2 -ml-2 text-slate-600" aria-label="Назад">
          ←
        </button>
        <h1 className="text-xl font-semibold text-slate-900">Регистрация</h1>
      </header>
      <main className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full mt-8">
        <p className="text-slate-600 mb-4">
          Учётная запись хранится локально. В полной версии будет облако и синхронизация.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Имя</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="Как к вам обращаться"
              autoComplete="name"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="email@example.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="btn-primary w-full py-3">
            Зарегистрироваться
          </button>
        </form>
        <Link href="/" className="btn-ghost w-full py-3 text-center mt-4">
          На главную
        </Link>
      </main>
    </div>
  );
}
