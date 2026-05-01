"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Trash2, Tag as TagIcon } from "lucide-react";
import { NumericFormat } from "react-number-format";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useToast } from "@/hooks/use-toast";
import type { AddonGroup } from "@/types/product/type";

import {
  createAddonGroup,
  updateAddonGroup,
  createAddonGroupItem,
  updateAddonGroupItem,
  deleteAddonGroupItem,
} from "@/lib/actions/addon-actions";

import styles from "./styles/form-shell.module.css";

export interface ProductVariantOption {
  id: string;
  label: string;
}

interface Props {
  group: AddonGroup | null;
  productVariants: ProductVariantOption[];
}

export function AddonGroupForm({ group, productVariants }: Props) {
  const router = useRouter();
  const { toast } = useToast();

  const isEditing = !!group;
  const isArchived = group?.archivedAt != null;

  const [name, setName] = useState(group?.name ?? "");
  const [minSel, setMinSel] = useState(group?.minSelections ?? 0);
  const [maxSel, setMaxSel] = useState(group?.maxSelections ?? 10);
  const [active, setActive] = useState(group?.active ?? true);
  const [busy, setBusy] = useState(false);

  const saveGroup = async () => {
    if (!name.trim()) {
      toast({
        variant: "destructive",
        title: "Name required",
        description: "Give the group a name before saving.",
      });
      return;
    }
    setBusy(true);
    try {
      const payload = {
        name: name.trim(),
        minSelections: minSel,
        maxSelections: maxSel,
        sortOrder: group?.sortOrder ?? 0,
        active,
        items: [],
      };
      const result = isEditing
        ? await updateAddonGroup(group!.id, payload)
        : await createAddonGroup(payload);

      if ("responseType" in result && result.responseType === "error") {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message,
        });
        return;
      }

      toast({
        title: isEditing ? "Saved" : "Created",
        description: `${(result as AddonGroup).name} ${isEditing ? "updated" : "created"}.`,
      });

      if (!isEditing) {
        router.push(`/addon-groups/${(result as AddonGroup).id}`);
      } else {
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.formRoot}>
      <div className={styles.formStack}>
        <section className={styles.formCard}>
          <header className={styles.formCardHead}>
            <div className={styles.icoBox}>
              <TagIcon className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3>Group details</h3>
              <p className={styles.formCardHeadDesc}>
                Optional add-ons offered alongside products at checkout.
              </p>
            </div>
            {isArchived && (
              <Badge variant="soft" className="shrink-0">
                Archived
              </Badge>
            )}
          </header>

          <div className={styles.formBody}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-xs text-muted-foreground">Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sides, Extras"
                  className="mt-1"
                  disabled={busy || isArchived}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Min</label>
                <Input
                  type="number"
                  min={0}
                  value={minSel}
                  onChange={(e) => setMinSel(Number(e.target.value))}
                  className="mt-1"
                  disabled={busy || isArchived}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Max</label>
                <Input
                  type="number"
                  min={1}
                  value={maxSel}
                  onChange={(e) => setMaxSel(Number(e.target.value))}
                  className="mt-1"
                  disabled={busy || isArchived}
                />
              </div>
              <div className="flex items-center gap-2 md:col-span-2">
                <Switch
                  checked={active}
                  onCheckedChange={setActive}
                  disabled={busy || isArchived}
                />
                <span className="text-sm">Active</span>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push("/addon-groups")}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={saveGroup}
                disabled={busy || !name.trim() || isArchived}
              >
                <Save className="mr-1.5 h-4 w-4" />
                {isEditing ? "Save" : "Create group"}
              </Button>
            </div>
          </div>
        </section>

        {isEditing && (
          <section className={styles.formCard}>
            <header className={styles.formCardHead}>
              <div className={styles.icoBox}>
                <Plus className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3>Items</h3>
                <p className={styles.formCardHeadDesc}>
                  Product variants offered as add-ons in this group.
                </p>
              </div>
            </header>

            <div className={styles.formBody}>
              <ItemsList
                groupId={group!.id}
                items={group!.items ?? []}
                productVariants={productVariants}
                disabled={isArchived}
              />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function ItemsList({
  groupId,
  items,
  productVariants,
  disabled,
}: {
  groupId: string;
  items: AddonGroup["items"];
  productVariants: ProductVariantOption[];
  disabled: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    productVariantId: "",
    priceOverride: undefined as number | undefined,
  });

  const refresh = () => router.refresh();

  const add = async () => {
    if (!draft.productVariantId) return;
    setBusy(true);
    try {
      const result = await createAddonGroupItem(groupId, {
        productVariantId: draft.productVariantId,
        priceOverride: draft.priceOverride,
        sortOrder: items.length,
        active: true,
      });
      if ("responseType" in result && result.responseType === "error") {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message,
        });
      } else {
        toast({ title: "Item added" });
        setDraft({ productVariantId: "", priceOverride: undefined });
        setAdding(false);
        refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  const remove = async (itemId: string, label: string) => {
    if (!confirm(`Remove "${label}" from this group?`)) return;
    setBusy(true);
    try {
      await deleteAddonGroupItem(groupId, itemId);
      toast({ title: "Item removed" });
      refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Items ({items.length})
        </div>
        {!adding && !disabled && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setAdding(true)}
            disabled={busy}
            className="h-7 text-xs"
          >
            <Plus className="mr-1 h-3 w-3" /> Add item
          </Button>
        )}
      </div>

      {items.length === 0 && !adding && (
        <p className="py-2 text-center text-xs text-muted-foreground">
          No items yet.
        </p>
      )}

      {items.map((it) =>
        editingId === it.id ? (
          <ItemEditRow
            key={it.id}
            groupId={groupId}
            item={it}
            productVariants={productVariants}
            onCancel={() => setEditingId(null)}
            onSaved={() => {
              setEditingId(null);
              refresh();
            }}
          />
        ) : (
          <div
            key={it.id}
            className="flex items-center justify-between rounded-md border border-line bg-card p-2 px-3 text-sm"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 font-medium">
                <span className="truncate">{it.productVariantDisplayName}</span>
                {!it.active && <Badge variant="soft">inactive</Badge>}
              </div>
              <div className="text-xs text-muted-foreground">
                {it.priceOverride != null
                  ? `Override: ${it.priceOverride}`
                  : `Price: ${it.price}`}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingId(it.id)}
                  disabled={busy}
                >
                  Edit
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(it.id, it.productVariantDisplayName)}
                disabled={busy || disabled}
                className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ),
      )}

      {adding && (
        <ItemDraftRow
          productVariants={productVariants}
          draft={draft}
          setDraft={setDraft}
          busy={busy}
          onCancel={() => {
            setDraft({ productVariantId: "", priceOverride: undefined });
            setAdding(false);
          }}
          onSubmit={add}
          submitLabel="Add item"
        />
      )}
    </div>
  );
}

