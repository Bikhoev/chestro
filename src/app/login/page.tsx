"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
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
    const ok = login(email.trim(), password);
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
        <h1 className="text-xl font-semibold text-slate-900">Вход</h1>
      </header>
      <main className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full mt-8">
        <p className="text-slate-600 mb-4">
          Локальный вход: данные хранятся только на этом устройстве. В полной версии будет облачная синхронизация.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
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
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="btn-primary w-full py-3">
            Войти
          </button>
        </form>
        <Link href="/" className="btn-ghost w-full py-3 text-center mt-4">
          На главную
        </Link>
      </main>
    </div>
  );
}
