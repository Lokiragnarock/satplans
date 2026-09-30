"use client";

import { useCallback, useState } from "react";
import type { ActionResult } from "@/app/actions";

export function useRunner(refresh: () => Promise<void>) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (fn: () => Promise<ActionResult>) => {
      setBusy(true);
      const result = await fn();
      setError(result.ok ? null : result.error);
      await refresh();
      setBusy(false);
      return result.ok;
    },
    [refresh],
  );

  return { run, busy, error };
}
