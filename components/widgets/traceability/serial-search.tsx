"use client";

import { useState, useTransition } from "react";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  SerialNumber,
  SERIAL_STATUS_LABELS,
  SERIAL_STATUS_TONES,
} from "@/types/traceability/type";
import { searchSerialNumbers } from "@/lib/actions/traceability-actions";

export function SerialSearch() {
  const [query, setQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<SerialNumber[]>([]);
  const [isPending, startTransition] = useTransition();

  const run = () => {
    startTransition(async () => {
      const res = await searchSerialNumbers(query);
      setResults(res);
      setHasSearched(true);
    });
  };

  return (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="pt-6 space-y-4">
        <div>
          <h3 className="text-lg font-medium">Serial number lookup</h3>
          <p className="text-xs text-muted-foreground">
            Search by full or partial serial. Scoped to your current location.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") run();
              }}
              placeholder="e.g. IMEI-1234 or ABC123"
              className="pl-9 font-mono"
              disabled={isPending}
            />
          </div>
          <Button onClick={run} disabled={isPending || !query.trim()}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
          </Button>
        </div>

        {hasSearched && results.length === 0 && !isPending && (
          <p className="text-sm text-muted-foreground italic">
            No serials matching &ldquo;{query}&rdquo; at this location.
          </p>
        )}

        {results.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/60">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">Serial</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">Variant</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">Batch</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">GRN</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {results.map((s) => (
                  <tr key={s.id}>
                    <td className="px-3 py-2 font-mono">{s.serialNumber}</td>
                    <td className="px-3 py-2">{s.stockVariantDisplayName || "—"}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${SERIAL_STATUS_TONES[s.status]}`}
                      >
                        {SERIAL_STATUS_LABELS[s.status]}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground font-mono">
                      {s.batchId ? s.batchId.slice(0, 8) : "—"}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground font-mono">
                      {s.grnId ? s.grnId.slice(0, 8) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
