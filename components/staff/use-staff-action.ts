"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";

type ActionResult = { responseType?: string; message: string } | void;

/**
 * Shared runner for the staff detail page's server actions.
 *
 * The staff actions are split across two surfaces — the header (roster
 * lifecycle) and the Access tab (dashboard / POS credentials) — so the
 * toast + refresh + in-flight bookkeeping lives here rather than being
 * duplicated in both. `loading` holds the key of the action currently in
 * flight, which call sites use to disable buttons and swap labels.
 */
export function useStaffAction() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const run = async (
    key: string,
    action: () => Promise<ActionResult>,
    successTitle: string,
    after?: () => void,
  ) => {
    setLoading(key);
    try {
      const result = (await action()) ?? {
        responseType: "success",
        message: successTitle,
      };
      const ok = result.responseType !== "error";
      toast({
        variant: ok ? "success" : "destructive",
        title: ok ? successTitle : "Action failed",
        description: result.message,
      });
      if (ok) {
        after?.();
        router.refresh();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Action failed",
        description: (error as Error).message,
      });
    } finally {
      setLoading(null);
    }
  };

  return { loading, run };
}
