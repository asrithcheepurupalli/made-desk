"use client";

import { useEffect, useRef, useState } from "react";
import { STORE_EVENT } from "@/lib/supabase/filestore";

/**
 * Loads data from the browser store and reloads it whenever anything in the store
 * changes (this tab or another). Replaces server-side revalidation.
 * Returns null until the first load completes.
 */
export function useStoreQuery<T>(loader: () => Promise<T>): T | null {
  const [data, setData] = useState<T | null>(null);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  useEffect(() => {
    let alive = true;
    let seq = 0;
    const load = async () => {
      const mine = ++seq;
      try {
        const next = await loaderRef.current();
        if (alive && mine === seq) setData(next);
      } catch (err) {
        console.error("[made. desk] Store load failed:", err);
      }
    };
    load();
    window.addEventListener(STORE_EVENT, load);
    return () => {
      alive = false;
      window.removeEventListener(STORE_EVENT, load);
    };
  }, []);

  return data;
}
