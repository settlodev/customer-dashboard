"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  MessageSquarePlus,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  StickyNote,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

import {
  createBusinessNote,
  deleteBusinessNote,
  setBusinessNotePinned,
  updateBusinessNote,
} from "@/lib/actions/admin/business-notes";
import { BusinessNote, BusinessNotePage } from "@/types/admin/business-note";
import { InternalRole } from "@/types/types";

interface BusinessNotesPanelProps {
  businessId: string;
  initialPage: BusinessNotePage | null;
  error: string | null;
  currentUserId: string | null;
  currentUserRole: InternalRole | null;
}

const MAX_LENGTH = 4000;
const PIN_ROLES: InternalRole[] = [
  "SYSTEM_ADMIN",
  "SUPER_ADMIN",
  "SUPPORT_AGENT",
];

function formatTimestamp(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function formatRelative(value: string | null | undefined): string {
  if (!value) return "";
  try {
    const date = new Date(value);
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / 60_000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return formatTimestamp(value);
  } catch {
    return "";
  }
}

function roleLabel(role: string | null | undefined): string {
  if (!role) return "";
  return role
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function authorInitials(note: BusinessNote): string {
  const source = note.authorName || note.authorEmail || "";
  if (!source) return "·";
  const parts = source.split(/[\s@.]+/).filter(Boolean).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("");
}

interface ComposerProps {
  businessId: string;
  canPin: boolean;
  onCreated: () => void;
}

function NoteComposer({ businessId, canPin, onCreated }: ComposerProps) {
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [pinned, setPinned] = useState(false);
  const [error, setError] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    setError("");
    const trimmed = content.trim();
    if (trimmed.length === 0) {
      setError("Add some text before posting");
      return;
    }
    startTransition(async () => {
      const result = await createBusinessNote(businessId, {
        content: trimmed,
        pinned: canPin ? pinned : undefined,
      });
      if (result.responseType === "error") {
        setError(result.message);
        return;
      }
      toast({ title: "Note added" });
      setContent("");
      setPinned(false);
      onCreated();
    });
  };

  return (
    <div className="space-y-2 rounded-md border border-line bg-canvas/40 p-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Leave a note for other staff — collections context, support history, sales conversations…"
        rows={3}
        maxLength={MAX_LENGTH}
        disabled={isPending}
      />
      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-2 py-1 text-[12px] text-destructive">
          {error}
        </p>
      )}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] text-muted-foreground">
            {content.length} / {MAX_LENGTH}
          </span>
          {canPin && (
            <label className="flex cursor-pointer items-center gap-1.5 text-[12px] text-muted-foreground">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                disabled={isPending}
                className="h-3.5 w-3.5 cursor-pointer"
              />
              Pin to top
            </label>
          )}
        </div>
        <Button
          type="button"
          size="sm"
          onClick={submit}
          disabled={isPending || content.trim().length === 0}
        >
          {isPending ? (
            <span className="flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Posting…
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <MessageSquarePlus className="h-3.5 w-3.5" />
              Post note
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}

interface NoteItemProps {
  businessId: string;
  note: BusinessNote;
  canModerate: boolean;
  isOwn: boolean;
  canPin: boolean;
  onChanged: () => void;
}

function NoteItem({
  businessId,
  note,
  canModerate,
  isOwn,
  canPin,
  onChanged,
}: NoteItemProps) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(note.content);
  const [error, setError] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!editing) return;
    setContent(note.content);
    requestAnimationFrame(() => textareaRef.current?.focus());
  }, [editing, note.content]);

  const canEditOrDelete = isOwn || canModerate;

  const saveEdit = () => {
    setError("");
    const trimmed = content.trim();
    if (trimmed.length === 0) {
      setError("Add some text before saving");
      return;
    }
    if (trimmed === note.content.trim()) {
      setEditing(false);
      return;
    }
    startTransition(async () => {
      const result = await updateBusinessNote(businessId, note.id, {
        content: trimmed,
      });
      if (result.responseType === "error") {
        setError(result.message);
        return;
      }
      toast({ title: "Note updated" });
      setEditing(false);
      onChanged();
    });
  };

  const handleDelete = () => {
    if (!confirm("Delete this note? It can't be undone.")) return;
    startTransition(async () => {
      const result = await deleteBusinessNote(businessId, note.id);
      if (result.responseType === "error") {
        toast({
          title: "Delete failed",
          description: result.message,
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Note deleted" });
      onChanged();
    });
  };

  const handlePin = (target: boolean) => {
    startTransition(async () => {
      const result = await setBusinessNotePinned(businessId, note.id, target);
      if (result.responseType === "error") {
        toast({
          title: "Action failed",
          description: result.message,
          variant: "destructive",
        });
        return;
      }
      toast({ title: result.message });
      onChanged();
    });
  };

  return (
    <li
      className={
        "rounded-lg border bg-card p-4 " +
        (note.pinned
          ? "border-amber-200 ring-1 ring-amber-200/40 dark:border-amber-500/30 dark:ring-amber-500/20"
          : "border-line")
      }
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-primary/10 font-mono text-[12px] font-semibold text-primary">
          {authorInitials(note)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 text-[13px]">
                <span className="font-medium text-ink">
                  {note.authorName || note.authorEmail || "Unknown author"}
                </span>
                {note.authorRole && (
                  <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[10.5px] capitalize text-muted-foreground">
                    {roleLabel(note.authorRole)}
                  </span>
                )}
                {note.pinned && (
                  <Badge
                    variant="outline"
                    className="border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20"
                  >
                    <Pin className="mr-1 h-3 w-3" />
                    Pinned
                  </Badge>
                )}
              </p>
              <p className="font-mono text-[11px] text-muted-foreground">
                {formatRelative(note.createdAt)}
                {note.updatedAt &&
                  note.updatedAt !== note.createdAt &&
                  ` · edited ${formatRelative(note.updatedAt)}`}
              </p>
            </div>
            {(canEditOrDelete || canPin) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    aria-label="Note actions"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canPin && !note.pinned && (
                    <DropdownMenuItem
                      onSelect={() => handlePin(true)}
                      disabled={isPending}
                    >
                      <Pin className="mr-2 h-3.5 w-3.5" />
                      Pin to top
                    </DropdownMenuItem>
                  )}
                  {canPin && note.pinned && (
                    <DropdownMenuItem
                      onSelect={() => handlePin(false)}
                      disabled={isPending}
                    >
                      <PinOff className="mr-2 h-3.5 w-3.5" />
                      Unpin
                    </DropdownMenuItem>
                  )}
                  {canEditOrDelete && (
                    <DropdownMenuItem
                      onSelect={() => setEditing(true)}
                      disabled={isPending}
                    >
                      <Pencil className="mr-2 h-3.5 w-3.5" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {canEditOrDelete && (
                    <DropdownMenuItem
                      onSelect={handleDelete}
                      disabled={isPending}
                      className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Body */}
          {editing ? (
            <div className="mt-2 space-y-2">
              <Textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
                maxLength={MAX_LENGTH}
                disabled={isPending}
              />
              {error && (
                <p className="rounded-md border border-destructive/30 bg-destructive/5 px-2 py-1 text-[12px] text-destructive">
                  {error}
                </p>
              )}
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditing(false);
                    setError("");
                  }}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={saveEdit}
                  disabled={isPending}
                >
                  {isPending ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-2 whitespace-pre-wrap break-words text-[13px] text-ink">
              {note.content}
            </p>
          )}
        </div>
      </div>
    </li>
  );
}

export function BusinessNotesPanel({
  businessId,
  initialPage,
  error,
  currentUserId,
  currentUserRole,
}: BusinessNotesPanelProps) {
  const router = useRouter();
  const canPin = currentUserRole ? PIN_ROLES.includes(currentUserRole) : false;
  const canModerate = currentUserRole === "SYSTEM_ADMIN";

  const notes = useMemo(() => initialPage?.content ?? [], [initialPage]);

  const refresh = () => router.refresh();

  return (
    <div className="rounded-lg border border-line bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <StickyNote className="h-4 w-4 text-primary" />
          Staff case notes
        </h3>
        {initialPage && initialPage.totalElements > 0 && (
          <p className="font-mono text-[11px] text-muted-foreground">
            {initialPage.totalElements} note
            {initialPage.totalElements === 1 ? "" : "s"}
          </p>
        )}
      </div>

      <NoteComposer
        businessId={businessId}
        canPin={canPin}
        onCreated={refresh}
      />

      <div className="mt-4">
        {error ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : notes.length === 0 ? (
          <p className="rounded-md border border-dashed border-line p-6 text-center text-sm text-muted-foreground">
            No notes yet. Be the first to document what you found.
          </p>
        ) : (
          <ul className="space-y-3">
            {notes.map((note) => (
              <NoteItem
                key={note.id}
                businessId={businessId}
                note={note}
                canModerate={canModerate}
                isOwn={!!currentUserId && note.authorUserId === currentUserId}
                canPin={canPin}
                onChanged={refresh}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
