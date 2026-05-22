"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormError } from "@/components/widgets/form-error";
import { useToast } from "@/hooks/use-toast";

import { createCreditPack, updateCreditPack } from "@/lib/actions/admin/billing";
import { CreateCreditPackSchema } from "@/types/admin/schemas";
import {
  CreditPackResponse,
  CreditTypeResponse,
} from "@/types/admin/billing";

interface CreditPackFormDialogProps {
  pack: CreditPackResponse | null;
  creditTypes: CreditTypeResponse[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

type FormValues = z.infer<typeof CreateCreditPackSchema>;

function emptyValues(creditTypes: CreditTypeResponse[]): FormValues {
  return {
    creditTypeId: creditTypes[0]?.id ?? "",
    name: "",
    description: "",
    creditAmount: 100,
    price: 0,
  };
}

function valuesFromPack(p: CreditPackResponse): FormValues {
  return {
    creditTypeId: p.creditTypeId,
    name: p.name,
    description: p.description ?? "",
    creditAmount: p.creditAmount,
    price: p.price,
  };
}

export function CreditPackFormDialog({
  pack,
  creditTypes,
  open,
  onOpenChange,
  onSaved,
}: CreditPackFormDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");
  const { toast } = useToast();
  const isEdit = pack !== null;

  const form = useForm<FormValues>({
    resolver: zodResolver(CreateCreditPackSchema),
    defaultValues: pack ? valuesFromPack(pack) : emptyValues(creditTypes),
  });

  useEffect(() => {
    if (!open) {
      form.reset(emptyValues(creditTypes));
      setError("");
      return;
    }
    form.reset(pack ? valuesFromPack(pack) : emptyValues(creditTypes));
  }, [open, pack, creditTypes, form]);

  const onSubmit = (values: FormValues) => {
    setError("");
    startTransition(async () => {
      const result = pack
        ? await updateCreditPack(pack.id, values)
        : await createCreditPack(values);
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
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit credit pack" : "New credit pack"}
          </DialogTitle>
          <DialogDescription>
            Credit packs are bundles customers buy outright (SMS, email,
            etc.). Edits affect the catalog for future purchases only —
            already-purchased balances stay put.
          </DialogDescription>
        </DialogHeader>

        {error && <FormError message={error} />}

        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit(onSubmit)(e);
            }}
            noValidate
          >
            <FormField
              control={form.control}
              name="creditTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Credit type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isPending || creditTypes.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pick a credit type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {creditTypes.map((ct) => (
                        <SelectItem key={ct.id} value={ct.id}>
                          {ct.name}{" "}
                          <span className="font-mono text-[11px] text-muted-foreground">
                            · {ct.code}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pack name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="1,000 SMS bundle"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Shown to customers in the credit shop"
                      disabled={isPending}
                      rows={2}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="creditAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credits</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        step="1"
                        disabled={isPending}
                        {...field}
                        onChange={(e) =>
                          field.onChange(Number(e.target.value || 0))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        disabled={isPending}
                        {...field}
                        onChange={(e) =>
                          field.onChange(Number(e.target.value || 0))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </span>
                ) : isEdit ? (
                  "Save changes"
                ) : (
                  "Create pack"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
