// "use client";
//
// import { Input } from "@/components/ui/input";
// import { FieldErrors, useForm } from "react-hook-form";
// import {
//   Form,
//   FormControl,
//   FormDescription,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/components/ui/form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { z } from "zod";
// import React, { useCallback, useState, useTransition } from "react";
// import { useToast } from "@/hooks/use-toast";
// import { FormResponse } from "@/types/types";
// import CancelButton from "../widgets/cancel-button";
// import { SubmitButton } from "../widgets/submit-button";
// import { Separator } from "@/components/ui/separator";
// import { FormError } from "../widgets/form-error";
// import { FormSuccess } from "../widgets/form-success";
// import { Discount } from "@/types/discount/type";
// import { DiscountSchema } from "@/types/discount/schema";
// import { createDiscount, updateDiscount } from "@/lib/actions/discount-actions";
// import DiscountTypeSelector from "../widgets/discount-type-selector";
// import { formatNumber } from "@/lib/utils";
// import { Switch } from "../ui/switch";
// import { NumericFormat } from "react-number-format";
// import { useRouter } from "next/navigation";
// import DiscountUsageSelector from "../widgets/discount-usage-selector";
// import DiscountApplyOptionsWidget from "../widgets/discount-apply-selectort";
// import DateTimePickerTwo from "@/components/widgets/date-time-picker";
//
// function DiscountForm({ item }: { item: Discount | null | undefined }) {
//   const [isPending, startTransition] = useTransition();
//   const [, setResponse] = useState<FormResponse | undefined>();
//   const [error] = useState<string | undefined>("");
//   const [success] = useState<string | undefined>("");
//
//   const { toast } = useToast();
//   const router = useRouter();
//   const today = new Date();
//   today.setHours(0, 0, 0, 0);
//
//   const form = useForm<z.infer<typeof DiscountSchema>>({
//     resolver: zodResolver(DiscountSchema),
//     defaultValues: {
//       ...item,
//       discountValue: item?.discountValue,
//       status: true,
//       validFrom: item?.validFrom ? new Date(item.validFrom) : undefined,
//       validTo: item?.validTo ? new Date(item.validTo) : undefined,
//       department: item?.department || null,
//       customer: item?.customer || null,
//       category: item?.category || null,
//       product: item?.product || null,
//     },
//   });
//
//   const onInvalid = useCallback(
//     (errors: FieldErrors) => {
//       const errorEntries = Object.entries(errors);
//
//       const firstError = errorEntries[0]?.[1]?.message;
//       const errorMessage =
//         typeof firstError === "string"
//           ? firstError
//           : "Please check all fields and try again";
//
//       toast({
//         variant: "destructive",
//         title: "Validation Error",
//         description: errorMessage,
//       });
//     },
//     [toast],
//   );
//
//   const submitData = (values: z.infer<typeof DiscountSchema>) => {
//     startTransition(() => {
//       if (item) {
//         updateDiscount(item.id, values).then((data: FormResponse | void) => {
//           if (data) setResponse(data);
//           if (data && data.responseType === "success") {
//             toast({
//               title: "Success",
//               description: data.message,
//             });
//             router.push("/discounts");
//           }
//         });
//       } else {
//         createDiscount(values)
//           .then((data: FormResponse | void) => {
//             if (data && data.responseType === "success") {
//               setResponse(data);
//               toast({
//                 title: "Success",
//                 description: data.message,
//               });
//               router.push("/discounts");
//             }
//           })
//           .catch((err) => {
//             console.log(err);
//           });
//       }
//     });
//   };
//
//   const handleSelectionChange = (selection: {
//     itemType: string;
//     itemId: string | null;
//   }) => {
//     const { itemType, itemId } = selection;
//
//     console.log("Selected item type:", itemType);
//     console.log("Selected item ID:", itemId);
//
//     if (itemType && itemId) {
//       form.setValue(itemType as keyof z.infer<typeof DiscountSchema>, itemId, {
//         shouldValidate: true,
//       });
//     }
//   };
//
//   return (
//     <Form {...form}>
//       <form
//         onSubmit={form.handleSubmit(submitData, onInvalid)}
//         className={`gap-1`}
//       >
//         <div>
//           <>
//             <>
//               <FormError message={error} />
//               <FormSuccess message={success} />
//               <div className="grid grid-cols-1 lg:grid-cols-4 md:grid-cols-2 gap-4">
//                 <FormField
//                   control={form.control}
//                   name="name"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Discount Name</FormLabel>
//                       <FormControl>
//                         <Input
//                           placeholder="Enter discount name"
//                           {...field}
//                           disabled={isPending}
//                         />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={form.control}
//                   name="discountType"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Discount Type</FormLabel>
//                       <FormControl>
//                         <DiscountTypeSelector
//                           value={field.value}
//                           onChange={field.onChange}
//                           onBlur={field.onBlur}
//                           isRequired
//                           isDisabled={isPending}
//                           label="Discount Type"
//                           placeholder="Select discount type"
//                         />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={form.control}
//                   name="discountValue"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Discount Value</FormLabel>
//                       <FormControl>
//                         <NumericFormat
//                           className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm leading-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black-2"
//                           value={field.value}
//                           disabled={isPending}
//                           placeholder="Enter discount value"
//                           thousandSeparator={true}
//                           allowNegative={false}
//                           onValueChange={(values) => {
//                             console.log(values);
//                             const rawValue = Number(
//                               values.value
//                                 .replace(/,/g, "")
//                                 .replace(/\.00$/, ""),
//                             );
//                             field.onChange(rawValue);
//                           }}
//                         />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={form.control}
//                   name="minimumSpend"
//                   render={({ field }) => (
//                     <FormItem className="flex flex-col lg:mt-4">
//                       <FormLabel>Minimum Spend</FormLabel>
//                       <FormControl>
//                         <Input
//                           placeholder="Enter minimum spend for discount,if customer has spend X or more amount"
//                           {...field}
//                           disabled={isPending}
//                           value={field.value ? formatNumber(field.value) : ""}
//                           onChange={(e) => {
//                             const value = e.target.value.replace(/,/g, "");
//                             field.onChange(
//                               value ? parseFloat(value) : undefined,
//                             );
//                           }}
//                         />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//
//                 <FormField
//                   control={form.control}
//                   name="usageLimit"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Discount Usage</FormLabel>
//                       <FormControl>
//                         <DiscountUsageSelector
//                           value={field.value}
//                           onChange={field.onChange}
//                           onBlur={field.onBlur}
//                           isRequired
//                           isDisabled={isPending}
//                           label="usage limit"
//                           placeholder="Select discount usage"
//                         />
//                       </FormControl>
//                       <FormDescription>
//                         Discount Usage can either be once or repeated
//                       </FormDescription>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//
//                 <FormField
//                   control={form.control}
//                   name="validFrom"
//                   render={({ field }) => (
//                     <FormItem className="flex flex-col">
//                       <FormLabel>Valid From </FormLabel>
//                       <DateTimePickerTwo
//                         field={field}
//                         date={field.value}
//                         setDate={field.onChange}
//                         handleTimeChange={(type, value) => {
//                           const newDate = field.value
//                             ? new Date(field.value)
//                             : new Date();
//                           if (type === "hour") {
//                             newDate.setHours(Number(value));
//                           } else if (type === "minutes") {
//                             newDate.setMinutes(Number(value));
//                           }
//                           field.onChange(newDate);
//                         }}
//                         onDateSelect={field.onChange}
//                         minDate={today}
//                       />
//                       <FormDescription>
//                         Please select your preferred start date and time.
//                       </FormDescription>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//
//                 <FormField
//                   control={form.control}
//                   name="validTo"
//                   render={({ field }) => (
//                     <FormItem className="flex flex-col">
//                       <FormLabel>Valid To </FormLabel>
//                       <DateTimePickerTwo
//                         field={field}
//                         date={field.value}
//                         setDate={field.onChange}
//                         handleTimeChange={(type, value) => {
//                           const newDate = field.value
//                             ? new Date(field.value)
//                             : new Date();
//                           if (type === "hour") {
//                             newDate.setHours(Number(value));
//                           } else if (type === "minutes") {
//                             newDate.setMinutes(Number(value));
//                           }
//                           field.onChange(newDate);
//                         }}
//                         onDateSelect={field.onChange}
//                         minDate={new Date()}
//                       />
//                       <FormDescription>
//                         Please select your preferred end date and time.
//                       </FormDescription>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//
//                 <DiscountApplyOptionsWidget
//                   onSelectionChange={handleSelectionChange}
//                   initialItemType={
//                     // item?.stockVariant ? "variant" :
//                     item?.customer
//                       ? "customer"
//                       : item?.category
//                         ? "category"
//                         : item?.department
//                           ? "department"
//                           : null
//                   }
//                   initialItemId={
//                     item?.customer || item?.category || item?.department || null
//                   }
//                 />
//
//                 {item && (
//                   <div className="grid gap-2">
//                     <FormField
//                       control={form.control}
//                       name="status"
//                       render={({ field }) => (
//                         <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
//                           <FormLabel>
//                             Discount Status {""}
//                             <span
//                               className={
//                                 item.status ? "text-green-500" : "text-red-500"
//                               }
//                             >
//                               ({item.status ? "Active" : "Inactive"})
//                             </span>
//                           </FormLabel>
//                           <FormControl>
//                             <Switch
//                               checked={field.value}
//                               onCheckedChange={field.onChange}
//                               disabled={isPending}
//                             />
//                           </FormControl>
//                           <FormMessage />
//                         </FormItem>
//                       )}
//                     />
//                   </div>
//                 )}
//               </div>
//             </>
//           </>
//           <div className="flex h-5 items-center space-x-4 mt-4">
//             <CancelButton />
//             <Separator orientation="vertical" />
//             <SubmitButton
//               isPending={isPending}
//               label={item ? "Update discount details" : "Add discount"}
//             />
//           </div>
//         </div>
//       </form>
//     </Form>
//   );
// }
//
// export default DiscountForm;

