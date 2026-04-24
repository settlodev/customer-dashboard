"use client";

import { useMemo, useState } from "react";
import { Copy, Download, Hash, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface SerialNumbersViewerProps {
  serialNumbers: string[];
  itemName?: string;
  sku?: string | null;
}

const ROW_HEIGHT = 32;
const OVERSCAN = 8;

export default function SerialNumbersViewer({
  serialNumbers,
  itemName,
  sku,
}: SerialNumbersViewerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [scrollTop, setScrollTop] = useState(0);
  const { toast } = useToast();

  const total = serialNumbers.length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return serialNumbers;
    return serialNumbers.filter((sn) => sn.toLowerCase().includes(q));
  }, [serialNumbers, query]);

  const viewportHeight = 360;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(
    filtered.length,
    Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT) + OVERSCAN,
  );
  const visible = filtered.slice(startIndex, endIndex);

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(filtered.join("\n"));
      toast({
        title: "Copied",
        description: `${filtered.length.toLocaleString()} serial number${filtered.length === 1 ? "" : "s"} copied to clipboard.`,
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Copy failed",
        description: "Your browser blocked clipboard access.",
      });
    }
  };

  const downloadTxt = () => {
    const blob = new Blob([filtered.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeName = (itemName || "serials").replace(/[^a-z0-9]+/gi, "_");
    a.download = `${safeName}_serials.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (total === 0) return <span className="text-gray-400">—</span>;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors px-2 py-1 text-xs font-medium text-gray-700"
        >
          <Hash className="h-3 w-3" />
          {total.toLocaleString()} serial{total === 1 ? "" : "s"}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hash className="h-4 w-4" />
            Serial numbers
          </DialogTitle>
          {(itemName || sku) && (
            <p className="text-sm text-muted-foreground">
              {itemName}
              {sku ? <span className="font-mono"> · {sku}</span> : null}
            </p>
          )}
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search serial numbers..."
            className="pl-8"
          />
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {query
              ? `${filtered.length.toLocaleString()} of ${total.toLocaleString()} match`
              : `${total.toLocaleString()} total`}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={copyAll}
              disabled={filtered.length === 0}
              className="h-7 px-2 text-xs"
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy{query ? " filtered" : " all"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={downloadTxt}
              disabled={filtered.length === 0}
              className="h-7 px-2 text-xs"
            >
              <Download className="h-3 w-3 mr-1" />
              Download
            </Button>
          </div>
        </div>

        <div
          onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
          style={{ height: viewportHeight }}
          className="overflow-y-auto rounded-md border bg-gray-50/60"
        >
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              No matches
            </div>
          ) : (
            <div
              style={{ height: filtered.length * ROW_HEIGHT, position: "relative" }}
            >
              <div
                style={{
                  position: "absolute",
                  top: startIndex * ROW_HEIGHT,
                  left: 0,
                  right: 0,
                }}
              >
                {visible.map((sn, i) => {
                  const absoluteIndex = startIndex + i;
                  return (
                    <div
                      key={`${absoluteIndex}-${sn}`}
                      style={{ height: ROW_HEIGHT }}
                      className="flex items-center justify-between px-3 border-b last:border-b-0 hover:bg-white"
                    >
                      <span className="font-mono text-xs text-gray-800 truncate">
                        {sn}
                      </span>
                      <span className="text-[10px] text-gray-400 ml-2 tabular-nums">
                        #{absoluteIndex + 1}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
