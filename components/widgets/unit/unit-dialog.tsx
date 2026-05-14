"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil, Plus, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { UNIT_TYPE_OPTIONS } from "@/types/catalogue/enums";
import {
  UnitOfMeasureSchema,
  type UnitOfMeasure,
  type UnitOfMeasurePayload,
} from "@/types/unit/type";
import { createUnit, updateUnit } from "@/lib/actions/unit-actions";
import { invalidateUnitsCache } from "@/lib/cache/reference-data";

interface Props {
  /** Pass an existing unit to open in edit mode. */
  unit?: UnitOfMeasure | null;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (next: boolean) => void;
}

export function UnitDialog({
  unit,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const onOpenChange = controlledOnOpenChange ?? setInternalOpen;
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<UnitOfMeasurePayload>({
    resolver: zodResolver(UnitOfMeasureSchema),
    values: {
      name: unit?.name ?? "",
      abbreviation: unit?.abbreviation ?? "",
      unitType: unit?.unitType ?? "PIECE",
    },
  });

  const submit = (values: UnitOfMeasurePayload) => {
    startTransition(async () => {
      const res = unit
        ? await updateUnit(unit.id, values)
        : await createUnit(values);
      if (res.responseType === "success") {
        invalidateUnitsCache();
        toast({ variant: "success", title: "Saved", description: res.message });
        onOpenChange(false);
        router.refresh();
      } else {
        toast({ variant: "destructive", title: "Failed", description: res.message });
      }
    });
  };

  const isEditing = !!unit;

  const resolvedTrigger = trigger ?? (
    <Button size="sm">
      {isEditing ? (
        <>
          <Pencil className="mr-1.5 h-4 w-4" />
          Edit unit
        </>
      ) : (
        <>
          <Plus className="mr-1.5 h-4 w-4" />
          Add unit
        </>
      )}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {controlledOpen === undefined && (
        <DialogTrigger asChild>{resolvedTrigger}</DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-2">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line bg-canvas text-ink-3">
              <Ruler className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base">
                {isEditing ? "Edit unit" : "Add unit of measure"}
              </DialogTitle>
              <DialogDescription className="mt-1 font-mono text-[12px] leading-relaxed">
                Custom units belong to your business only. System units are
                read-only and shared across the platform.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
                    Name <span className="text-neg">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Sack"
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="abbreviation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
                      Abbreviation <span className="text-neg">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. sack"
                        {...field}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unitType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
                      Type <span className="text-neg">*</span>
                    </FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {UNIT_TYPE_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <p className="font-mono text-[11px] leading-relaxed text-muted-foreground">
              Pick the right type — it gates which other units this one can
              convert to. Weight units convert to weight units, volume to
              volume, and so on.
            </p>

            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
