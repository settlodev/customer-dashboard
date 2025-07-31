// "use client";

// import { useForm } from "react-hook-form";
// import {
//     Form,
//     FormControl,
//     FormField,
//     FormItem,
//     FormLabel,
//     FormMessage,
// } from "@/components/ui/form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { z } from "zod";
// import React, { useCallback, useEffect, useState, useTransition } from "react";
// import { useToast } from "@/hooks/use-toast";
// import { Separator } from "@/components/ui/separator";
// import { Switch } from "@/components/ui/switch";
// import { Checkbox } from "@/components/ui/checkbox";
// import { StockIntake } from "@/types/stock-intake/type";
// import { StockIntakeSchema } from "@/types/stock-intake/schema";

// import { FormResponse } from "@/types/types";
// import { useRouter } from "next/navigation";
// import { Calendar, Clock, DollarSign } from "lucide-react";
// import { useSearchParams } from 'next/navigation'
// import { FormError } from "@/components/widgets/form-error";
// import DateTimePicker from "@/components/widgets/datetimepicker";
// import CancelButton from "@/components/widgets/cancel-button";
// import SubmitButton from "@/components/widgets/submit-button";
// import { createStockIntakeForWarehouse, updateStockIntakeFromWarehouse } from "@/lib/actions/warehouse/stock-intake-actions";
// import WarehouseStaffSelectorWidget from "@/components/widgets/warehouse/staff-selector";
// import StockVariantSelectorForWarehouse from "@/components/widgets/warehouse/stock-variant-selector";
// import SupplierSelector from "@/components/widgets/supplier-selector";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { NumericFormat } from "react-number-format";

// function WarehouseStockIntakeForm({ item }: { item: StockIntake | null | undefined }) {

//     const [isPending, startTransition] = useTransition();
//     const [error, setError] = useState<string | undefined>("");
//     const [orderDate, setOrderDate] = useState<Date | undefined>(
//         item?.orderDate ? new Date(item.orderDate) : undefined
//     );
//     const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(
//         item?.deliveryDate ? new Date(item.deliveryDate) : undefined
//     );
//     const [batchExpiryDate, setBatchExpiryDate] = useState<Date | undefined>(
//         item?.batchExpiryDate ? new Date(item.batchExpiryDate) : undefined
//     );
//     const [showPurchaseAmount, setShowPurchaseAmount] = useState<boolean>(
//         item?.purchasePaidAmount !== undefined && item?.purchasePaidAmount !== null
//     );
//     const [, setResponse] = useState<FormResponse | undefined>();
//     const { toast } = useToast();
//     const router = useRouter();
//     const searchParams = useSearchParams()
//     const stockVariantId = searchParams.get('stockItem')

//     const form = useForm<z.infer<typeof StockIntakeSchema>>({
//         resolver: zodResolver(StockIntakeSchema),
//         defaultValues: item ? item : {
//             status: true,
            
//             ...(stockVariantId ? { stockVariant: stockVariantId } : {})
//         },
//     });

//     useEffect(() => {
//         if (stockVariantId) {
//             form.setValue('stockVariant', stockVariantId);
//         }
//     }, [stockVariantId, form]);

//     // Clear purchase amount when checkbox is unchecked
//     useEffect(() => {
//         if (!showPurchaseAmount) {
//             form.setValue('purchasePaidAmount', undefined);
//         }
//     }, [showPurchaseAmount, form]);

//     const onInvalid = useCallback(
//         (errors: any) => {
//             console.log("These errors occurred:", errors);
//             toast({
//                 variant: "destructive",
//                 title: "Uh oh! something went wrong",
//                 description: errors.message
//                     ? errors.message
//                     : "There was an issue submitting your form, please try later",
//             });
//         },
//         [toast]
//     );

//     const submitData = (values: z.infer<typeof StockIntakeSchema>) => {
//         if (deliveryDate && orderDate && deliveryDate < orderDate) {
//             setError("Delivery date cannot be before order date.");
//             return;
//         }
//         const updatedValues = {
//             value: values.value,
//             ...(showPurchaseAmount && values.purchasePaidAmount && { purchasePaidAmount: values.purchasePaidAmount })
//         };

//         console.log("Starting submitData with values:", values);

//         startTransition(() => {
//             if (item) {
//                 updateStockIntakeFromWarehouse(item.id, updatedValues).then((data) => {
//                     if (data) setResponse(data);
//                     if (data && data.responseType === "success") {
//                         toast({
//                             title: "Success",
//                             description: data.message,
//                         });
//                         router.push("/warehouse-stock-intakes");
//                     }
//                 });
//             } else {
//                 createStockIntakeForWarehouse(values,)
//                     .then((data) => {
//                         if (data) setResponse(data);
//                         if (data && data.responseType === "success") {
//                             toast({
//                                 title: "Success",
//                                 description: data.message,
//                             });
//                             router.push("/warehouse-stock-intakes");
//                         }
//                     })
//                     .catch((err) => {
//                         console.log("Error while creating stock intake: ", err);
//                     });
//             }
//         });
//     };

//     const handleTimeChange = (type: "hour" | "minutes", value: string) => {
//         if (!orderDate || !setOrderDate || !setDeliveryDate) return;

//         const newDate = new Date(orderDate);
//         const newDeliveryDate = new Date(orderDate);
//         const newBatchExpiryDate = new Date(orderDate);

//         if (type === "hour") {
//             newDate.setHours(Number(value));
//             newDeliveryDate.setHours(Number(value));
//             newBatchExpiryDate.setHours(Number(value));
//         } else if (type === "minutes") {
//             newDate.setMinutes(Number(value));
//             newDeliveryDate.setMinutes(Number(value));
//             newBatchExpiryDate.setMinutes(Number(value));
//         }

//         setOrderDate(newDate);
//         setDeliveryDate(newDeliveryDate)
//         setBatchExpiryDate(newBatchExpiryDate)
//     };

