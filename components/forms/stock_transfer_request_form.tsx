"use client";

import React, { useCallback, useState, useTransition } from "react";
import { useForm, useFieldArray, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { z } from "zod";
import {
  ClipboardList,
  Boxes,
  CheckCircle2,
  Plus,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { NumericFormat } from "react-number-format";
import { useToast } from "@/hooks/use-toast";
import {
  Alert,
  AlertIcon,
  AlertBody,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";
import {
  createTransferRequest,
  getRequestSources,
} from "@/lib/actions/stock-transfer-request-actions";
import { TransferRequestSchema } from "@/types/stock-transfer-request/schema";
import { FormResponse } from "@/types/types";
import StockVariantSelector from "@/components/widgets/stock-variant-selector";
import DestinationSelector from "@/components/widgets/destination-selector";

import styles from "./styles/form-shell.module.css";

export default function StockTransferRequestForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof TransferRequestSchema>>({
    resolver: zodResolver(TransferRequestSchema),
    defaultValues: {
      sourceLocationType: "LOCATION",
      sourceLocationId: "",
      notes: "",
      items: [{ stockVariantId: "", requestedQuantity: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const onInvalid = useCallback(
    (_errors: FieldErrors) => {
      toast({
        variant: "destructive",
        title: "Validation failed",
        description: "Check your inputs.",
      });
    },
    [toast],
  );

  const submitData = (values: z.infer<typeof TransferRequestSchema>) => {
    setResponse(undefined);
    startTransition(() => {
      createTransferRequest(values).then((data) => {
        if (data) setResponse(data);
        if (data?.responseType === "success") {
          toast({ variant: "success", title: "Success", description: data.message });
        }
      });
    });
  };

  return (
    <Form {...form}>
      {response?.responseType === "error" && response?.message ? (
        <Alert tone="danger" className="mb-3">
          <AlertIcon>
            <AlertTriangle className="h-3.5 w-3.5" />
          </AlertIcon>
          <AlertBody>
            <AlertTitle>We couldn&apos;t raise this stock request</AlertTitle>
            <AlertDescription>{response.message}</AlertDescription>
          </AlertBody>
        </Alert>
      ) : null}
      <form
        onSubmit={form.handleSubmit(submitData, onInvalid)}
        className={styles.formRoot}
      >
        <div className={styles.formStack}>
          <section className={styles.formCard}>
            <header className={styles.formCardHead}>
              <div className={styles.icoBox}>
                <ClipboardList className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3>Request details</h3>
                <p className={styles.formCardHeadDesc}>
                  Where the stock is coming from. You are the requester.
                </p>
              </div>
              <div className={styles.formCardActions}>
                <span className={styles.stepBadge}>STEP 01</span>
              </div>
            </header>

            <div className={styles.formBody}>
              <div className={styles.fieldRow}>
                <FormField
                  control={form.control}
                  name="sourceLocationId"
                  render={({ field }) => (
                    <FormItem className="col-span-2 min-w-0">
                      <FormLabel className={styles.fieldLabel}>
                        Source <span className="req">*</span>
                      </FormLabel>
                      <FormControl>
                        <DestinationSelector
                          value={field.value}
                          isDisabled={isPending}
                          placeholder="Select source"
                          loadOptions={getRequestSources}
                          onChange={(id, type) => {
                            field.onChange(id);
                            form.setValue("sourceLocationType", type, {
                              shouldValidate: true,
                              shouldDirty: true,
                            });
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className={styles.fieldRow} style={{ marginTop: 14 }}>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="col-span-2 min-w-0">
                      <FormLabel className={styles.fieldLabel}>
                        Notes
                        <span className="opt">OPTIONAL</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Why you need this stock, target date…"
                          rows={2}
                          {...field}
                          value={field.value ?? ""}
                          disabled={isPending}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </section>

          <section className={styles.formCard}>
            <header className={styles.formCardHead}>
              <div className={styles.icoBox}>
                <Boxes className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3>Requested items</h3>
                <p className={styles.formCardHeadDesc}>
                  What you need. One line per stock variant.
                </p>
              </div>
              <div className={styles.formCardActions}>
                <span className={styles.stepBadge}>STEP 02</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({ stockVariantId: "", requestedQuantity: 0 })
                  }
                  disabled={isPending}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add item
                </Button>
              </div>
            </header>

            <div className={styles.formBody}>
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="border rounded-lg p-4 space-y-3 bg-muted/40"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Item {index + 1}
                      </span>
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name={`items.${index}.stockVariantId`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel className="text-xs">
                              Stock item <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <StockVariantSelector
                                value={f.value}
                                onChange={f.onChange}
                                isDisabled={isPending}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`items.${index}.requestedQuantity`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel className="text-xs">
                              Quantity <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <NumericFormat
                                className="flex h-10 w-full rounded-md border-0 bg-muted px-3 py-2 text-sm"
                                value={f.value}
                                onValueChange={(v) =>
                                  f.onChange(v.value ? Number(v.value) : 0)
                                }
                                thousandSeparator
                                placeholder="0"
                                disabled={isPending}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className={styles.formFoot}>
          <div className={styles.formFootSpacer} />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                disabled={isPending}
                title="Discard changes and go back"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Discard
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent tone="danger">
              <AlertDialogIcon>
                <Trash2 className="h-5 w-5" />
              </AlertDialogIcon>
              <AlertDialogHeader>
                <AlertDialogTitle>Discard this request?</AlertDialogTitle>
                <AlertDialogDescription>
                  Unsaved changes will be lost.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep editing</AlertDialogCancel>
                <AlertDialogAction onClick={() => router.back()}>
                  Discard
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button type="submit" disabled={isPending}>
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            Raise request
          </Button>
        </div>
      </form>
    </Form>
  );
}
