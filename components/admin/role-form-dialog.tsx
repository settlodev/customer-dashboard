"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";
import { FormError } from "@/components/widgets/form-error";
import { useToast } from "@/hooks/use-toast";

import {
  createInternalRole,
  updateInternalRole,
} from "@/lib/actions/admin/internal-roles";
import { InternalRoleResponse } from "@/types/admin/internal-role";

interface RoleFormDialogProps {
  /** Null = create; otherwise edit the given role. */
  role: InternalRoleResponse | null;
  permissionCatalog: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

const ASSIGNABLE_OPTIONS = [
  { value: "NONE", label: "Not assignable" },
  { value: "SALES", label: "Sales person" },
  { value: "SUPPORT", label: "Support staff" },
];

function permLabel(permission: string): string {
  // internal:accounts:manage -> "accounts: manage"
  return permission.replace(/^internal:/, "").replace(/:/g, ": ");
}

export function RoleFormDialog({
  role,
  permissionCatalog,
  open,
  onOpenChange,
  onSaved,
}: RoleFormDialogProps) {
  const { toast } = useToast();
  const isEdit = !!role;

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [assignableAs, setAssignableAs] = useState("NONE");
  const [active, setActive] = useState(true);
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [isSaving, startSave] = useTransition();

  useEffect(() => {
    if (!open) return;
    setError("");
    setCode(role?.code ?? "");
    setName(role?.name ?? "");
    setDescription(role?.description ?? "");
    setAssignableAs(role?.assignableAs ? role.assignableAs : "NONE");
    setActive(role?.active ?? true);
    setPermissions(new Set(role?.permissions ?? []));
  }, [open, role]);

  const togglePermission = (permission: string, checked: boolean) => {
    setPermissions((prev) => {
      const next = new Set(prev);
      if (checked) next.add(permission);
      else next.delete(permission);
      return next;
    });
  };

  const grouped = useMemo(() => {
    const groups = new Map<string, string[]>();
    for (const p of permissionCatalog) {
      const group = p.replace(/^internal:/, "").split(":")[0];
      const list = groups.get(group) ?? [];
      list.push(p);
      groups.set(group, list);
    }
    return Array.from(groups.entries());
  }, [permissionCatalog]);

  const handleSave = () => {
    setError("");
    const assignable = (assignableAs === "NONE" ? "" : assignableAs) as
      | ""
      | "SALES"
      | "SUPPORT";
    const perms = Array.from(permissions);

    startSave(async () => {
      const result = isEdit
        ? await updateInternalRole(role!.id, {
            name,
            description,
            assignableAs: assignable,
            permissions: perms,
            active,
          })
        : await createInternalRole({
            code,
            name,
            description,
            assignableAs: assignable,
            permissions: perms,
          });
      if (result.responseType === "error") {
        setError(result.message);
        return;
      }
      toast({ title: result.message });
      onSaved();
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit role" : "Create role"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? `Update ${role?.name}. The code is fixed once created.`
              : "Define a role, its account-assignment capability, and permissions."}
          </DialogDescription>
        </DialogHeader>

        {error && <FormError message={error} />}

        <div className="space-y-4">
          {!isEdit && (
            <div className="space-y-2">
              <Label className="text-xs">Code</Label>
              <Input
                placeholder="CALL_CENTER"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_"))
                }
                disabled={isSaving}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs">Name</Label>
            <Input
              placeholder="Call Center"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Description</Label>
            <Textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Assignable to accounts as</Label>
            <Select
              value={assignableAs}
              onValueChange={setAssignableAs}
              disabled={isSaving}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNABLE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-xs">Permissions</Label>
            <div className="space-y-3 rounded-lg border border-line p-3">
              {grouped.map(([group, perms]) => (
                <div key={group}>
                  <p className="mb-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {group}
                  </p>
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {perms.map((p) => (
                      <label
                        key={p}
                        className="flex items-center gap-2 text-[13px]"
                      >
                        <Checkbox
                          checked={permissions.has(p)}
                          onCheckedChange={(c) => togglePermission(p, c === true)}
                          disabled={isSaving}
                        />
                        <span>{permLabel(p)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {isEdit && (
            <label className="flex items-center gap-2 text-[13px]">
              <Checkbox
                checked={active}
                onCheckedChange={(c) => setActive(c === true)}
                disabled={isSaving}
              />
              <span>Active (can be assigned to staff)</span>
            </label>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </span>
            ) : isEdit ? (
              "Save changes"
            ) : (
              "Create role"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