//     const handleDateSelect = (date: Date) => {
//         setOrderDate(date);
//         setDeliveryDate(date);
//         setBatchExpiryDate(date);
//     };
//     const validateDates = (date: Date) => {
//         if (orderDate && date < orderDate) {
//             setError("Delivery date cannot be before the order date.");
//             return false;
//         }
//         setError(undefined);
//         return true;
//     };

//     const handleDeliveryDateSelect = (date: Date) => {
//         const today = new Date();
//         today.setHours(0, 0, 0, 0);

//         if (validateDates(date) && date <= today) {
//             setDeliveryDate(date);
//         } else {
//             if (date > today) {
//                 setError("Delivery date cannot exceed today's date.");
//                 return false;
//             }
//         }
//     };

//     return (
//         <>
//             <Form {...form}>
//                 <form onSubmit={form.handleSubmit(submitData, onInvalid)} className="space-y-8">
//                     <FormError message={error} />

//                     <div className="flex flex-col gap-3">
//                         <Card className="shadow-md">
//                             <CardHeader>
//                                 <CardTitle className="font-bold text-sm">Item Details</CardTitle>

//                             </CardHeader>
//                             <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                                 <FormField
//                                     control={form.control}
//                                     name="stockVariant"
//                                     render={({ field }) => (
//                                         <FormItem>
//                                             <FormLabel className="font-medium">Stock Item</FormLabel>
//                                             <FormControl>
//                                                 <StockVariantSelectorForWarehouse
//                                                     {...field}
//                                                     isRequired
//                                                     isDisabled={!!item || isPending}
//                                                     placeholder="Select stock item"
//                                                 />
//                                             </FormControl>
//                                             <FormMessage />
//                                         </FormItem>
//                                     )}
//                                 />

//                                 <FormField
//                                     control={form.control}
//                                     name="quantity"
//                                     render={({ field }) => (
//                                         <FormItem>
//                                             <FormLabel className="font-medium">Quantity</FormLabel>
//                                             <FormControl>
//                                                 <input
//                                                     type="text"
//                                                     className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
//                                                     value={field.value || ""}
//                                                     disabled={!!item || isPending}
//                                                     placeholder="Enter quantity"
//                                                     onChange={(e) => {
//                                                         const rawValue = e.target.value.replace(/,/g, ""); // Remove commas
//                                                         if (/^\d*$/.test(rawValue)) {
//                                                             field.onChange(rawValue ? parseInt(rawValue) : "");
//                                                         }
//                                                     }}
//                                                     onBlur={(e) => {
//                                                         const formattedValue = Number(e.target.value).toLocaleString();
//                                                         e.target.value = formattedValue;
//                                                     }}
//                                                 />
//                                             </FormControl>
//                                             <FormMessage />
//                                         </FormItem>
//                                     )}
//                                 />

//                                 <FormField
//                                     control={form.control}
//                                     name="value"
//                                     render={({ field }) => (
//                                         <FormItem>
//                                             <FormLabel className="font-medium">Value</FormLabel>
//                                             <FormControl>
//                                                 <NumericFormat

//                                                     className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:bg-muted"
//                                                     value={field.value}
//                                                     onValueChange={(values) => {
//                                                         field.onChange(Number(values.value));
//                                                     }}
//                                                     thousandSeparator={true}
//                                                     placeholder="Enter value of item"
//                                                     disabled={isPending || !!item}
//                                                     readOnly={!!item}
//                                                 />
//                                             </FormControl>
//                                             <FormMessage />
//                                         </FormItem>
//                                     )}
//                                 />
//                             </CardContent>
//                         </Card>

//                         <Card className="shadow-md">
//                             <CardHeader>
//                                 <CardTitle className="font-bold text-sm">Purchase Information</CardTitle>
//                             </CardHeader>
//                             <CardContent className="space-y-4">
//                                 <div className="flex items-center space-x-2">
//                                     <Checkbox
//                                         id="showPurchaseAmount"
//                                         checked={showPurchaseAmount}
//                                         onCheckedChange={(checked) => setShowPurchaseAmount(checked === true)}
//                                         disabled={isPending}
//                                     />
//                                     <label
//                                         htmlFor="showPurchaseAmount"
//                                         className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
//                                     >
//                                         Would you like to track the purchase for this item? The purchase amount records the amount paid to the supplier.
//                                     </label>
//                                 </div>

//                                 {showPurchaseAmount && (
//                                     <FormField
//                                         control={form.control}
//                                         name="purchasePaidAmount"
//                                         render={({ field }) => (
//                                             <FormItem>
//                                                 <FormLabel className="font-medium flex items-center gap-2">
//                                                     <DollarSign className="h-4 w-4" />
//                                                     Purchase Amount
//                                                 </FormLabel>
//                                                 <FormControl>
//                                                     <NumericFormat
//                                                         className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:bg-muted"
//                                                         value={field.value}
//                                                         onValueChange={(values) => {
//                                                             field.onChange(Number(values.value));
//                                                         }}
//                                                         thousandSeparator={true}
//                                                         placeholder="Enter quantity"
//                                                         disabled={isPending || !!item}
//                                                         readOnly={!!item}
//                                                     />
//                                                 </FormControl>
//                                                 <FormMessage />
//                                             </FormItem>
//                                         )}
//                                     />
//                                 )}
//                             </CardContent>
//                         </Card>

//                         <Card className="shadow-md">
//                             <CardHeader>
//                                 <CardTitle className="font-bold text-sm">Order Details</CardTitle>
//                             </CardHeader>
//                             <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                                 <FormField
//                                     control={form.control}
//                                     name="orderDate"
//                                     render={({ field }) => (
//                                         <FormItem>
//                                             <FormLabel className="font-medium flex items-center gap-2">
//                                                 <Calendar className="h-4 w-4" />
//                                                 Order Date
//                                             </FormLabel>
//                                             <DateTimePicker
//                                                 field={field}
//                                                 date={orderDate}
//                                                 setDate={setOrderDate}
//                                                 handleTimeChange={handleTimeChange}
//                                                 onDateSelect={handleDateSelect}
//                                                 maxDate={new Date()}
//                                                 disabled={!!item}
//                                             />
//                                             <FormMessage />
//                                         </FormItem>
//                                     )}
//                                 />

