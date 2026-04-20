"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil, Plus } from "lucide-react";
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
        toast({ variant: "success", title: "Saved", description: res.message });
        onOpenChange(false);
        router.refresh();
      } else {
        toast({ variant: "destructive", title: "Failed", description: res.message });
      }
    });
  };

  const resolvedTrigger = trigger ?? (
    <Button size="sm">
      {unit ? (
        <>
          <Pencil className="h-4 w-4 mr-1.5" />
          Edit unit
        </>
      ) : (
        <>
          <Plus className="h-4 w-4 mr-1.5" />
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
        <DialogHeader>
          <DialogTitle>{unit ? "Edit unit" : "Add unit of measure"}</DialogTitle>
          <DialogDescription>
            Custom units belong to your business only. System units are
            read-only and shared across the platform.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
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
                    <FormLabel>Abbreviation</FormLabel>
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
                    <FormLabel>Type</FormLabel>
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
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {unit ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
