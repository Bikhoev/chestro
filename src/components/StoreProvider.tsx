"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { StoreProvider as Provider } from "@/lib/store";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const path = usePathname();

  useEffect(() => {
    // Persist state on navigation (store already saves in reducer)
  }, [path]);

  return <Provider>{children}</Provider>;
}