//                                 <FormField
//                                     control={form.control}
//                                     name="deliveryDate"
//                                     render={({ field }) => (
//                                         <FormItem>
//                                             <FormLabel className="font-medium flex items-center gap-2">
//                                                 <Clock className="h-4 w-4" />
//                                                 Delivery Date
//                                             </FormLabel>
//                                             <DateTimePicker
//                                                 field={field}
//                                                 date={deliveryDate}
//                                                 setDate={setDeliveryDate}
//                                                 handleTimeChange={handleTimeChange}
//                                                 onDateSelect={handleDeliveryDateSelect}
//                                                 minDate={orderDate}
//                                                 maxDate={new Date()}
//                                                 disabled={!!item}
//                                             />
//                                             <FormMessage />
//                                         </FormItem>
//                                     )}
//                                 />

//                                 <FormField
//                                     control={form.control}
//                                     name="batchExpiryDate"
//                                     render={({ field }) => (
//                                         <FormItem>
//                                             <FormLabel className="font-medium flex items-center gap-2">
//                                                 <Calendar className="h-4 w-4" />
//                                                 Batch Expiry
//                                             </FormLabel>
//                                             <DateTimePicker
//                                                 field={field}
//                                                 date={batchExpiryDate}
//                                                 setDate={setBatchExpiryDate}
//                                                 handleTimeChange={handleTimeChange}
//                                                 onDateSelect={handleDateSelect}
//                                                 disabled={!!item}
//                                             />
//                                             <FormMessage />
//                                         </FormItem>
//                                     )}
//                                 />
//                             </CardContent>
//                         </Card>

//                         <Card className="shadow-md">
//                             <CardHeader>
//                                 <CardTitle className="font-bold text-sm">Personnel & Supplier</CardTitle>
//                             </CardHeader>
//                             <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                                 <FormField
//                                     control={form.control}
//                                     name="staff"
//                                     render={({ field }) => (
//                                         <FormItem>
//                                             <FormLabel className="font-medium">Staff Member</FormLabel>
//                                             <FormControl>
//                                                 <WarehouseStaffSelectorWidget
//                                                     {...field}
//                                                     isRequired
//                                                     isDisabled={!!item || isPending}
//                                                     placeholder="Select staff member"
//                                                     label="Select staff member"
//                                                 />
//                                             </FormControl>
//                                             <FormMessage />
//                                         </FormItem>
//                                     )}
//                                 />

//                                 <FormField
//                                     control={form.control}
//                                     name="supplier"
//                                     render={({ field }) => (
//                                         <FormItem>
//                                             <FormLabel className="font-medium">
//                                                 Supplier <span className="text-sm text-gray-500">(optional)</span>
//                                             </FormLabel>
//                                             <FormControl>
//                                                 <SupplierSelector
//                                                     {...field}
//                                                     isDisabled={!!item || isPending}
//                                                     placeholder="Select supplier"
//                                                     label="Select supplier"
//                                                 />
//                                             </FormControl>
//                                             <FormMessage />
//                                         </FormItem>
//                                     )}
//                                 />
//                             </CardContent>
//                         </Card>

//                         {item && (
//                             <FormField
//                                 control={form.control}
//                                 name="status"
//                                 render={({ field }) => (
//                                     <FormItem className="flex items-center justify-between">
//                                         <div>
//                                             <FormLabel className="font-medium">Status</FormLabel>
//                                             <p className="text-sm text-gray-500">
//                                                 Toggle the current status of this stock intake
//                                             </p>
//                                         </div>
//                                         <FormControl>
//                                             <Switch
//                                                 checked={field.value}
//                                                 onCheckedChange={field.onChange}
//                                                 disabled={isPending}
//                                             />
//                                         </FormControl>
//                                     </FormItem>
//                                 )}
//                             />
//                         )}

//                     </div>

//                     <div className="flex h-5 items-center space-x-4">
//                         <CancelButton />
//                         <Separator orientation="vertical" />
//                         <SubmitButton label={item ? "Update stock intake" : "Record stock intake"} isPending={isPending} />
//                     </div>
//                 </form>
//             </Form>
//         </>
//     );
// }

// export default WarehouseStockIntakeForm;


// "use client";

// import React, { useState, useTransition, useCallback } from "react";
// import { useForm, useFieldArray } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { z } from "zod";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
// import { Separator } from "@/components/ui/separator";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Switch } from "@/components/ui/switch";
// import { 
//   Plus, 
//   Trash2, 
//   Calendar, 
//   Clock, 
//   DollarSign, 
//   Package,
//   Users,
//   Building2
// } from "lucide-react";
// import { NumericFormat } from "react-number-format";
// import WarehouseStaffSelectorWidget from "@/components/widgets/warehouse/staff-selector";
// import SupplierSelector from "@/components/widgets/supplier-selector";
// import StockVariantSelectorForWarehouse from "@/components/widgets/warehouse/stock-variant-selector";



// // Updated schema for multiple stock intakes
// const StockIntakeItemSchema = z.object({
//   stockVariant: z.string().min(1, "Please select stock item"),
//   quantity: z.number().min(1, "Quantity must be greater than 0"),
//   value: z.number().min(1, "Value must be greater than 0"),
//   batchExpiryDate: z.string().optional(),
//   orderDate: z.string().min(1, "Order date is required"),
//   deliveryDate: z.string().min(1, "Delivery date is required"),
//   staff: z.string().min(1, "Please select a staff member"),
//   supplier: z.string().optional(),
//   purchasePaidAmount: z.number().optional(),
//   trackPurchase: z.boolean().default(false),
// });

// const MultiStockIntakeSchema = z.object({
//   stockIntakes: z.array(StockIntakeItemSchema).min(1, "At least one stock intake is required"),
//   globalSettings: z.object({
//     useGlobalDates: z.boolean().default(false),
//     globalOrderDate: z.string().optional(),
//     globalDeliveryDate: z.string().optional(),
//     useGlobalStaff: z.boolean().default(false),
//     globalStaff: z.string().optional(),
//     useGlobalSupplier: z.boolean().default(false),
//     globalSupplier: z.string().optional(),
//   }),
// });

