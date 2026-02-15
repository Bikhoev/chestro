import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "Chestro — учёт объектов для строителей",
  description: "Объекты, замеры, сметы и материалы в одном приложении",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="min-h-screen">
        <AuthProvider>
          <StoreProvider>{children}</StoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