function ItemEditRow({
  groupId,
  item,
  productVariants,
  onCancel,
  onSaved,
}: {
  groupId: string;
  item: AddonGroup["items"][number];
  productVariants: ProductVariantOption[];
  onCancel: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState({
    productVariantId: item.productVariantId,
    priceOverride: item.priceOverride ?? (undefined as number | undefined),
  });

  useEffect(() => {
    setDraft({
      productVariantId: item.productVariantId,
      priceOverride: item.priceOverride ?? undefined,
    });
  }, [item]);

  const save = async () => {
    setBusy(true);
    try {
      const result = await updateAddonGroupItem(groupId, item.id, {
        productVariantId: draft.productVariantId,
        priceOverride: draft.priceOverride,
        sortOrder: item.sortOrder,
        active: item.active,
      });
      if ("responseType" in result && result.responseType === "error") {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message,
        });
      } else {
        toast({ title: "Item saved" });
        onSaved();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <ItemDraftRow
      productVariants={productVariants}
      draft={draft}
      setDraft={setDraft}
      busy={busy}
      onCancel={onCancel}
      onSubmit={save}
      submitLabel="Save"
    />
  );
}

interface ItemDraft {
  productVariantId: string;
  priceOverride: number | undefined;
}

function ItemDraftRow({
  productVariants,
  draft,
  setDraft,
  busy,
  onCancel,
  onSubmit,
  submitLabel,
}: {
  productVariants: ProductVariantOption[];
  draft: ItemDraft;
  setDraft: React.Dispatch<React.SetStateAction<ItemDraft>>;
  busy: boolean;
  onCancel: () => void;
  onSubmit: () => Promise<void>;
  submitLabel: string;
}) {
  return (
    <div className="space-y-3 rounded-md border border-line bg-card p-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="text-xs text-muted-foreground">
            Product variant
          </label>
          <Select
            value={draft.productVariantId}
            onValueChange={(v) =>
              setDraft({ ...draft, productVariantId: v })
            }
            disabled={busy}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Pick a product variant" />
            </SelectTrigger>
            <SelectContent>
              {productVariants.map((pv) => (
                <SelectItem key={pv.id} value={pv.id}>
                  {pv.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">
            Price override (optional)
          </label>
          <NumericFormat
            customInput={Input}
            value={draft.priceOverride ?? ""}
            onValueChange={(v) =>
              setDraft({ ...draft, priceOverride: v.floatValue })
            }
            decimalScale={4}
            allowNegative={false}
            thousandSeparator=","
            className="mt-1"
            disabled={busy}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={busy}
        >
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={onSubmit}
          disabled={busy || !draft.productVariantId}
        >
          <Save className="mr-1 h-3.5 w-3.5" />
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