// function MultiStockIntakeForm({ item = null }) {
//   const [isPending, startTransition] = useTransition();
//   const [error, setError] = useState("");

//   const form = useForm({
//     resolver: zodResolver(MultiStockIntakeSchema),
//     defaultValues: {
//       stockIntakes: [{
//         stockVariant: "",
//         quantity: 0,
//         value: 0,
//         batchExpiryDate: "",
//         orderDate: new Date().toISOString(),
//         deliveryDate: new Date().toISOString(),
//         staff: "",
//         supplier: "",
//         purchasePaidAmount: 0,
//         trackPurchase: false,
//       }],
//       globalSettings: {
//         useGlobalDates: false,
//         globalOrderDate: new Date().toISOString(),
//         globalDeliveryDate: new Date().toISOString(),
//         useGlobalStaff: false,
//         globalStaff: "",
//         useGlobalSupplier: false,
//         globalSupplier: "",
//       },
//     },
//   });

//   const { fields, append, remove } = useFieldArray({
//     control: form.control,
//     name: "stockIntakes",
//   });

//   const watchGlobalSettings = form.watch("globalSettings");

//   const addStockIntake = () => {
//     const newItem = {
//       stockVariant: "",
//       quantity: 0,
//       value: 0,
//       batchExpiryDate: "",
//       orderDate: watchGlobalSettings.useGlobalDates ? watchGlobalSettings.globalOrderDate : new Date().toISOString(),
//       deliveryDate: watchGlobalSettings.useGlobalDates ? watchGlobalSettings.globalDeliveryDate : new Date().toISOString(),
//       staff: watchGlobalSettings.useGlobalStaff ? watchGlobalSettings.globalStaff : "",
//       supplier: watchGlobalSettings.useGlobalSupplier ? watchGlobalSettings.globalSupplier : "",
//       purchasePaidAmount: 0,
//       trackPurchase: false,
//     };
//     append(newItem);
//   };

//   const removeStockIntake = (index:number) => {
//     if (fields.length > 1) {
//       remove(index);
//     }
//   };

//   const applyGlobalSettings = () => {
//     const stockIntakes = form.getValues("stockIntakes");
//     const globalSettings = form.getValues("globalSettings");
    
//     stockIntakes.forEach((_, index) => {
//       if (globalSettings.useGlobalDates) {
//         form.setValue(`stockIntakes.${index}.orderDate`, globalSettings.globalOrderDate);
//         form.setValue(`stockIntakes.${index}.deliveryDate`, globalSettings.globalDeliveryDate);
//       }
//       if (globalSettings.useGlobalStaff) {
//         form.setValue(`stockIntakes.${index}.staff`, globalSettings.globalStaff);
//       }
//       if (globalSettings.useGlobalSupplier) {
//         form.setValue(`stockIntakes.${index}.supplier`, globalSettings.globalSupplier);
//       }
//     });
//   };

//   const onSubmit = (values:any) => {
//     console.log("Form submitted:", values);
//     startTransition(() => {
//       // Transform data to match API format
//       const payload = values.stockIntakes.map(item => ({
//         ...item,
//         purchasePaidAmount: item.trackPurchase ? item.purchasePaidAmount : undefined,
//       }));
      
//       // Call your API function here
//       console.log("API Payload:", payload);
      
//       // Mock success
//       setTimeout(() => {
//         alert("Stock intakes recorded successfully!");
//       }, 1000);
//     });
//   };

//   const onInvalid = useCallback((errors:any) => {
//     console.log("Form errors:", errors);
//     setError("Please fix the errors in the form");
//   }, []);

//   return (
//     <div className="max-w-7xl mx-auto p-6 space-y-6">
     

//       <Form {...form}>
//         <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6">
//           {error && (
//             <div className="bg-red-50 border border-red-200 rounded-lg p-4">
//               <p className="text-red-800">{error}</p>
//             </div>
//           )}

//           {/* Global Settings */}
//           <Card className="shadow-lg border-blue-200">
//             <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
//               <CardTitle className="flex items-center gap-2 text-blue-900">
//                 <Building2 className="h-5 w-5" />
//                 Global Settings
//               </CardTitle>
//               <p className="text-sm text-blue-700">Apply common settings to all stock intakes</p>
//             </CardHeader>
//             <CardContent className="p-6 space-y-4">
//               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                 {/* Global Dates */}
//                 <div className="space-y-3">
//                   <FormField
//                     control={form.control}
//                     name="globalSettings.useGlobalDates"
//                     render={({ field }) => (
//                       <FormItem className="flex items-center space-x-2">
//                         <FormControl>
//                           <Checkbox
//                             checked={field.value}
//                             onCheckedChange={field.onChange}
//                           />
//                         </FormControl>
//                         <FormLabel className="text-sm font-medium">Use Global Dates</FormLabel>
//                       </FormItem>
//                     )}
//                   />
//                   {watchGlobalSettings.useGlobalDates && (
//                     <div className="space-y-2">
//                       <FormField
//                         control={form.control}
//                         name="globalSettings.globalOrderDate"
//                         render={({ field }) => (
//                           <FormItem>
//                             <FormLabel className="text-xs">Order Date</FormLabel>
//                             <FormControl>
//                               <input
//                                 type="datetime-local"
//                                 {...field}
//                                 className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
//                               />
//                             </FormControl>
//                           </FormItem>
//                         )}
//                       />
//                       <FormField
//                         control={form.control}
//                         name="globalSettings.globalDeliveryDate"
//                         render={({ field }) => (
//                           <FormItem>
//                             <FormLabel className="text-xs">Delivery Date</FormLabel>
//                             <FormControl>
//                               <input
//                                 type="datetime-local"
//                                 {...field}
//                                 className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
//                               />
//                             </FormControl>
//                           </FormItem>
//                         )}
//                       />
//                     </div>
//                   )}
//                 </div>

