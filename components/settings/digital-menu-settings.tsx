"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
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
  Palette,
  UtensilsCrossed,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { OnlineMenu, MenuSettings, MenuOrderingStatus } from "@/types/online-menu/type";
import {
  fetchOnlineMenus,
  createOnlineMenu,
  updateOnlineMenu,
  deleteOnlineMenu,
  generateQrCode,
  fetchMenuSettings,
  updateMenuSettings,
} from "@/lib/actions/online-menu-actions";
import { OnlineMenuSchema } from "@/types/online-menu/schema";
import { UUID } from "node:crypto";
import { z } from "zod";

const MAX_MENUS = 5;

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

    const result = await deleteOnlineMenu(menuToDelete.id);
    if (result.responseType === "success") {
      setMenus((prev) => prev.filter((m) => m.id !== menuToDelete.id));
      if (selectedMenu?.id === menuToDelete.id) {
        setSelectedMenu(null);
        setMenuSettings(null);
      }
      toast({ title: "Success", description: result.message });
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      });
    }
    setShowDeleteDialog(false);
    setMenuToDelete(null);
  };

  const handleCopySlug = (slug: string) => {
    navigator.clipboard.writeText(slug);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Digital Menu
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Create and manage your online ordering menus
          </p>
        </div>
        <div className="grid gap-4">
          {[1, 2].map((i) => (
            <Card key={i} className="rounded-xl border shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
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
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Digital Menu
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Create and manage your online ordering menus
          </p>
        </div>
        <Card className="w-full max-w-md mx-auto rounded-xl border shadow-sm">
          <CardContent className="p-6 text-center">
            <div className="text-red-500 mb-2">
              <svg
                className="w-8 h-8 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Error Loading Menus
            </h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <button
              onClick={() => loadMenus()}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Retry
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If a menu is selected, show its settings
  if (selectedMenu) {
    return (
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
    );
  }

  // Menu list view
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Digital Menu
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Create and manage your online ordering menus ({menus.length}/
            {MAX_MENUS})
          </p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          disabled={menus.length >= MAX_MENUS}
          size="sm"
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          New Menu
        </Button>
      </div>

      {menus.length === 0 ? (
        <Card className="rounded-xl border shadow-sm">
          <CardContent className="px-12 py-20 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <UtensilsCrossed className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No menus yet
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              Create your first digital menu to start accepting online orders
              from your customers.
            </p>
            <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Your First Menu
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {menus.map((menu) => (
            <Card
              key={menu.id}
              className="rounded-xl border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleSelectMenu(menu)}
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <UtensilsCrossed className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {menu.name}
                      </h3>
                      <Badge
                        variant={menu.status ? "default" : "secondary"}
                        className="text-xs flex-shrink-0"
                      >
                        {menu.status ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs text-muted-foreground bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded truncate max-w-[200px]">
                        {menu.slug}
                      </code>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopySlug(menu.slug);
                        }}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        {copiedSlug === menu.slug ? (
                          <Check className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                    {menu.description && (
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        {menu.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {menu.qrCode && (
                      <div className="w-8 h-8 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <QrCode className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuToDelete(menu);
                        setShowDeleteDialog(true);
                      }}
                      className="text-muted-foreground hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {menus.length >= MAX_MENUS && (
        <p className="text-sm text-muted-foreground text-center">
          You have reached the maximum of {MAX_MENUS} menus per location.
        </p>
      )}

      {/* Create Menu Dialog */}
      <CreateMenuDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreated={handleMenuCreated}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Menu</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{menuToDelete?.name}&quot;?
              This will also delete all associated settings and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
        toast({ title: "Success", description: result.message });
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
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Menu Name <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="e.g. Lunch Menu, Dinner Specials"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={255}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Input
              placeholder="Optional description for your menu"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || isPending}
          >
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Menu
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
        toast({ title: "Success", description: result.message });
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
        toast({ title: "Success", description: result.message });
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
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="flex-shrink-0">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 truncate">
            {menu.name}
          </h2>
          <p className="text-muted-foreground text-sm">
            Manage menu details and configuration
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(menu)}
          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 flex-shrink-0"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
      </div>

      {/* Menu Details Card */}
      <Card className="rounded-xl border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <UtensilsCrossed className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Menu Details</h3>
              <p className="text-xs text-muted-foreground">
                Name, description, and QR code
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left: Name, Description, Slug */}
            <div className="flex-1 space-y-4">
              {/* Name & Description */}
              {isEditingName ? (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Menu Name</label>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      maxLength={255}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Description</label>
                    <Input
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      maxLength={500}
                      placeholder="Optional description"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleUpdateMenu}
                      disabled={!editName.trim() || isPending}
                    >
                      {isPending && (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      )}
                      Save
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
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{menu.name}</p>
                    {menu.description && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {menu.description}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingName(true)}
                    className="gap-1"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                </div>
              )}

            </div>

            {/* Right: QR Code */}
            <div className="flex flex-col items-center justify-center md:border-l md:pl-6">
              {menu.qrCode ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-full aspect-square rounded-xl bg-white p-2 flex items-center justify-center">
                    <img
                      src={menu.qrCode}
                      alt={`QR code for ${menu.name}`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex gap-2 w-full">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadQr}
                      className="gap-2 flex-1"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyUrl}
                      className="gap-2 flex-1"
                    >
                      {copiedUrl ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      {copiedUrl ? "Copied" : "Copy URL"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="w-full aspect-square rounded-xl border border-dashed bg-gray-50 dark:bg-gray-800/50 flex flex-col items-center justify-center gap-3">
                  <QrCode className="h-12 w-12 text-muted-foreground/40" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateQr}
                    disabled={isQrPending}
                    className="gap-2"
                  >
                    {isQrPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <QrCode className="h-4 w-4" />
                    )}
                    Generate QR Code
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Menu Configuration */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="rounded-xl border shadow-sm">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
                  </div>
                </div>
                {[1, 2, 3].map((j) => (
                  <div
                    key={j}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-36 animate-pulse" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
                    </div>
                    <div className="h-6 w-11 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
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

interface SettingsSection {
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
}

const SETTINGS_SECTIONS: SettingsSection[] = [
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
        placeholder: "e.g. We'll be back shortly",
      },
      {
        key: "closedMessage",
        label: "Closed Message",
        helperText: "Message shown when ordering is closed",
        type: "text",
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
        min: 0,
        step: 100,
        placeholder: "No minimum",
      },
      {
        key: "maximumOrderAmount",
        label: "Maximum Order Amount",
        helperText: "Maximum order value allowed",
        type: "number",
        min: 0,
        step: 100,
        placeholder: "No maximum",
      },
      {
        key: "maxItemsPerOrder",
        label: "Max Items Per Order",
        helperText: "Maximum number of items in a single order",
        type: "number",
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
        min: 0,
        step: 100,
        placeholder: "Free delivery",
      },
      {
        key: "deliveryRadiusKm",
        label: "Delivery Radius (km)",
        helperText: "Maximum delivery distance in kilometers",
        type: "number",
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
        label: "Default Prep Time (min)",
        helperText: "Default preparation time in minutes",
        type: "number",
        min: 1,
        placeholder: "15",
      },
      {
        key: "maxPrepTimeMinutes",
        label: "Max Prep Time (min)",
        helperText: "Maximum preparation time in minutes",
        type: "number",
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
        min: 1,
        placeholder: "7",
      },
      {
        key: "maxOrdersPerTimeSlot",
        label: "Max Orders Per Time Slot",
        helperText: "Limit orders per time slot to manage kitchen load",
        type: "number",
        min: 1,
        placeholder: "No limit",
      },
      {
        key: "timeSlotMinutes",
        label: "Time Slot Duration (min)",
        helperText: "Duration of each scheduling time slot",
        type: "number",
        min: 5,
        step: 5,
        placeholder: "15",
      },
    ],
  },
  {
    id: "branding",
    title: "Branding & SEO",
    description: "Public-facing branding and search engine settings",
    icon: Palette,
    fields: [
      {
        key: "themeColor",
        label: "Theme Color",
        helperText: "Primary color for your menu (hex code)",
        type: "text",
        placeholder: "#EB7F44",
      },
      {
        key: "metaTitle",
        label: "SEO Title",
        helperText: "Title shown in search engine results",
        type: "text",
        placeholder: "Your Business - Order Online",
      },
      {
        key: "metaDescription",
        label: "SEO Description",
        helperText: "Description shown in search engine results",
        type: "text",
        placeholder: "Order online from...",
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
        min: 1,
        placeholder: "60",
      },
      {
        key: "maxOrdersPerCustomerPerHour",
        label: "Max Orders Per Customer Per Hour",
        helperText: "Limit orders a single customer can place per hour",
        type: "number",
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
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFieldChange = (key: keyof MenuSettings, value: unknown) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveSection = async (section: SettingsSection) => {
    setSavingSection(section.id);

    // Build partial update with only fields from this section
    const partial: Record<string, unknown> = {};
    for (const field of section.fields) {
      partial[field.key] = localSettings[field.key];
    }

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
    setSavingSection(null);
  };

  const hasChanges = (section: SettingsSection) => {
    return section.fields.some(
      (field) => localSettings[field.key] !== settings[field.key],
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Settings2 className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Menu Configuration
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {SETTINGS_SECTIONS.map((section) => {
          const Icon = section.icon;
          const sectionChanged = hasChanges(section);
          const isSaving = savingSection === section.id;

          return (
            <Card key={section.id} className="rounded-xl border shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{section.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        {section.description}
                      </p>
                    </div>
                  </div>
                  {sectionChanged && (
                    <Button
                      size="sm"
                      onClick={() => handleSaveSection(section)}
                      disabled={isSaving}
                    >
                      {isSaving && (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      )}
                      Save
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {section.fields.map((field) => (
                  <SettingsFieldRow
                    key={field.key}
                    field={field}
                    value={localSettings[field.key]}
                    onChange={(val) => handleFieldChange(field.key, val)}
                  />
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
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
  if (field.type === "switch") {
    return (
      <div className="flex items-center justify-between rounded-lg border px-4 py-3">
        <div>
          <p className="text-sm font-medium">{field.label}</p>
          {field.helperText && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {field.helperText}
            </p>
          )}
        </div>
        <Switch
          checked={value as boolean}
          onCheckedChange={(checked) => onChange(checked)}
        />
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <div className="flex items-center justify-between rounded-lg border px-4 py-3">
        <div>
          <p className="text-sm font-medium">{field.label}</p>
          {field.helperText && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {field.helperText}
            </p>
          )}
        </div>
        <select
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          className="text-sm border rounded-md px-3 py-1.5 bg-white dark:bg-gray-900 dark:border-gray-700"
        >
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === "number") {
    return (
      <div className="flex items-center justify-between rounded-lg border px-4 py-3">
        <div>
          <p className="text-sm font-medium">{field.label}</p>
          {field.helperText && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {field.helperText}
            </p>
          )}
        </div>
        <Input
          type="number"
          value={value != null ? String(value) : ""}
          onChange={(e) => {
            const val = e.target.value;
            onChange(val === "" ? null : Number(val));
          }}
          placeholder={field.placeholder}
          min={field.min}
          max={field.max}
          step={field.step}
          className="w-32 text-right"
        />
      </div>
    );
  }

  // text
  return (
    <div className="flex items-center justify-between rounded-lg border px-4 py-3">
      <div className="flex-1 mr-4">
        <p className="text-sm font-medium">{field.label}</p>
        {field.helperText && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {field.helperText}
          </p>
        )}
      </div>
      <Input
        type="text"
        value={(value as string) || ""}
        onChange={(e) => onChange(e.target.value || null)}
        placeholder={field.placeholder}
        className="w-48"
      />
    </div>
  );
}

export default DigitalMenuSettings;
