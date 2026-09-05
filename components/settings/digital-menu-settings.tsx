"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  ControlInput,
  ControlTextarea,
  FieldHint,
  SegmentedRadio,
  StandaloneField as Field,
  ToggleRow,
  standaloneLabelClass,
} from "@/components/ui/field";
import {
  Plus,
  QrCode,
  Pencil,
  Trash2,
  Copy,
  Check,
  Download,
  Settings2,
  Loader2,
  ChevronLeft,
  Globe,
  ShoppingBag,
  Users,
  CreditCard,
  Truck,
  Clock,
  Shield,
  UtensilsCrossed,
  AlertTriangle,
  Banknote,
  CalendarDays,
  Gauge,
  ListOrdered,
  MapPin,
  PauseCircle,
  RefreshCw,
  ShoppingBasket,
  Text,
  Timer,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { OnlineMenu, MenuSettings } from "@/types/online-menu/type";
import {
  fetchOnlineMenus,
  createOnlineMenu,
  updateOnlineMenu,
  deleteOnlineMenu,
  generateQrCode,
  fetchMenuSettings,
  updateMenuSettings,
} from "@/lib/actions/online-menu-actions";
import { SettingsSection } from "./shared/settings-section";
import { SettingsSaveBar } from "./shared/settings-save-bar";
import { PanelHeader } from "./shared/panel-header";
import { UUID } from "node:crypto";
import { z } from "zod";

const MAX_MENUS = 5;

/** Prefix-icon size used by every control on this screen. */
const ICON = "h-3.5 w-3.5";

const DigitalMenuSettings = () => {
  const [menus, setMenus] = useState<OnlineMenu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMenu, setSelectedMenu] = useState<OnlineMenu | null>(null);
  const [menuSettings, setMenuSettings] = useState<MenuSettings | null>(null);
  const [isSettingsLoading, setIsSettingsLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [menuToDelete, setMenuToDelete] = useState<OnlineMenu | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const { toast } = useToast();

  const loadMenus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchOnlineMenus();
      setMenus(data);
    } catch (err) {
      console.error("Failed to load menus:", err);
      setError(err instanceof Error ? err.message : "Failed to load menus");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMenus();
  }, []);

  const handleSelectMenu = async (menu: OnlineMenu) => {
    setSelectedMenu(menu);
    setIsSettingsLoading(true);
    try {
      const settings = await fetchMenuSettings(menu.id);
      setMenuSettings(settings);
    } catch (err) {
      console.error("Failed to load menu settings:", err);
      toast({
        title: "Error",
        description: "Failed to load menu settings",
        variant: "destructive",
      });
    } finally {
      setIsSettingsLoading(false);
    }
  };

  const handleBackToList = () => {
    setSelectedMenu(null);
    setMenuSettings(null);
  };

  const handleMenuCreated = (menu: OnlineMenu) => {
    setMenus((prev) => [...prev, menu]);
    setShowCreateDialog(false);
  };

  const handleMenuUpdated = (updatedMenu: OnlineMenu) => {
    setMenus((prev) =>
      prev.map((m) => (m.id === updatedMenu.id ? updatedMenu : m)),
    );
    setSelectedMenu(updatedMenu);
  };

  const handleDeleteConfirm = async () => {
    if (!menuToDelete) return;

    setIsDeleting(true);
    try {
      const result = await deleteOnlineMenu(menuToDelete.id);
      if (result.responseType === "success") {
        setMenus((prev) => prev.filter((m) => m.id !== menuToDelete.id));
        if (selectedMenu?.id === menuToDelete.id) {
          setSelectedMenu(null);
          setMenuSettings(null);
        }
        toast({ variant: "success", title: "Success", description: result.message });
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
      setShowDeleteDialog(false);
      setMenuToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopySlug = (slug: string) => {
    navigator.clipboard.writeText(slug);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  /* Delete Confirmation Dialog — mounted by both views, since the detail
     screen's Delete opens this same dialog and would otherwise be cut off by
     the `selectedMenu` early return below. */
  const deleteDialog = (
    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogContent tone="danger">
        <AlertDialogIcon>
          <Trash2 className="h-5 w-5" />
        </AlertDialogIcon>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete &quot;{menuToDelete?.name}&quot;?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This is irreversible. Deleting this menu permanently removes it along
            with all associated settings. All shared QR codes and URLs linked to
            this menu will stop working and will no longer be accessible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isDeleting}
            // The delete is async and closes the dialog itself once the server
            // answers — hold Radix's own close so "Deleting…" stays visible.
            onClick={(e) => {
              e.preventDefault();
              handleDeleteConfirm();
            }}
          >
            {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isDeleting ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PanelHeader
          title="Digital Menu"
          description="Create and manage your online ordering menus"
        />
        <div className="grid gap-4">
          {[1, 2].map((i) => (
            <Card key={i} className="rounded-xl border-line shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 animate-pulse rounded-lg bg-canvas" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 animate-pulse rounded bg-canvas" />
                    <div className="h-3 w-48 animate-pulse rounded bg-canvas" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PanelHeader
          title="Digital Menu"
          description="Create and manage your online ordering menus"
        />
        <Card className="mx-auto w-full max-w-md rounded-xl border-line shadow-sm">
          <CardContent className="p-6 text-center">
            <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full bg-neg-tint text-neg">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h3 className="mb-2 font-semibold text-ink">Error Loading Menus</h3>
            <p className="mb-4 text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={() => loadMenus()}>
              <RefreshCw className={ICON} />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If a menu is selected, show its settings
  if (selectedMenu) {
    return (
      <>
        <MenuSettingsView
          menu={selectedMenu}
          settings={menuSettings}
          isLoading={isSettingsLoading}
          onBack={handleBackToList}
          onMenuUpdated={handleMenuUpdated}
          onDelete={(menu) => {
            setMenuToDelete(menu);
            setShowDeleteDialog(true);
          }}
          onSettingsChanged={setMenuSettings}
        />
        {deleteDialog}
      </>
    );
  }

  // Menu list view
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PanelHeader
          title="Digital Menu"
          description={`Create and manage your online ordering menus (${menus.length}/${MAX_MENUS})`}
        />
        <Button
          onClick={() => setShowCreateDialog(true)}
          disabled={menus.length >= MAX_MENUS}
          size="sm"
        >
          <Plus className={ICON} />
          New Menu
        </Button>
      </div>

      {menus.length === 0 ? (
        <Card className="rounded-xl border-line shadow-sm">
          <CardContent className="px-6 py-16 text-center sm:px-12 sm:py-20">
            <div className="mb-4 flex justify-center">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10">
                <UtensilsCrossed className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-ink">No menus yet</h3>
            <p className="mx-auto mb-6 max-w-sm text-sm text-muted-foreground">
              Create your first digital menu to start accepting online orders
              from your customers.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className={ICON} />
              Create Your First Menu
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {menus.map((menu) => (
            <Card
              key={menu.id}
              className="cursor-pointer rounded-xl border-line shadow-sm transition-shadow hover:shadow-md"
              onClick={() => handleSelectMenu(menu)}
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10">
                    <UtensilsCrossed className="h-6 w-6 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold text-ink">
                        {menu.name}
                      </h3>
                      <Badge
                        variant={menu.status ? "default" : "secondary"}
                        className="shrink-0 text-xs"
                      >
                        {menu.status ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <code className="max-w-[200px] truncate rounded bg-canvas px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                        {menu.slug}
                      </code>
                      <Button
                        variant="ghost"
                        size="iconSm"
                        aria-label="Copy menu slug"
                        title="Copy menu slug"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopySlug(menu.slug);
                        }}
                        className="shrink-0 text-muted-foreground"
                      >
                        {copiedSlug === menu.slug ? (
                          <Check className="h-3.5 w-3.5 text-pos" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                    {menu.description && (
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {menu.description}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {menu.qrCode && (
                      <div className="grid h-8 w-8 place-items-center rounded border border-line bg-canvas">
                        <QrCode className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="iconSm"
                      aria-label={`Delete ${menu.name}`}
                      title={`Delete ${menu.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuToDelete(menu);
                        setShowDeleteDialog(true);
                      }}
                      className="text-muted-foreground hover:bg-neg-tint hover:text-neg"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {menus.length >= MAX_MENUS && (
        <p className="text-center text-sm text-muted-foreground">
          You have reached the maximum of {MAX_MENUS} menus per location.
        </p>
      )}

      {/* Create Menu Dialog */}
      <CreateMenuDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreated={handleMenuCreated}
      />

      {deleteDialog}
    </div>
  );
};

// ─── Create Menu Dialog ──────────────────────────────────────────────────────

function CreateMenuDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (menu: OnlineMenu) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleCreate = () => {
    startTransition(async () => {
      const result = await createOnlineMenu({
        name,
        description: description || undefined,
      });
      if (result.responseType === "success" && result.data) {
        toast({ variant: "success", title: "Success", description: result.message });
        onCreated(result.data);
        setName("");
        setDescription("");
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Menu</DialogTitle>
          <DialogDescription>
            Give your menu a name. A unique URL slug will be generated
            automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3.5 py-2">
          <Field label="Menu Name" required>
            {(id) => (
              <ControlInput
                id={id}
                prefix={<UtensilsCrossed className={ICON} />}
                placeholder="e.g. Lunch Menu, Dinner Specials"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={255}
              />
            )}
          </Field>
          <Field label="Description" optional>
            {(id) => (
              <ControlTextarea
                id={id}
                rows={3}
                placeholder="Optional description for your menu"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
              />
            )}
          </Field>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim() || isPending}>
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isPending ? "Creating…" : "Create Menu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Menu Settings View ──────────────────────────────────────────────────────

function MenuSettingsView({
  menu,
  settings,
  isLoading,
  onBack,
  onMenuUpdated,
  onDelete,
  onSettingsChanged,
}: {
  menu: OnlineMenu;
  settings: MenuSettings | null;
  isLoading: boolean;
  onBack: () => void;
  onMenuUpdated: (menu: OnlineMenu) => void;
  onDelete: (menu: OnlineMenu) => void;
  onSettingsChanged: (settings: MenuSettings) => void;
}) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(menu.name);
  const [editDescription, setEditDescription] = useState(
    menu.description || "",
  );
  const [isPending, startTransition] = useTransition();
  const [isQrPending, startQrTransition] = useTransition();
  const { toast } = useToast();

  const handleUpdateMenu = () => {
    startTransition(async () => {
      const result = await updateOnlineMenu(menu.id, {
        name: editName,
        description: editDescription || undefined,
        image: menu.image || undefined,
      });
      if (result.responseType === "success" && result.data) {
        toast({ variant: "success", title: "Success", description: result.message });
        onMenuUpdated(result.data);
        setIsEditingName(false);
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    });
  };

  const handleGenerateQr = () => {
    startQrTransition(async () => {
      const result = await generateQrCode(menu.id);
      if (result.responseType === "success" && result.data) {
        toast({ variant: "success", title: "Success", description: result.message });
        onMenuUpdated(result.data);
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    });
  };

  const handleDownloadQr = () => {
    if (!menu.qrCode) return;
    const link = document.createElement("a");
    link.href = menu.qrCode;
    link.download = `${menu.slug.replace("/", "-")}-qr.png`;
    link.click();
  };

  const [copiedUrl, setCopiedUrl] = useState(false);
  const handleCopyUrl = () => {
    const menuUrl = `${window.location.origin}/menu/${menu.slug}`;
    navigator.clipboard.writeText(menuUrl);
    setCopiedUrl(true);
    toast({ title: "Copied", description: "Menu URL copied to clipboard" });
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          aria-label="Back to menus"
          className="shrink-0"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <PanelHeader
            title={menu.name}
            description="Manage menu details and configuration"
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(menu)}
          className="shrink-0 text-neg hover:bg-neg-tint hover:text-neg"
        >
          <Trash2 className={ICON} />
          Delete
        </Button>
      </div>

      {/* Menu Details Card */}
      <SettingsSection
        icon={<UtensilsCrossed className="h-4 w-4" />}
        title="Menu details"
        description="Name, description, and QR code."
      >
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Left: Name, Description, Slug */}
          <div className="space-y-4 lg:col-span-2">
            {/* Name & Description */}
            {isEditingName ? (
              <div className="space-y-3.5">
                <Field label="Menu Name" required>
                  {(id) => (
                    <ControlInput
                      id={id}
                      prefix={<UtensilsCrossed className={ICON} />}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      maxLength={255}
                    />
                  )}
                </Field>
                <Field label="Description" optional>
                  {(id) => (
                    <ControlTextarea
                      id={id}
                      rows={3}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      maxLength={500}
                      placeholder="Optional description"
                    />
                  )}
                </Field>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={handleUpdateMenu}
                    disabled={!editName.trim() || isPending}
                  >
                    {isPending && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    )}
                    {isPending ? "Saving…" : "Save"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsEditingName(false);
                      setEditName(menu.name);
                      setEditDescription(menu.description || "");
                    }}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{menu.name}</p>
                  {menu.description && (
                    <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                      {menu.description}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingName(true)}
                  className="shrink-0"
                >
                  <Pencil className={ICON} />
                  Edit
                </Button>
              </div>
            )}

          </div>

          {/* Right: QR Code */}
          <div className="lg:col-span-1">
            <div className="flex flex-col items-center gap-2.5 rounded-lg border border-line bg-canvas p-4">
              {menu.qrCode ? (
                <>
                  {/* The plate stays white in both themes — a dark ground behind
                      a transparent QR stops it scanning. */}
                  <div className="flex h-36 w-36 items-center justify-center rounded-lg bg-white p-1">
                    {/* eslint-disable-next-line @next/next/no-img-element -- QR is a data/remote URL outside next/image remotePatterns */}
                    <img
                      src={menu.qrCode}
                      alt={`QR code for ${menu.name}`}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="flex w-full gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadQr}
                      className="flex-1"
                    >
                      <Download className={ICON} />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyUrl}
                      className="flex-1"
                    >
                      {copiedUrl ? (
                        <Check className="h-3.5 w-3.5 text-pos" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      {copiedUrl ? "Copied" : "URL"}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid h-36 w-36 place-items-center rounded-lg border border-dashed border-line bg-card">
                    <QrCode className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateQr}
                    disabled={isQrPending}
                    className="w-full"
                  >
                    {isQrPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <QrCode className="h-3.5 w-3.5" />
                    )}
                    {isQrPending ? "Generating…" : "Generate"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Menu Configuration */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="rounded-xl border-line shadow-sm">
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 animate-pulse rounded-lg bg-canvas" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 animate-pulse rounded bg-canvas" />
                    <div className="h-3 w-48 animate-pulse rounded bg-canvas" />
                  </div>
                </div>
                {[1, 2, 3].map((j) => (
                  <div
                    key={j}
                    className="flex items-center justify-between rounded-lg border border-line p-4"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-36 animate-pulse rounded bg-canvas" />
                      <div className="h-3 w-48 animate-pulse rounded bg-canvas" />
                    </div>
                    <div className="h-6 w-11 animate-pulse rounded-full bg-canvas" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : settings ? (
        <MenuConfigSections
          menuId={menu.id}
          settings={settings}
          onSettingsChanged={onSettingsChanged}
        />
      ) : null}
    </div>
  );
}

// ─── Menu Config Sections ────────────────────────────────────────────────────

interface SettingsSectionDef {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  fields: SettingsFieldDef[];
}

interface SettingsFieldDef {
  key: keyof MenuSettings;
  label: string;
  helperText?: string;
  type: "switch" | "number" | "text" | "select";
  options?: { label: string; value: string }[];
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  /** Prefix icon for the control box (text / number fields). */
  icon?: React.ElementType;
  /** Trailing unit shown in the control's divided suffix slot. */
  suffix?: string;
}

const SETTINGS_SECTIONS: SettingsSectionDef[] = [
  {
    id: "visibility",
    title: "Visibility & Status",
    description: "Control menu visibility and ordering state",
    icon: Globe,
    fields: [
      {
        key: "menuVisible",
        label: "Menu Visible",
        helperText: "Whether this menu is publicly visible",
        type: "switch",
      },
      {
        key: "orderingStatus",
        label: "Ordering Status",
        helperText: "Current ordering status for this menu",
        type: "select",
        options: [
          { label: "Active", value: "ACTIVE" },
          { label: "Paused", value: "PAUSED" },
          { label: "Closed", value: "CLOSED" },
        ],
      },
      {
        key: "pausedMessage",
        label: "Paused Message",
        helperText: "Message shown when ordering is paused",
        type: "text",
        icon: PauseCircle,
        placeholder: "e.g. We'll be back shortly",
      },
      {
        key: "closedMessage",
        label: "Closed Message",
        helperText: "Message shown when ordering is closed",
        type: "text",
        icon: XCircle,
        placeholder: "e.g. We're currently closed",
      },
    ],
  },
  {
    id: "order-types",
    title: "Order Types",
    description: "Choose which order types are available",
    icon: ShoppingBag,
    fields: [
      {
        key: "pickupEnabled",
        label: "Pickup",
        helperText: "Allow customers to order for pickup",
        type: "switch",
      },
      {
        key: "deliveryEnabled",
        label: "Delivery",
        helperText: "Allow customers to order for delivery",
        type: "switch",
      },
      {
        key: "dineInEnabled",
        label: "Dine In",
        helperText: "Allow customers to order for dine-in",
        type: "switch",
      },
    ],
  },
  {
    id: "qr-ordering",
    title: "QR & Table Ordering",
    description: "Configure QR code and table ordering behavior",
    icon: QrCode,
    fields: [
      {
        key: "qrOrderingEnabled",
        label: "QR Ordering",
        helperText: "Enable ordering via QR code scan",
        type: "switch",
      },
      {
        key: "tableOrderingEnabled",
        label: "Table Ordering",
        helperText: "Enable table-based ordering",
        type: "switch",
      },
      {
        key: "allowCustomersToJoinTableOrders",
        label: "Allow Customers to Join Table Orders",
        helperText: "Let customers join an existing table order",
        type: "switch",
      },
      {
        key: "qrIncludesTableCode",
        label: "QR Includes Table Code",
        helperText: "Include table identifier in QR code",
        type: "switch",
      },
    ],
  },
  {
    id: "customer-auth",
    title: "Customer Authentication",
    description: "Login and checkout options for customers",
    icon: Users,
    fields: [
      {
        key: "customerAccountsEnabled",
        label: "Customer Accounts",
        helperText: "Enable customer account creation",
        type: "switch",
      },
      {
        key: "allowGuestCheckout",
        label: "Guest Checkout",
        helperText: "Allow checkout without an account",
        type: "switch",
      },
      {
        key: "allowEmailLogin",
        label: "Email Login",
        helperText: "Allow customers to log in with email",
        type: "switch",
      },
      {
        key: "allowPhoneOtpLogin",
        label: "Phone OTP Login",
        helperText: "Allow customers to log in with phone OTP",
        type: "switch",
      },
      {
        key: "saveCustomerDetails",
        label: "Save Customer Details",
        helperText: "Remember customer information for future orders",
        type: "switch",
      },
      {
        key: "allowReorder",
        label: "Allow Reorder",
        helperText: "Let customers reorder previous orders",
        type: "switch",
      },
    ],
  },
  {
    id: "table-behavior",
    title: "Table Behavior",
    description: "Table session and order management",
    icon: UtensilsCrossed,
    fields: [
      {
        key: "autoCreateTableSession",
        label: "Auto Create Table Session",
        helperText: "Automatically create a session when a table is scanned",
        type: "switch",
      },
      {
        key: "allowMultipleOrdersPerTable",
        label: "Multiple Orders Per Table",
        helperText: "Allow multiple orders on one table session",
        type: "switch",
      },
      {
        key: "allowCustomersToViewCurrentTableOrder",
        label: "View Current Table Order",
        helperText: "Let customers see the current order at their table",
        type: "switch",
      },
    ],
  },
  {
    id: "payments",
    title: "Payments",
    description: "Payment methods and pay-at-table features",
    icon: CreditCard,
    fields: [
      {
        key: "allowOnlinePayment",
        label: "Online Payment",
        helperText: "Accept online payments",
        type: "switch",
      },
      {
        key: "allowCashOnPickup",
        label: "Cash on Pickup",
        helperText: "Accept cash payment on pickup",
        type: "switch",
      },
      {
        key: "allowCashOnDelivery",
        label: "Cash on Delivery",
        helperText: "Accept cash payment on delivery",
        type: "switch",
      },
      {
        key: "payAtTableEnabled",
        label: "Pay at Table",
        helperText: "Enable payment at the table",
        type: "switch",
      },
      {
        key: "splitBillEnabled",
        label: "Split Bill",
        helperText: "Allow customers to split the bill",
        type: "switch",
      },
    ],
  },
  {
    id: "order-limits",
    title: "Order Limits",
    description: "Set minimum/maximum order values and quantities",
    icon: Shield,
    fields: [
      {
        key: "minimumOrderAmount",
        label: "Minimum Order Amount",
        helperText: "Minimum order value required",
        type: "number",
        icon: Banknote,
        min: 0,
        step: 100,
        placeholder: "No minimum",
      },
      {
        key: "maximumOrderAmount",
        label: "Maximum Order Amount",
        helperText: "Maximum order value allowed",
        type: "number",
        icon: Banknote,
        min: 0,
        step: 100,
        placeholder: "No maximum",
      },
      {
        key: "maxItemsPerOrder",
        label: "Max Items Per Order",
        helperText: "Maximum number of items in a single order",
        type: "number",
        icon: ShoppingBasket,
        suffix: "ITEMS",
        min: 1,
        placeholder: "No limit",
      },
    ],
  },
  {
    id: "delivery",
    title: "Delivery",
    description: "Delivery pricing and radius",
    icon: Truck,
    fields: [
      {
        key: "deliveryFee",
        label: "Delivery Fee",
        helperText: "Fee charged for delivery orders",
        type: "number",
        icon: Truck,
        min: 0,
        step: 100,
        placeholder: "Free delivery",
      },
      {
        key: "deliveryRadiusKm",
        label: "Delivery Radius",
        helperText: "Maximum delivery distance in kilometers",
        type: "number",
        icon: MapPin,
        suffix: "KM",
        min: 1,
        placeholder: "No limit",
      },
    ],
  },
  {
    id: "prep-scheduling",
    title: "Prep Times & Scheduling",
    description: "Kitchen timing and scheduled orders",
    icon: Clock,
    fields: [
      {
        key: "defaultPrepTimeMinutes",
        label: "Default Prep Time",
        helperText: "Default preparation time in minutes",
        type: "number",
        icon: Timer,
        suffix: "MIN",
        min: 1,
        placeholder: "15",
      },
      {
        key: "maxPrepTimeMinutes",
        label: "Max Prep Time",
        helperText: "Maximum preparation time in minutes",
        type: "number",
        icon: Timer,
        suffix: "MIN",
        min: 1,
        placeholder: "60",
      },
      {
        key: "allowScheduledOrders",
        label: "Allow Scheduled Orders",
        helperText: "Let customers schedule orders in advance",
        type: "switch",
      },
      {
        key: "maxScheduleDaysAhead",
        label: "Max Schedule Days Ahead",
        helperText: "How many days in advance orders can be scheduled",
        type: "number",
        icon: CalendarDays,
        suffix: "DAYS",
        min: 1,
        placeholder: "7",
      },
      {
        key: "maxOrdersPerTimeSlot",
        label: "Max Orders Per Time Slot",
        helperText: "Limit orders per time slot to manage kitchen load",
        type: "number",
        icon: ListOrdered,
        min: 1,
        placeholder: "No limit",
      },
      {
        key: "timeSlotMinutes",
        label: "Time Slot Duration",
        helperText: "Duration of each scheduling time slot",
        type: "number",
        icon: Clock,
        suffix: "MIN",
        min: 5,
        step: 5,
        placeholder: "15",
      },
    ],
  },
  {
    id: "security",
    title: "Security & Throttling",
    description: "Rate limiting and abuse prevention",
    icon: Shield,
    fields: [
      {
        key: "rateLimitPerMinute",
        label: "Rate Limit Per Minute",
        helperText: "Maximum API requests per minute",
        type: "number",
        icon: Gauge,
        suffix: "/MIN",
        min: 1,
        placeholder: "60",
      },
      {
        key: "maxOrdersPerCustomerPerHour",
        label: "Max Orders Per Customer Per Hour",
        helperText: "Limit orders a single customer can place per hour",
        type: "number",
        icon: Users,
        suffix: "/HR",
        min: 1,
        placeholder: "No limit",
      },
    ],
  },
];

function MenuConfigSections({
  menuId,
  settings,
  onSettingsChanged,
}: {
  menuId: UUID;
  settings: MenuSettings;
  onSettingsChanged: (settings: MenuSettings) => void;
}) {
  const [localSettings, setLocalSettings] = useState<MenuSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleFieldChange = (key: keyof MenuSettings, value: unknown) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  // Every section edits one MenuSettings record through one endpoint, so the
  // screen saves once from the page bar rather than per card. Only the fields
  // that actually changed go up, which keeps the partial update honest.
  const dirtyKeys = SETTINGS_SECTIONS.flatMap((section) =>
    section.fields
      .map((field) => field.key)
      .filter((key) => localSettings[key] !== settings[key]),
  );

  const handleSave = async () => {
    if (dirtyKeys.length === 0) return;
    setIsSaving(true);

    const partial: Record<string, unknown> = {};
    for (const key of dirtyKeys) partial[key] = localSettings[key];

    const result = await updateMenuSettings(
      menuId,
      partial as z.infer<typeof import("@/types/online-menu/schema").MenuSettingsSchema>,
    );

    if (result.responseType === "success") {
      toast({ title: "Saved", description: result.message });
      onSettingsChanged(localSettings);
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      });
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Settings2 className="h-4 w-4 text-primary" />
        <h3 className="text-base font-semibold tracking-[-0.01em] text-ink">
          Menu Configuration
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {SETTINGS_SECTIONS.map((section) => {
          const Icon = section.icon;
          const toggles = section.fields.filter((f) => f.type === "switch");
          const inputs = section.fields.filter((f) => f.type !== "switch");

          return (
            <SettingsSection
              key={section.id}
              icon={<Icon className="h-4 w-4" />}
              title={section.title}
              description={section.description}
            >
              {toggles.length > 0 && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {toggles.map((field) => (
                    <SettingsFieldRow
                      key={field.key}
                      field={field}
                      value={localSettings[field.key]}
                      onChange={(val) => handleFieldChange(field.key, val)}
                    />
                  ))}
                </div>
              )}
              {inputs.length > 0 && (
                <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2">
                  {inputs.map((field) => (
                    <SettingsFieldRow
                      key={field.key}
                      field={field}
                      value={localSettings[field.key]}
                      onChange={(val) => handleFieldChange(field.key, val)}
                    />
                  ))}
                </div>
              )}
            </SettingsSection>
          );
        })}
      </div>

      <SettingsSaveBar
        dirtyCount={dirtyKeys.length}
        isPending={isSaving}
        onSave={handleSave}
        onDiscard={() => setLocalSettings(settings)}
      />
    </div>
  );
}

// ─── Single Settings Field Row ───────────────────────────────────────────────

function SettingsFieldRow({
  field,
  value,
  onChange,
}: {
  field: SettingsFieldDef;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const Icon = field.icon ?? (field.type === "number" ? Gauge : Text);

  if (field.type === "switch") {
    return (
      <ToggleRow
        label={field.label}
        hint={field.helperText}
        checked={!!value}
        onChange={(checked) => onChange(checked)}
      />
    );
  }

  if (field.type === "select") {
    return (
      <div className="min-w-0 space-y-[7px] sm:col-span-2">
        <span className={standaloneLabelClass}>{field.label}</span>
        <SegmentedRadio
          value={(value as string) || ""}
          onChange={(next) => onChange(next)}
          options={field.options ?? []}
        />
        {field.helperText && <FieldHint>{field.helperText}</FieldHint>}
      </div>
    );
  }

  if (field.type === "number") {
    return (
      <Field label={field.label} hint={field.helperText}>
        {(id) => (
          <ControlInput
            id={id}
            type="number"
            inputMode="decimal"
            mono
            prefix={<Icon className={ICON} />}
            suffix={field.suffix}
            value={value != null ? String(value) : ""}
            onChange={(e) => {
              const val = e.target.value;
              onChange(val === "" ? null : Number(val));
            }}
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
            step={field.step}
          />
        )}
      </Field>
    );
  }

  // text
  return (
    <Field label={field.label} hint={field.helperText} className="sm:col-span-2">
      {(id) => (
        <ControlInput
          id={id}
          type="text"
          prefix={<Icon className={ICON} />}
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder={field.placeholder}
        />
      )}
    </Field>
  );
}

export default DigitalMenuSettings;