//                 {/* Global Staff */}
//                 <div className="space-y-3">
//                   <FormField
//                     control={form.control}
//                     name="globalSettings.useGlobalStaff"
//                     render={({ field }) => (
//                       <FormItem className="flex items-center space-x-2">
//                         <FormControl>
//                           <Checkbox
//                             checked={field.value}
//                             onCheckedChange={field.onChange}
//                           />
//                         </FormControl>
//                         <FormLabel className="text-sm font-medium">Use Global Staff</FormLabel>
//                       </FormItem>
//                     )}
//                   />
//                   {watchGlobalSettings.useGlobalStaff && (
//                     <FormField
//                       control={form.control}
//                       name="globalSettings.globalStaff"
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormControl>
//                           <WarehouseStaffSelectorWidget
//                                                     {...field}
//                                                     isRequired
//                                                     isDisabled={!!item || isPending}
//                                                     placeholder="Select staff member"
//                                                     label="Select staff member"
//                                                 />
//                           </FormControl>
//                         </FormItem>
//                       )}
//                     />
//                   )}
//                 </div>

//                 {/* Global Supplier */}
//                 <div className="space-y-3">
//                   <FormField
//                     control={form.control}
//                     name="globalSettings.useGlobalSupplier"
//                     render={({ field }) => (
//                       <FormItem className="flex items-center space-x-2">
//                         <FormControl>
//                           <Checkbox
//                             checked={field.value}
//                             onCheckedChange={field.onChange}
//                           />
//                         </FormControl>
//                         <FormLabel className="text-sm font-medium">Use Global Supplier</FormLabel>
//                       </FormItem>
//                     )}
//                   />
//                   {watchGlobalSettings.useGlobalSupplier && (
//                     <FormField
//                       control={form.control}
//                       name="globalSettings.globalSupplier"
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormControl>
//                           <SupplierSelector
//                                                     {...field}
//                                                     isDisabled={!!item || isPending}
//                                                     placeholder="Select supplier"
//                                                     label="Select supplier"
//                                                 />
//                           </FormControl>
//                         </FormItem>
//                       )}
//                     />
//                   )}
//                 </div>
//               </div>

//               <Button
//                 type="button"
//                 onClick={applyGlobalSettings}
//                 variant="outline"
//                 size="sm"
//                 className="mt-4"
//               >
//                 Apply Global Settings
//               </Button>
//             </CardContent>
//           </Card>

//           {/* Stock Intake Items */}
//           <div className="space-y-4">
//             {fields.map((field, index) => (
//               <Card key={field.id} className="shadow-md border-l-4 border-l-green-500">
//                 <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
//                   <div className="flex items-center justify-between">
//                     <CardTitle className="flex items-center gap-2 text-green-900">
//                       <Package className="h-5 w-5" />
//                       Stock Intake #{index + 1}
//                     </CardTitle>
//                     <div className="flex items-center space-x-2">
//                       {fields.length > 1 && (
//                         <Button
//                           type="button"
//                           variant="destructive"
//                           size="sm"
//                           onClick={() => removeStockIntake(index)}
//                           disabled={isPending}
//                         >
//                           <Trash2 className="h-4 w-4" />
//                         </Button>
//                       )}
//                     </div>
//                   </div>
//                 </CardHeader>
//                 <CardContent className="p-6 space-y-6">
//                   {/* Item Details */}
//                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                     <FormField
//                       control={form.control}
//                       name={`stockIntakes.${index}.stockVariant`}
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel className="font-medium">Stock Item *</FormLabel>
//                           <FormControl>
//                           <StockVariantSelectorForWarehouse
//                                                     {...field}
//                                                     isRequired
//                                                     isDisabled={!!item || isPending}
//                                                     placeholder="Select stock item"
//                                                 />
//                           </FormControl>
//                           <FormMessage />
//                         </FormItem>
//                       )}
//                     />

//                     <FormField
//                       control={form.control}
//                       name={`stockIntakes.${index}.quantity`}
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel className="font-medium">Quantity *</FormLabel>
//                           <FormControl>
//                             <NumericFormat
//                               className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
//                               value={field.value}
//                               onValueChange={(values) => {
//                                 field.onChange(Number(values.value));
//                               }}
//                               thousandSeparator={true}
//                               placeholder="Enter quantity"
//                               disabled={isPending}
//                             />
//                           </FormControl>
//                           <FormMessage />
//                         </FormItem>
//                       )}
//                     />

//                     <FormField
//                       control={form.control}
//                       name={`stockIntakes.${index}.value`}
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel className="font-medium">Value *</FormLabel>
//                           <FormControl>
//                             <NumericFormat
//                               className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
//                               value={field.value}
//                               onValueChange={(values) => {
//                                 field.onChange(Number(values.value));
//                               }}
//                               thousandSeparator={true}
//                               placeholder="Enter value"
//                               disabled={isPending}
//                             />
//                           </FormControl>
//                           <FormMessage />
//                         </FormItem>
//                       )}
//                     />
//                   </div>

//                   {/* Purchase Information */}
//                   <div className="space-y-4">
//                     <FormField
//                       control={form.control}
//                       name={`stockIntakes.${index}.trackPurchase`}
//                       render={({ field }) => (
//                         <FormItem className="flex items-center space-x-2">
//                           <FormControl>
//                             <Checkbox
//                               checked={field.value}
//                               onCheckedChange={field.onChange}
//                               disabled={isPending}
//                             />
//                           </FormControl>
//                           <FormLabel className="text-sm">Track purchase amount for this item</FormLabel>
//                         </FormItem>
//                       )}
//                     />

