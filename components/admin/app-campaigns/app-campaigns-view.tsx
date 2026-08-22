"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Megaphone, Pencil, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogIcon,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

import {
  createAppCampaign,
  deleteAppCampaign,
  updateAppCampaign,
} from "@/lib/actions/admin/app-campaigns";
import { APP_ICON_OPTIONS, type AppCampaignRow } from "@/types/admin/app-campaign";

const NO_ICON = "NONE";

const EMPTY_FORM = {
  name: "",
  appType: "POS",
  platform: "ANDROID",
  startsAt: "",
  endsAt: "",
  priority: 0,
  enabled: true,
  appIcon: "",
  message: "",
  messageIcon: "",
  minAppVersionCode: "",
};

type FormState = typeof EMPTY_FORM;

/**
 * Format a server ISO instant for a datetime-local input.
 *
 * MUST use the local getters, not `iso.slice(0, 16)`. The server sends UTC (or
 * an offset), a datetime-local input is read back as LOCAL time, and submit
 * does `new Date(local).toISOString()`. Slicing would make every edit-and-save
 * shift the campaign window by the operator's UTC offset — +3h in Tanzania.
 */
const toLocalInput = (iso: string): string => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
};

const toForm = (row: AppCampaignRow): FormState => ({
  name: row.name,
  appType: row.appType,
  platform: row.platform,
  startsAt: toLocalInput(row.startsAt),
  endsAt: toLocalInput(row.endsAt),
  priority: row.priority,
  enabled: row.enabled,
  appIcon: row.appIcon ?? "",
  message: row.message ?? "",
  messageIcon: row.messageIcon ?? "",
  minAppVersionCode:
    row.minAppVersionCode == null ? "" : String(row.minAppVersionCode),
});

export function AppCampaignsView({ campaigns }: { campaigns: AppCampaignRow[] }) {
  const router = useRouter();
  const { toast } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<AppCampaignRow | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [deleteTarget, setDeleteTarget] = useState<AppCampaignRow | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletePending, startDeleteTransition] = useTransition();

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingRow(null);
    setError(null);
    setFormOpen(true);
  };

  const openEdit = (row: AppCampaignRow) => {
    setForm(toForm(row));
    setEditingRow(row);
    setError(null);
    setFormOpen(true);
  };

  const submit = () => {
    setError(null);
    const payload = {
      ...form,
      appIcon: form.appIcon || null,
      message: form.message || null,
      messageIcon: form.messageIcon || null,
      minAppVersionCode: form.minAppVersionCode || null,
      startsAt: new Date(form.startsAt).toISOString(),
      endsAt: new Date(form.endsAt).toISOString(),
    };

    startTransition(async () => {
      const result = editingRow
        ? await updateAppCampaign(editingRow.id, payload)
        : await createAppCampaign(payload);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      toast({
        title: editingRow ? "Campaign updated" : "Campaign created",
        description: result.row.name,
      });
      setFormOpen(false);
      router.refresh();
    });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    startDeleteTransition(async () => {
      const result = await deleteAppCampaign(deleteTarget.id);
      if (!result.ok) {
        setDeleteError(result.message);
        return;
      }
      toast({ title: "Campaign deleted", description: deleteTarget.name });
      setDeleteTarget(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
        Campaigns are Settlo-wide — every till on every account sees them.
        Changing the app icon moves the launcher entry; on some POS launchers the
        pinned home-screen icon does not follow automatically.
      </p>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Campaigns
            </CardTitle>
            <CardDescription>
              Seasonal icons and top-bar messages pushed to the POS app.
            </CardDescription>
          </div>
          <Button onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" />
            New campaign
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-line">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Window</TableHead>
                  <TableHead>Icon</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Enabled</TableHead>
                  <TableHead className="w-[110px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No campaigns yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  campaigns.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium text-ink">
                        {row.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(row.startsAt).toLocaleDateString()} →{" "}
                        {new Date(row.endsAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{row.appIcon ?? "—"}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {row.message ?? "—"}
                      </TableCell>
                      <TableCell>{row.priority}</TableCell>
                      <TableCell>
                        {row.enabled ? (
                          <Badge variant="outline">Yes</Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-muted text-muted-foreground"
                          >
                            No
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label={`Edit ${row.name}`}
                            onClick={() => openEdit(row)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            aria-label={`Delete ${row.name}`}
                            onClick={() => {
                              setDeleteTarget(row);
                              setDeleteError(null);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* create / edit */}
      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          if (!pending) setFormOpen(open);
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{editingRow ? "Edit campaign" : "New campaign"}</DialogTitle>
            <DialogDescription>
              {editingRow
                ? `Update ${editingRow.name}.`
                : "Set the window and what changes on the till."}
            </DialogDescription>
          </DialogHeader>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                disabled={pending}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Starts</Label>
                <Input
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) => set("startsAt", e.target.value)}
                  disabled={pending}
                />
              </div>
              <div className="space-y-2">
                <Label>Ends</Label>
                <Input
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(e) => set("endsAt", e.target.value)}
                  disabled={pending}
                />
              </div>
            </div>

            {/*
              A SELECT, never free text: these are activity-aliases compiled into
              the APK. A value outside this list silently does nothing on every
              device. Source of truth is AppIconName in the app's
              src/lib/api/types/appCampaign.ts.
            */}
            <div className="space-y-2">
              <Label>App icon</Label>
              <Select
                value={form.appIcon || NO_ICON}
                onValueChange={(v) => set("appIcon", v === NO_ICON ? "" : v)}
                disabled={pending}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_ICON}>No icon change</SelectItem>
                  {APP_ICON_OPTIONS.map((icon) => (
                    <SelectItem key={icon} value={icon}>
                      {icon}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Message (max 280)</Label>
              <Textarea
                maxLength={280}
                value={form.message}
                onChange={(e) => set("message", e.target.value)}
                disabled={pending}
              />
            </div>

            <div className="space-y-2">
              <Label>Message icon (Material Design Icons glyph name)</Label>
              <Input
                value={form.messageIcon}
                onChange={(e) => set("messageIcon", e.target.value)}
                placeholder="party-popper"
                disabled={pending}
              />
            </div>

            <div className="grid grid-cols-3 items-end gap-3">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Input
                  type="number"
                  value={form.priority}
                  onChange={(e) => set("priority", Number(e.target.value))}
                  disabled={pending}
                />
              </div>
              <div className="space-y-2">
                <Label>Min version code</Label>
                <Input
                  type="number"
                  value={form.minAppVersionCode}
                  onChange={(e) => set("minAppVersionCode", e.target.value)}
                  disabled={pending}
                />
              </div>
              <div className="flex items-center gap-2 pb-2">
                <Switch
                  checked={form.enabled}
                  onCheckedChange={(c) => set("enabled", c)}
                  disabled={pending}
                />
                <Label>Enabled</Label>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setFormOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="button" onClick={submit} disabled={pending}>
              {pending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </span>
              ) : editingRow ? (
                "Save changes"
              ) : (
                "Create campaign"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* delete confirm */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (deletePending) return;
          if (!open) {
            setDeleteTarget(null);
            setDeleteError(null);
          }
        }}
      >
        <AlertDialogContent tone="danger">
          <AlertDialogIcon>
            <Trash2 className="h-5 w-5" />
          </AlertDialogIcon>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              Tills stop showing &quot;{deleteTarget?.name}&quot; on their next
              check.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError ? (
            <p className="text-sm text-destructive">{deleteError}</p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deletePending}
            >
              {deletePending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting…
                </span>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