"use client";

import { Input } from "@/components/ui/input";
import { FieldErrors, useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import React, { useCallback, useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { FormResponse } from "@/types/types";
import CancelButton from "../widgets/cancel-button";
import { SubmitButton } from "../widgets/submit-button";
import { Separator } from "@/components/ui/separator";
import { Discount } from "@/types/discount/type";
import { DiscountSchema } from "@/types/discount/schema";
import { createDiscount, updateDiscount } from "@/lib/actions/discount-actions";
import DiscountTypeSelector from "../widgets/discount-type-selector";
import { formatNumber } from "@/lib/utils";
import { Switch } from "../ui/switch";
import { NumericFormat } from "react-number-format";
import { useRouter } from "next/navigation";
import DiscountUsageSelector from "../widgets/discount-usage-selector";
import DiscountApplyOptionsWidget from "../widgets/discount-apply-selectort";
import DateTimePickerTwo from "@/components/widgets/date-time-picker";
import {
  Tag,
  Percent,
  DollarSign,
  Calendar,
  Repeat,
  Settings2,
  ToggleRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({
  icon: Icon,
  title,
  description,
  children,
  className,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary shrink-0">
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      <div className="pl-11">{children}</div>
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────
function DiscountForm({ item }: { item: Discount | null | undefined }) {
  const [isPending, startTransition] = useTransition();
  const [, setResponse] = useState<FormResponse | undefined>();

  const { toast } = useToast();
  const router = useRouter();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const form = useForm<z.infer<typeof DiscountSchema>>({
    resolver: zodResolver(DiscountSchema),
    defaultValues: {
      ...item,
      discountValue: item?.discountValue,
      status: true,
      validFrom: item?.validFrom ? new Date(item.validFrom) : undefined,
      validTo: item?.validTo ? new Date(item.validTo) : undefined,
      department: item?.department || null,
      customer: item?.customer || null,
      category: item?.category || null,
      product: item?.product || null,
    },
  });

  const onInvalid = useCallback(
    (errors: FieldErrors) => {
      const firstError = Object.entries(errors)[0]?.[1]?.message;
      toast({
        variant: "destructive",
        title: "Validation Error",
        description:
          typeof firstError === "string"
            ? firstError
            : "Please check all fields and try again",
      });
    },
    [toast],
  );

  const submitData = (values: z.infer<typeof DiscountSchema>) => {
    startTransition(() => {
      if (item) {
        updateDiscount(item.id, values).then((data: FormResponse | void) => {
          if (data) setResponse(data);
          if (data?.responseType === "success") {
            toast({ variant: "success", title: "Success", description: data.message });
            router.push("/discounts");
          }
        });
      } else {
        createDiscount(values)
          .then((data: FormResponse | void) => {
            if (data?.responseType === "success") {
              setResponse(data);
              toast({ variant: "success", title: "Success", description: data.message });
              router.push("/discounts");
            }
          })
          .catch(console.error);
      }
    });
  };

  const handleSelectionChange = (selection: {
    itemType: string;
    itemId: string | null;
  }) => {
    const { itemType, itemId } = selection;
    if (itemType && itemId) {
      form.setValue(itemType as keyof z.infer<typeof DiscountSchema>, itemId, {
        shouldValidate: true,
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submitData, onInvalid)}>
        <div className="space-y-8">
          {/* ── Basic Info ── */}
          <Section
            icon={Tag}
            title="Basic Information"
            description="Name and type of this discount"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Summer Sale, VIP Member"
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
                name="discountType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount Type</FormLabel>
                    <FormControl>
                      <DiscountTypeSelector
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        isRequired
                        isDisabled={isPending}
                        label="Discount Type"
                        placeholder="Select discount type"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Section>

          <Separator />

          {/* ── Value & Spend ── */}
          <Section
            icon={Percent}
            title="Value & Spend"
            description="Set the discount amount and minimum spend requirement"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="discountValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount Value</FormLabel>
                    <FormControl>
                      <NumericFormat
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        value={field.value}
                        disabled={isPending}
                        placeholder="e.g., 10 for 10% or 5000 fixed"
                        thousandSeparator={true}
                        allowNegative={false}
                        onValueChange={(values) => {
                          const rawValue = Number(
                            values.value.replace(/,/g, "").replace(/\.00$/, ""),
                          );
                          field.onChange(rawValue);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="minimumSpend"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Spend</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., 50,000"
                        {...field}
                        disabled={isPending}
                        value={field.value ? formatNumber(field.value) : ""}
                        onChange={(e) => {
                          const value = e.target.value.replace(/,/g, "");
                          field.onChange(value ? parseFloat(value) : undefined);
                        }}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Customer must spend at least this amount to qualify
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Section>

          <Separator />

          {/* ── Usage & Validity ── */}
          <Section
            icon={Calendar}
            title="Usage & Validity"
            description="Control when and how many times this discount can be used"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="usageLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usage Limit</FormLabel>
                    <FormControl>
                      <DiscountUsageSelector
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        isRequired
                        isDisabled={isPending}
                        label="usage limit"
                        placeholder="Select usage type"
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Once-off or repeatable per customer
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="validFrom"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Valid From</FormLabel>
                    <DateTimePickerTwo
                      field={field}
                      date={field.value}
                      setDate={field.onChange}
                      handleTimeChange={(type, value) => {
                        const newDate = field.value
                          ? new Date(field.value)
                          : new Date();
                        if (type === "hour") newDate.setHours(Number(value));
                        else if (type === "minutes")
                          newDate.setMinutes(Number(value));
                        field.onChange(newDate);
                      }}
                      onDateSelect={field.onChange}
                      minDate={today}
                    />
                    <FormDescription className="text-xs">
                      Start date &amp; time
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="validTo"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Valid To</FormLabel>
                    <DateTimePickerTwo
                      field={field}
                      date={field.value}
                      setDate={field.onChange}
                      handleTimeChange={(type, value) => {
                        const newDate = field.value
                          ? new Date(field.value)
                          : new Date();
                        if (type === "hour") newDate.setHours(Number(value));
                        else if (type === "minutes")
                          newDate.setMinutes(Number(value));
                        field.onChange(newDate);
                      }}
                      onDateSelect={field.onChange}
                      minDate={new Date()}
                    />
                    <FormDescription className="text-xs">
                      Expiry date &amp; time
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Section>

          <Separator />

          {/* ── Apply To ── */}
          <Section
            icon={Settings2}
            title="Apply To"
            description="Scope this discount to a specific customer, category, or department"
          >
            <DiscountApplyOptionsWidget
              onSelectionChange={handleSelectionChange}
              initialItemType={
                item?.customer
                  ? "customer"
                  : item?.category
                    ? "category"
                    : item?.department
                      ? "department"
                      : null
              }
              initialItemId={
                item?.customer || item?.category || item?.department || null
              }
            />
          </Section>

          {/* ── Status (edit mode only) ── */}
          {item && (
            <>
              <Separator />
              <Section
                icon={ToggleRight}
                title="Status"
                description="Enable or disable this discount"
              >
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4 max-w-sm">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm font-medium cursor-pointer">
                          Discount Active
                        </FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Currently{" "}
                          <span
                            className={cn(
                              "font-semibold",
                              field.value ? "text-green-600" : "text-red-500",
                            )}
                          >
                            {field.value ? "active" : "inactive"}
                          </span>
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isPending}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </Section>
            </>
          )}

          {/* ── Actions ── */}
          <Separator />
          <div className="flex items-center gap-4 pt-2">
            <CancelButton />
            <Separator orientation="vertical" className="h-5" />
            <SubmitButton
              isPending={isPending}
              label={item ? "Update Discount" : "Add Discount"}
            />
          </div>
        </div>
      </form>
    </Form>
  );
}

export default DiscountForm;