//                     {form.watch(`stockIntakes.${index}.trackPurchase`) && (
//                       <FormField
//                         control={form.control}
//                         name={`stockIntakes.${index}.purchasePaidAmount`}
//                         render={({ field }) => (
//                           <FormItem>
//                             <FormLabel className="font-medium flex items-center gap-2">
//                               <DollarSign className="h-4 w-4" />
//                               Purchase Amount
//                             </FormLabel>
//                             <FormControl>
//                               <NumericFormat
//                                 className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
//                                 value={field.value}
//                                 onValueChange={(values) => {
//                                   field.onChange(Number(values.value));
//                                 }}
//                                 thousandSeparator={true}
//                                 placeholder="Enter purchase amount"
//                                 disabled={isPending}
//                               />
//                             </FormControl>
//                             <FormMessage />
//                           </FormItem>
//                         )}
//                       />
//                     )}
//                   </div>

//                   {/* Dates and Personnel */}
//                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
//                     <FormField
//                       control={form.control}
//                       name={`stockIntakes.${index}.orderDate`}
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel className="font-medium flex items-center gap-2">
//                             <Calendar className="h-4 w-4" />
//                             Order Date *
//                           </FormLabel>
//                           <FormControl>
//                             <input
//                               type="datetime-local"
//                               {...field}
//                               disabled={isPending || watchGlobalSettings.useGlobalDates}
//                               className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:bg-muted"
//                             />
//                           </FormControl>
//                           <FormMessage />
//                         </FormItem>
//                       )}
//                     />

//                     <FormField
//                       control={form.control}
//                       name={`stockIntakes.${index}.deliveryDate`}
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel className="font-medium flex items-center gap-2">
//                             <Clock className="h-4 w-4" />
//                             Delivery Date *
//                           </FormLabel>
//                           <FormControl>
//                             <input
//                               type="datetime-local"
//                               {...field}
//                               disabled={isPending || watchGlobalSettings.useGlobalDates}
//                               className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:bg-muted"
//                             />
//                           </FormControl>
//                           <FormMessage />
//                         </FormItem>
//                       )}
//                     />

//                     <FormField
//                       control={form.control}
//                       name={`stockIntakes.${index}.batchExpiryDate`}
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel className="font-medium flex items-center gap-2">
//                             <Calendar className="h-4 w-4" />
//                             Batch Expiry
//                           </FormLabel>
//                           <FormControl>
//                             <input
//                               type="datetime-local"
//                               {...field}
//                               disabled={isPending}
//                               className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:bg-muted"
//                             />
//                           </FormControl>
//                           <FormMessage />
//                         </FormItem>
//                       )}
//                     />

//                     <FormField
//                       control={form.control}
//                       name={`stockIntakes.${index}.staff`}
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel className="font-medium flex items-center gap-2">
//                             <Users className="h-4 w-4" />
//                             Staff *
//                           </FormLabel>
//                           <FormControl>
//                           <WarehouseStaffSelectorWidget
//                                                     {...field}
//                                                     isRequired
//                                                     isDisabled={!!item || isPending}
//                                                     placeholder="Select staff member"
//                                                     label="Select staff member"
//                                                 />
//                           </FormControl>
//                           <FormMessage />
//                         </FormItem>
//                       )}
//                     />

//                     <FormField
//                       control={form.control}
//                       name={`stockIntakes.${index}.supplier`}
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel className="font-medium">
//                             Supplier <span className="text-xs text-gray-500">(optional)</span>
//                           </FormLabel>
//                           <FormControl>
//                           <SupplierSelector
//                                                     {...field}
//                                                     isDisabled={!!item || isPending}
//                                                     placeholder="Select supplier"
//                                                     label="Select supplier"
//                                                 />
//                           </FormControl>
//                           <FormMessage />
//                         </FormItem>
//                       )}
//                     />
//                   </div>
//                 </CardContent>
//               </Card>
//             ))}
//           </div>

//           {/* Add New Item Button */}
//           <Card className="border-dashed border-2 border-gray-300 hover:border-blue-400 transition-colors">
//             <CardContent className="p-6">
//               <Button
//                 type="button"
//                 onClick={addStockIntake}
//                 variant="outline"
//                 size="lg"
//                 disabled={isPending}
//                 className="w-full h-16 text-lg border-dashed hover:bg-blue-50"
//               >
//                 <Plus className="h-6 w-6 mr-2" />
//                 Add Another Stock Intake
//               </Button>
//             </CardContent>
//           </Card>

//           {/* Submit Section */}
//           <Card className="shadow-lg border-blue-200">
//             <CardContent className="p-6">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <h3 className="text-lg font-semibold text-gray-900">Ready to Submit?</h3>
//                   <p className="text-gray-600">You're about to record {fields.length} stock intake(s)</p>
//                 </div>
//                 <div className="flex space-x-4">
//                   <Button
//                     type="button"
//                     variant="outline"
//                     disabled={isPending}
//                     onClick={() => window.history.back()}
//                   >
//                     Cancel
//                   </Button>
//                   <Button
//                     type="submit"
//                     disabled={isPending}
//                     className="min-w-[150px]"
//                   >
//                     {isPending ? "Recording..." : "Record Stock Intakes"}
//                   </Button>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         </form>
//       </Form>
//     </div>
//   );
// }

// export default MultiStockIntakeForm;

"use client";

import { useForm, useFieldArray } from "react-hook-form";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import React, { useCallback, useEffect, useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StockIntake } from "@/types/stock-intake/type";

import { FormResponse } from "@/types/types";
import { useRouter } from "next/navigation";
import { Calendar, Clock, DollarSign, Plus, Trash2, Package, TrendingUp, Copy } from "lucide-react";
import { useSearchParams } from 'next/navigation'
import { FormError } from "@/components/widgets/form-error";
import DateTimePicker from "@/components/widgets/datetimepicker";
import CancelButton from "@/components/widgets/cancel-button";
import SubmitButton from "@/components/widgets/submit-button";
import { createStockIntakeForWarehouse, updateStockIntakeFromWarehouse } from "@/lib/actions/warehouse/stock-intake-actions";
import WarehouseStaffSelectorWidget from "@/components/widgets/warehouse/staff-selector";
import StockVariantSelectorForWarehouse from "@/components/widgets/warehouse/stock-variant-selector";
import SupplierSelector from "@/components/widgets/supplier-selector";
import { NumericFormat } from "react-number-format";

