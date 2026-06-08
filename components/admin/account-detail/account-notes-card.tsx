"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { addAccountNote } from "@/lib/actions/admin/account-stub-actions";
import { AccountNote } from "@/types/admin/account-insights";
import { formatDateTime } from "@/components/admin/shared/format";

/**
 * Internal notes logger for the account-detail Support card. The notes
 * endpoint isn't live yet (`addAccountNote` is a stub), so saving surfaces
 * an honest "pending" message rather than persisting — the composer UI is
 * ready for when the backend lands.
 */
export function AccountNotesCard({
  accountId,
  notes,
}: {
  accountId: string;
  notes: AccountNote[];
}) {
  const { toast } = useToast();
  const [composing, setComposing] = useState(false);
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const res = await addAccountNote(accountId, trimmed);
      toast({
        title:
          res.responseType === "success" ? "Note saved" : "Notes coming soon",
        description: res.message,
      });
      if (res.responseType === "success") {
        setText("");
        setComposing(false);
      }
    });
  };

  if (notes.length > 0) {
    return (
      <div className="mt-3.5 space-y-2.5">
        {notes.map((note) => (
          <div
            key={note.id}
            className="rounded-xl border border-line bg-surface p-3"
          >
            <p className="text-[13px] text-ink-2">{note.text}</p>
            <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">
              {note.author} · {formatDateTime(note.at)}
            </p>
          </div>
        ))}
      </div>
    );
  }

  if (composing) {
    return (
      <div className="mt-3.5 rounded-xl border border-line bg-surface p-3">
        <Textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Log a call, context or next step for the team…"
          className="min-h-[80px] resize-none text-[13px]"
        />
        <div className="mt-2.5 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setComposing(false);
              setText("");
            }}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="accent"
            size="sm"
            onClick={submit}
            disabled={pending || !text.trim()}
          >
            {pending ? "Saving…" : "Save note"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3.5 rounded-xl border border-dashed border-line-2 p-[18px] text-center">
      <p className="text-[13px] font-semibold text-ink">No internal notes yet</p>
      <p className="mt-0.5 text-[12px] text-muted-foreground">
        Log a call, context or next step for the team.
      </p>
      <Button
        type="button"
        variant="accent"
        size="sm"
        className="mt-3"
        onClick={() => setComposing(true)}
      >
        <Plus className="h-3.5 w-3.5" />
        Add note
      </Button>
    </div>
  );
}