// Updated schemas for multiple items
const StockIntakeItemSchema = z.object({
    stockVariant: z.string({ message: "Please select stock item" }).uuid(),
    quantity: z.preprocess(
        (val) => {
            if (typeof val === "string" && val.trim() !== "") {
                return parseInt(val);
            }
            return val;
        },
        z.number({ message: "Quantity is required" })
            .nonnegative({ message: "Quantity cannot be negative" })
            .gt(0, { message: "Quantity cannot be zero" })
    ),
    value: z.preprocess(
        (val) => {
            if (typeof val === "string" && val.trim() !== "") {
                return parseFloat(val);
            }
            return val;
        },
        z.number({ message: "Value of inventory is required" })
            .nonnegative({ message: "Value cannot be negative" })
            .gt(0, { message: "Value cannot be zero" })
    ),
    batchExpiryDate: z.string({ required_error: "Batch expiry date is required" }).optional(),
    orderDate: z.string({ required_error: "Order date is required" }),
    deliveryDate: z.string({ required_error: "Delivery date is required" }),
    staff: z.string({ message: "Please select a staff" }).uuid(),
    supplier: z.string({ message: "Please select a supplier" }).uuid().optional(),
    purchasePaidAmount: z.number().optional(),
    trackPurchase: z.boolean().optional(),
});

const MultiStockIntakeSchema = z.object({
    stockIntakes: z.array(StockIntakeItemSchema).min(1, { message: "At least one stock intake must be added" }),
    status: z.boolean().optional(),
});

function WarehouseStockIntakeForm({ item }: { item: StockIntake | null | undefined }) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | undefined>("");
    const [, setResponse] = useState<FormResponse | undefined>();
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const stockVariantId = searchParams.get('stockItem');

    const form = useForm<z.infer<typeof MultiStockIntakeSchema>>({
        resolver: zodResolver(MultiStockIntakeSchema),
        defaultValues: {
            status: true,
            stockIntakes: stockVariantId 
                ? [{
                    stockVariant: stockVariantId,
                    quantity: 1,
                    value: 0,
                    orderDate: new Date().toISOString(),
                    deliveryDate: new Date().toISOString(),
                    batchExpiryDate: undefined,
                    staff: "",
                    supplier: undefined,
                    purchasePaidAmount: undefined,
                    trackPurchase: false,
                }]
                : [{
                    stockVariant: "",
                    quantity: 1,
                    value: 0,
                    orderDate: new Date().toISOString(),
                    deliveryDate: new Date().toISOString(),
                    batchExpiryDate: undefined,
                    staff: "",
                    supplier: undefined,
                    purchasePaidAmount: undefined,
                    trackPurchase: false,
                }]
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "stockIntakes",
    });

    const addStockIntake = () => {
        append({
            stockVariant: "",
            quantity: 1,
            value: 0,
            orderDate: new Date().toISOString(),
            deliveryDate: new Date().toISOString(),
            batchExpiryDate: undefined,
            staff: "",
            supplier: undefined,
            purchasePaidAmount: undefined,
            trackPurchase: false,
        });
    };

    const duplicateStockIntake = (index: number) => {
        const currentIntake = form.getValues(`stockIntakes.${index}`);
        append({
            ...currentIntake,
            stockVariant: "", 
        });
    };

    const removeStockIntake = (index: number) => {
        if (fields.length > 1) {
            remove(index);
        }
    };

    const onInvalid = useCallback(
        (errors: any) => {
            console.log("These errors occurred:", errors);
            toast({
                variant: "destructive",
                title: "Validation Error",
                description: "Please check all required fields and try again.",
            });
        },
        [toast]
    );

    const submitData = (values: z.infer<typeof MultiStockIntakeSchema>) => {
        console.log("Starting submitData with values:", values);

        // Transform data to array format expected by API
        const payload = values.stockIntakes.map(intake => ({
            quantity: intake.quantity,
            value: intake.value,
            batchExpiryDate: intake.batchExpiryDate,
            deliveryDate: intake.deliveryDate,
            orderDate: intake.orderDate,
            stockVariant: intake.stockVariant,
            staff: intake.staff,
            supplier: intake.supplier,
            ...(intake.trackPurchase && intake.purchasePaidAmount && { 
                purchasePaidAmount: intake.purchasePaidAmount 
            })
        }));

        startTransition(() => {
            if (item) {
                // For updates, we'll need to handle this differently since it's now multiple items
                toast({
                    variant: "destructive",
                    title: "Update Not Supported",
                    description: "Updating multiple stock intakes is not currently supported.",
                });
                return;
            } else {
                createStockIntakeForWarehouse(payload)
                    .then((data) => {
                        if (data) setResponse(data);
                        if (data && data.responseType === "success") {
                            toast({
                                title: "Success",
                                description: data.message,
                            });
                            router.push("/warehouse-stock-intakes");
                        }
                    })
                    .catch((err) => {
                        console.log("Error while creating stock intake: ", err);
                    });
            }
        });
    };

    const validateDates = (orderDate: string, deliveryDate: string) => {
        const order = new Date(orderDate);
        const delivery = new Date(deliveryDate);
        
        if (delivery < order) {
            setError("Delivery date cannot be before order date.");
            return false;
        }
        
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        
        if (delivery > today) {
            setError("Delivery date cannot exceed today's date.");
            return false;
        }
        
        setError(undefined);
        return true;
    };

    const totalItems = fields.length;
    const totalQuantity = form.watch("stockIntakes")?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
    const totalValue = form.watch("stockIntakes")?.reduce((sum, item) => sum + (item.value || 0), 0) || 0;

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {item ? "Update Stock Intake" : "New Stock Intake"}
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Record multiple stock items received into the warehouse
                    </p>
                </div>
                <div className="flex items-center space-x-4">
                    <Badge variant="outline" className="flex items-center space-x-2">
                        <Package className="w-4 h-4" />
                        <span>{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
                    </Badge>
                    <Badge variant="outline" className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4" />
                        <span>{totalQuantity} total qty</span>
                    </Badge>
                    <Badge variant="outline" className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4" />
                        <span>{Intl.NumberFormat().format(totalValue)}</span>
                    </Badge>
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(submitData, onInvalid)} className="space-y-6">
                    <FormError message={error} />

                    {/* Stock Intakes Card */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg font-semibold">Stock Intake Items</CardTitle>
                            <Button
                                type="button"
                                onClick={addStockIntake}
                                disabled={isPending}
                                className="flex items-center space-x-2"
                                size="sm"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Add Item</span>
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {fields.map((field, index) => (
                                <div
                                    key={field.id}
                                    className="border border-gray-200 rounded-lg p-6 space-y-6 bg-gray-50"
                                >
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                                            <Package className="w-4 h-4" />
                                            <span>Stock Intake #{index + 1}</span>
                                        </h4>
                                        <div className="flex items-center space-x-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => duplicateStockIntake(index)}
                                                disabled={isPending}
                                                className="text-blue-600 hover:text-blue-700"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </Button>
                                            {fields.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => removeStockIntake(index)}
                                                    disabled={isPending}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Item Details */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <FormField
                                            control={form.control}
                                            name={`stockIntakes.${index}.stockVariant`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-medium">Stock Item *</FormLabel>
                                                    <FormControl>
                                                        <StockVariantSelectorForWarehouse
                                                            {...field}
                                                            isRequired
                                                            isDisabled={isPending}
                                                            placeholder="Select stock item"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name={`stockIntakes.${index}.quantity`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-medium">Quantity *</FormLabel>
                                                    <FormControl>
                                                        <NumericFormat
                                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                                            value={field.value}
                                                            disabled={isPending}
                                                            placeholder="Enter quantity"
                                                            thousandSeparator={true}
                                                            allowNegative={false}
                                                            onValueChange={(values) => {
                                                                const rawValue = Number(values.value.replace(/,/g, ""));
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
                                            name={`stockIntakes.${index}.value`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-medium">Value *</FormLabel>
                                                    <FormControl>
                                                        <NumericFormat
                                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                                            value={field.value}
                                                            onValueChange={(values) => {
                                                                field.onChange(Number(values.value));
                                                            }}
                                                            thousandSeparator={true}
                                                            placeholder="Enter value of item"
                                                            disabled={isPending}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* Purchase Tracking */}
                                    <div className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name={`stockIntakes.${index}.trackPurchase`}
                                            render={({ field }) => (
                                                <FormItem className="flex items-center space-x-2">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                            disabled={isPending}
                                                        />
                                                    </FormControl>
                                                    <FormLabel className="text-sm font-medium">
                                                        Track purchase amount for this item
                                                    </FormLabel>
                                                </FormItem>
                                            )}
                                        />

                                        {form.watch(`stockIntakes.${index}.trackPurchase`) && (
                                            <FormField
                                                control={form.control}
                                                name={`stockIntakes.${index}.purchasePaidAmount`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-medium flex items-center gap-2">
                                                            <DollarSign className="h-4 w-4" />
                                                            Purchase Amount
                                                        </FormLabel>
                                                        <FormControl>
                                                            <NumericFormat
                                                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                                                value={field.value}
                                                                onValueChange={(values) => {
                                                                    field.onChange(Number(values.value));
                                                                }}
                                                                thousandSeparator={true}
                                                                placeholder="Enter purchase amount"
                                                                disabled={isPending}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        )}
                                    </div>

                                    {/* Date Information */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <FormField
                                            control={form.control}
                                            name={`stockIntakes.${index}.orderDate`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-medium flex items-center gap-2">
                                                        <Calendar className="h-4 w-4" />
                                                        Order Date *
                                                    </FormLabel>
                                                    <FormControl>
                                                        <input
                                                            type="datetime-local"
                                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                                            {...field}
                                                            disabled={isPending}
                                                            max={new Date().toISOString().slice(0, 16)}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name={`stockIntakes.${index}.deliveryDate`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-medium flex items-center gap-2">
                                                        <Clock className="h-4 w-4" />
                                                        Delivery Date *
                                                    </FormLabel>
                                                    <FormControl>
                                                        <input
                                                            type="datetime-local"
                                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                                            {...field}
                                                            disabled={isPending}
                                                            min={form.watch(`stockIntakes.${index}.orderDate`)}
                                                            max={new Date().toISOString().slice(0, 16)}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name={`stockIntakes.${index}.batchExpiryDate`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-medium flex items-center gap-2">
                                                        <Calendar className="h-4 w-4" />
                                                        Batch Expiry (Optional)
                                                    </FormLabel>
                                                    <FormControl>
                                                        <input
                                                            type="datetime-local"
                                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                                            {...field}
                                                            disabled={isPending}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* Personnel & Supplier */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name={`stockIntakes.${index}.staff`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-medium">Staff Member *</FormLabel>
                                                    <FormControl>
                                                        <WarehouseStaffSelectorWidget
                                                            {...field}
                                                            isRequired
                                                            isDisabled={isPending}
                                                            placeholder="Select staff member"
                                                            label="Select staff member"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name={`stockIntakes.${index}.supplier`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-medium">
                                                        Supplier <span className="text-sm text-gray-500">(optional)</span>
                                                    </FormLabel>
                                                    <FormControl>
                                                        <SupplierSelector
                                                            {...field}
                                                            isDisabled={isPending}
                                                            placeholder="Select supplier"
                                                            label="Select supplier"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Status Toggle for Updates */}
                    {item && (
                        <Card>
                            <CardContent className="pt-6">
                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center justify-between">
                                            <div>
                                                <FormLabel className="font-medium">Status</FormLabel>
                                                <p className="text-sm text-gray-500">
                                                    Toggle the current status of this stock intake
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
                            </CardContent>
                        </Card>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                        <CancelButton />
                        <SubmitButton 
                            label={item ? "Update stock intake" : "Record stock intakes"} 
                            isPending={isPending} 
                        />
                    </div>
                </form>
            </Form>
        </div>
    );
}

export default WarehouseStockIntakeForm;