// "use client";
//
// import { useForm, useFieldArray } from "react-hook-form";
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/components/ui/form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { z } from "zod";
// import React, { useCallback, useEffect, useState, useTransition } from "react";
// import { useToast } from "@/hooks/use-toast";
// import CancelButton from "../widgets/cancel-button";
// import { SubmitButton } from "../widgets/submit-button";
// import { Separator } from "@/components/ui/separator";
// import { FormError } from "../widgets/form-error";
// import { FormSuccess } from "../widgets/form-success";
// import { fetchStock } from "@/lib/actions/stock-actions";
// import { Stock } from "@/types/stock/type";
// import { NumericFormat } from "react-number-format";
// import { Textarea } from "../ui/textarea";
// import { useRouter, useSearchParams } from "next/navigation";
// import StockVariantSelector from "../widgets/stock-variant-selector";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import SupplierSelector from "@/components/widgets/supplier-selector";
// import { StockPurchase } from "@/types/stock-purchases/type";
// import {
//   Clock,
//   Copy,
//   Download,
//   Eye,
//   FileText,
//   Mail,
//   Plus,
//   Printer,
//   QrCode,
//   Share2,
//   Trash2,
// } from "lucide-react";
// import DateTimePicker from "@/components/widgets/datetimepicker";
// import { StockPurchaseSchema } from "@/types/stock-purchases/schema";
// import { Button } from "@/components/ui/button";
// import { createStockPurchase } from "@/lib/actions/stock-purchase-actions";
// import { Badge } from "@/components/ui/badge";
// import { format } from "date-fns";
// import { cn } from "@/lib/utils";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
//
// function StockPurchaseForm({
//   item,
// }: {
//   item: StockPurchase | null | undefined;
// }) {
//   const [isPending, startTransition] = useTransition();
//   const [error, setError] = useState<string | undefined>("");
//   const [success, setSuccess] = useState<string | undefined>("");
//   const [stocks, setStocks] = useState<Stock[]>([]);
//   const [shareLink, setShareLink] = useState<string>("");
//   const [showPreview, setShowPreview] = useState<boolean>(false);
//   const [purchaseId, setPurchaseId] = useState<string>("");
//   const [purchaseData, setPurchaseData] = useState<any>();
//   const { toast } = useToast();
//   const router = useRouter();
//
//   const searchParams = useSearchParams();
//   const stockVariantId = searchParams.get("stockVariant");
//   const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(
//     item?.deliveryDate ? new Date(item.deliveryDate) : undefined,
//   );
//
//   useEffect(() => {
//     const getData = async () => {
//       try {
//         const [stockResponse] = await Promise.all([fetchStock()]);
//         setStocks(stockResponse);
//       } catch (error) {
//         console.error("Error fetching data:", error);
//         toast({
//           variant: "destructive",
//           title: "Error",
//           description: "Failed to load form data. Please refresh the page.",
//         });
//       }
//     };
//     getData();
//   }, [toast]);
//
//   // Handle date selection
//   const handleDeliveryDateSelect = (date: Date) => {
//     const today = new Date();
//     today.setHours(23, 59, 59, 999);
//
//     if (date < new Date()) {
//       setError("Delivery date cannot be in the past.");
//       return false;
//     }
//
//     setDeliveryDate(date);
//     return true;
//   };
//
//   // Handle time changes
//   const handleTimeChange = (type: "hour" | "minutes", value: string) => {
//     if (!deliveryDate) return;
//
//     const newDate = new Date(deliveryDate);
//
//     if (type === "hour") {
//       newDate.setHours(Number(value));
//     } else if (type === "minutes") {
//       newDate.setMinutes(Number(value));
//     }
//
//     setDeliveryDate(newDate);
//     form.setValue("deliveryDate", newDate.toISOString());
//   };
//
//   // Initialize form
//   const form = useForm<z.infer<typeof StockPurchaseSchema>>({
//     resolver: zodResolver(StockPurchaseSchema),
//     defaultValues: {
//       supplier: item?.supplier || "",
//       stockIntakePurchaseOrderItems: item?.stockIntakePurchaseOrderItems || [
//         {
//           stockVariantId: stockVariantId || "",
//           quantity: 0,
//         },
//       ],
//       deliveryDate: item?.deliveryDate || new Date().toISOString(),
//       notes: item?.notes || "",
//     },
//   });
//
//   const { fields, append, remove } = useFieldArray({
//     control: form.control,
//     name: "stockIntakePurchaseOrderItems",
//   });
//
//   const addStockItem = () => {
//     append({
//       stockVariantId: "",
//       quantity: 1,
//     });
//   };
//
//   const removeStockItem = (index: number) => {
//     if (fields.length > 1) {
//       remove(index);
//     } else {
//       toast({
//         variant: "destructive",
//         title: "Cannot Remove",
//         description: "At least one stock item is required.",
//       });
//     }
//   };
//
//   const getTotalQuantity = () => {
//     const items = form.getValues("stockIntakePurchaseOrderItems");
//     return items.reduce((total, item) => total + (item.quantity || 0), 0);
//   };
//
//   // Get total items count
//   const getTotalItems = () => {
//     return fields.length;
//   };
//
//   const onInvalid = useCallback(
//     (errors: any) => {
//       console.error("Validation errors:", errors);
//       const firstError = Object.values(errors)[0] as any;
//       toast({
//         variant: "destructive",
//         title: "Validation Error",
//         description: firstError?.message || "Please check all required fields.",
//       });
//     },
//     [toast],
//   );
//
//   const copyShareLink = async () => {
//     if (!shareLink) return;
//
//     try {
//       await navigator.clipboard.writeText(shareLink);
//       toast({
//         title: "Copied!",
//         description: "Share link copied to clipboard.",
//       });
//     } catch (err) {
//       toast({
//         variant: "destructive",
//         title: "Error",
//         description: "Failed to copy link.",
//       });
//     }
//   };
//   const generateShareLink = (id: string) => {
//     if (typeof window === "undefined") return "";
//     return `${window.location.origin}/stock-purchases/share/${id}`;
//   };
//   const sendViaEmail = () => {
//     toast({
//       title: "Email Prepared",
//       description: "Purchase order has been prepared for email sharing.",
//     });
//   };
//   const downloadAsPDF = () => {
//     toast({
//       title: "Download Started",
//       description: "Purchase order PDF is being generated.",
//     });
//   };
//   const printOrder = () => {
//     window.print();
//   };
//
//   const submitData = (values: z.infer<typeof StockPurchaseSchema>) => {
//     setError("");
//     setSuccess("");
//
//     startTransition(() => {
//       if (item) {
//         console.log("Update logic for existing stock purchase");
//         // TODO: Implement updateStockPurchase
//       } else {
//         createStockPurchase(values)
//           .then((data) => {
//             if (data && data.responseType === "success") {
//               const purchaseOrder = data.data;
//               setPurchaseData(purchaseOrder);
//
//               setSuccess(data.message);
//               toast({
//                 title: "Success",
//                 description: data.message,
//               });
//
//               // Show preview after successful creation
//               setShowPreview(true);
//
//               // Generate a purchase ID (in real app, this would come from API)
//               const newPurchaseId = purchaseData.orderNumber;
//               setPurchaseId(newPurchaseId);
//
//               // Generate share link
//               const link = generateShareLink(newPurchaseId);
//               setShareLink(link);
//             } else if (data && data.responseType === "error") {
//               setError(data.message);
//             }
//           })
//           .catch((err) => {
//             console.error("Error creating stock purchase:", err);
//             setError("An unexpected error occurred. Please try again.");
//             toast({
//               variant: "destructive",
//               title: "Error",
//               description: "Failed to create stock purchase.",
//             });
//           });
//       }
//     });
//   };
//
//   // Preview Component
//   const PreviewSection = () => {
//     const values = form.getValues();
//     const totalQuantity = getTotalQuantity();
//     const totalItems = getTotalItems();
//
//     return (
//       <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
//         <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
//           <div className="flex flex-col h-full">
//             {/* Header */}
//             <div className="border-b px-6 py-4">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
//                     Local Purchase Order Preview
//                   </h2>
//                   <p className="text-sm text-gray-600 dark:text-gray-400">
//                     Review and share your purchase order
//                   </p>
//                 </div>
//                 <Button
//                   variant="ghost"
//                   size="icon"
//                   onClick={() => setShowPreview(false)}
//                 >
//                   <X className="h-4 w-4" />
//                 </Button>
//               </div>
//             </div>
//
//             {/* Content */}
//             <div className="flex-1 overflow-y-auto p-6">
//               <Tabs defaultValue="preview" className="w-full">
//                 <TabsList className="grid w-full grid-cols-2">
//                   <TabsTrigger value="preview" className="gap-2">
//                     <Eye className="h-4 w-4" />
//                     Preview
//                   </TabsTrigger>
//                   <TabsTrigger value="share" className="gap-2">
//                     <Share2 className="h-4 w-4" />
//                     Share
//                   </TabsTrigger>
//                 </TabsList>
//
//                 <TabsContent value="preview" className="space-y-6 mt-6">
//                   {/* Purchase Order Header */}
//                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                     <div className="space-y-2">
//                       <h3 className="text-lg font-semibold">Purchase Order</h3>
//                       <div className="space-y-1">
//                         <p className="text-sm text-gray-500">Order Number</p>
//                         <p className="font-mono font-bold text-lg">
//                           {purchaseData.orderNumber}
//                         </p>
//                       </div>
//                     </div>
//
//                     <div className="space-y-2">
//                       <h3 className="text-lg font-semibold">Supplier</h3>
//                       <div className="space-y-1">
//                         <p className="text-sm text-gray-500">Name</p>
//                         <p className="font-medium">
//                           {purchaseData.supplierName}
//                         </p>
//                       </div>
//                       <div className="space-y-1">
//                         <p className="text-sm text-gray-500">Email</p>
//                         <p className="font-medium">
//                           {purchaseData.supplierEmail}
//                         </p>
//                       </div>
//                       <div className="space-y-1">
//                         <p className="text-sm text-gray-500">Phone Number</p>
//                         <p className="font-medium">
//                           {purchaseData.supplierPhoneNumber}
//                         </p>
//                       </div>
//                     </div>
//
//                     <div className="space-y-2">
//                       <h3 className="text-lg font-semibold">Delivery</h3>
//                       <div className="space-y-1">
//                         <p className="text-sm text-gray-500">Expected Date</p>
//                         <p className="font-medium">
//                           {purchaseData && purchaseData.deliveryDate
//                             ? format(purchaseData.deliveryDate, "PPP")
//                             : "Not set"}
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//
//                   {/* Order Summary */}
//                   <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-4">
//                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//                       <div className="text-center p-3">
//                         <p className="text-sm text-gray-600 dark:text-gray-400">
//                           Total Items
//                         </p>
//                         <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
//                           {totalItems}
//                         </p>
//                       </div>
//                       <div className="text-center p-3">
//                         <p className="text-sm text-gray-600 dark:text-gray-400">
//                           Total Quantity
//                         </p>
//                         <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
//                           {totalQuantity}
//                         </p>
//                       </div>
//                       <div className="text-center p-3">
//                         <p className="text-sm text-gray-600 dark:text-gray-400">
//                           Status
//                         </p>
//                         <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
//                           {purchaseData.status}
//                         </Badge>
//                       </div>
//                       <div className="text-center p-3">
//                         <p className="text-sm text-gray-600 dark:text-gray-400">
//                           Created
//                         </p>
//                         <p className="text-sm font-medium">
//                           {format(new Date(), "PP")}
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//
//                   {/* Items Table */}
//                   <div className="border rounded-lg overflow-hidden">
//                     <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3">
//                       <h3 className="font-semibold">Order Items</h3>
//                     </div>
//                     <div className="divide-y">
//                       {values.stockIntakePurchaseOrderItems?.map(
//                         (item, index) => (
//                           <div
//                             key={index}
//                             className="grid grid-cols-12 gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50"
//                           >
//                             <div className="col-span-8">
//                               <p className="font-medium">Item {index + 1}</p>
//                               <p className="text-sm text-gray-600 dark:text-gray-400">
//                                 {item.stockVariantId ||
//                                   "Stock variant selected"}
//                               </p>
//                             </div>
//                             <div className="col-span-3">
//                               <p className="text-sm text-gray-500">Quantity</p>
//                               <p className="font-medium">
//                                 {item.quantity || 0}
//                               </p>
//                             </div>
//                             <div className="col-span-1 flex items-center justify-end">
//                               <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
//                                 <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
//                                   {index + 1}
//                                 </span>
//                               </div>
//                             </div>
//                           </div>
//                         ),
//                       )}
//                     </div>
//                   </div>
//
//                   {/* Notes */}
//                   {values.notes && (
//                     <div className="border rounded-lg p-4">
//                       <h3 className="font-semibold mb-2">
//                         Special Instructions
//                       </h3>
//                       <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
//                         {values.notes}
//                       </p>
//                     </div>
//                   )}
//                 </TabsContent>
//
//                 <TabsContent value="share" className="space-y-6 mt-6">
//                   {/* Share Link Section */}
//                   <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl p-6">
//                     <div className="flex flex-col md:flex-row items-center gap-4">
//                       <div className="flex-1">
//                         <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
//                           Share Purchase Order
//                         </h3>
//                         <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
//                           Share this link with your supplier to view the
//                           purchase order
//                         </p>
//                         <div className="flex items-center gap-2">
//                           <div className="flex-1 bg-white dark:bg-gray-800 border rounded-lg p-3">
//                             <p className="text-sm font-mono truncate">
//                               {shareLink}
//                             </p>
//                           </div>
//                           <Button onClick={copyShareLink} className="gap-2">
//                             <Copy className="h-4 w-4" />
//                             Copy
//                           </Button>
//                         </div>
//                       </div>
//                       <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border">
//                         <QrCode className="h-24 w-24 text-gray-700 dark:text-gray-300" />
//                       </div>
//                     </div>
//                   </div>
//
//                   {/* Share Options */}
//                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                     <Button
//                       variant="outline"
//                       className="h-auto py-4 flex flex-col gap-2"
//                       onClick={sendViaEmail}
//                     >
//                       <Mail className="h-6 w-6" />
//                       <span>Send via Email</span>
//                       <p className="text-xs text-gray-500">
//                         Share directly with supplier
//                       </p>
//                     </Button>
//
//                     <Button
//                       variant="outline"
//                       className="h-auto py-4 flex flex-col gap-2"
//                       onClick={downloadAsPDF}
//                     >
//                       <Download className="h-6 w-6" />
//                       <span>Download PDF</span>
//                       <p className="text-xs text-gray-500">
//                         Offline copy for records
//                       </p>
//                     </Button>
//
//                     <Button
//                       variant="outline"
//                       className="h-auto py-4 flex flex-col gap-2"
//                       onClick={printOrder}
//                     >
//                       <Printer className="h-6 w-6" />
//                       <span>Print Order</span>
//                       <p className="text-xs text-gray-500">
//                         Physical copy for documentation
//                       </p>
//                     </Button>
//                   </div>
//
//                   {/* Security Note */}
//                   <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
//                     <div className="flex items-start gap-3">
//                       <ShieldAlert className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
//                       <div>
//                         <h4 className="font-medium text-yellow-800 dark:text-yellow-300">
//                           Security Notice
//                         </h4>
//                         <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
//                           This link provides read-only access to the purchase
//                           order. Do not share sensitive login credentials along
//                           with this link.
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                 </TabsContent>
//               </Tabs>
//             </div>
//
//             {/* Footer */}
//             <div className="border-t px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
//               <div className="flex items-center justify-between">
//                 <Button
//                   variant="outline"
//                   onClick={() => {
//                     setShowPreview(false);
//                     router.push("/stock-purchases");
//                   }}
//                 >
//                   View All Purchases
//                 </Button>
//                 <div className="flex gap-2">
//                   <Button
//                     variant="outline"
//                     onClick={() => setShowPreview(false)}
//                   >
//                     Close Preview
//                   </Button>
//                   <Button
//                     onClick={() => {
//                       copyShareLink();
//                       setShowPreview(false);
//                     }}
//                   >
//                     <Copy className="h-4 w-4 mr-2" />
//                     Copy & Close
//                   </Button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   };
//
//   // Add missing icon imports
//   const X = ({ className }: { className?: string }) => (
//     <svg
//       className={className}
//       fill="none"
//       stroke="currentColor"
//       viewBox="0 0 24 24"
//     >
//       <path
//         strokeLinecap="round"
//         strokeLinejoin="round"
//         strokeWidth={2}
//         d="M6 18L18 6M6 6l12 12"
//       />
//     </svg>
//   );
//
//   const ShieldAlert = ({ className }: { className?: string }) => (
//     <svg
//       className={className}
//       fill="none"
//       stroke="currentColor"
//       viewBox="0 0 24 24"
//     >
//       <path
//         strokeLinecap="round"
//         strokeLinejoin="round"
//         strokeWidth={2}
//         d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.404 16.5c-.77.833.192 2.5 1.732 2.5z"
//       />
//     </svg>
//   );
//
//   return (
//     <>
//       <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
//         <Card className="shadow-lg border-0">
//           <CardHeader className="space-y-1 pb-6">
//             <div className="flex items-center justify-between">
//               <div>
//                 <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
//                   {item ? "Edit Stock Purchase" : "New Stock Purchase"}
//                 </CardTitle>
//                 <p className="text-sm text-muted-foreground">
//                   Purchase multiple stocks from trusted suppliers
//                 </p>
//               </div>
//               {showPreview && (
//                 <Button
//                   variant="outline"
//                   onClick={() => setShowPreview(true)}
//                   className="gap-2"
//                 >
//                   <Eye className="h-4 w-4" />
//                   View Preview
//                 </Button>
//               )}
//             </div>
//           </CardHeader>
//
//           <CardContent>
//             <Form {...form}>
//               <form
//                 onSubmit={form.handleSubmit(submitData, onInvalid)}
//                 className="space-y-6"
//               >
//                 {/* Error and Success Messages */}
//                 {error && <FormError message={error} />}
//                 {success && <FormSuccess message={success} />}
//
//                 {/* Quick Share Section */}
//                 {shareLink && !showPreview && (
//                   <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
//                     <div className="flex items-center justify-between">
//                       <div className="flex items-center gap-3">
//                         <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
//                           <Share2 className="h-5 w-5 text-green-600 dark:text-green-400" />
//                         </div>
//                         <div>
//                           <p className="font-medium text-green-800 dark:text-green-300">
//                             Purchase Order Created Successfully!
//                           </p>
//                           <p className="text-sm text-green-700 dark:text-green-400">
//                             Share this link with your supplier
//                           </p>
//                         </div>
//                       </div>
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={() => setShowPreview(true)}
//                         className="gap-2 border-green-300 dark:border-green-700"
//                       >
//                         <Eye className="h-4 w-4" />
//                         View & Share
//                       </Button>
//                     </div>
//                   </div>
//                 )}
//
//                 {/* Order Summary */}
//                 <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-4 rounded-xl">
//                   <div className="flex items-center gap-4">
//                     <div className="text-center">
//                       <p className="text-sm font-medium text-muted-foreground">
//                         Total Items
//                       </p>
//                       <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
//                         {getTotalItems()}
//                       </p>
//                     </div>
//                     <Separator orientation="vertical" className="h-10" />
//                     <div className="text-center">
//                       <p className="text-sm font-medium text-muted-foreground">
//                         Total Quantity
//                       </p>
//                       <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
//                         {getTotalQuantity()}
//                       </p>
//                     </div>
//                   </div>
//                   <Button
//                     type="button"
//                     variant="outline"
//                     size="sm"
//                     onClick={addStockItem}
//                     className="flex items-center gap-2"
//                   >
//                     <Plus className="h-4 w-4" />
//                     Add Item
//                   </Button>
//                 </div>
//
//                 {/* Stock Items Section */}
//                 <div className="space-y-4">
//                   <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
//                     Stock Items <span className="text-red-500">*</span>
//                   </h3>
//
//                   <div className="space-y-4">
//                     {fields.map((field, index) => (
//                       <div
//                         key={field.id}
//                         className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border rounded-lg bg-white dark:bg-gray-800/50 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
//                       >
//                         {/* Stock Variant */}
//                         <div className="md:col-span-7">
//                           <FormField
//                             control={form.control}
//                             name={`stockIntakePurchaseOrderItems.${index}.stockVariantId`}
//                             render={({ field }) => (
//                               <FormItem>
//                                 <FormLabel className="text-sm">
//                                   Stock Item{" "}
//                                   {fields.length > 1 && `#${index + 1}`}
//                                 </FormLabel>
//                                 <FormControl>
//                                   <StockVariantSelector
//                                     {...field}
//                                     value={field.value}
//                                     isDisabled={
//                                       isPending || !!item || showPreview
//                                     }
//                                     onChange={(value) => {
//                                       field.onChange(value);
//                                     }}
//                                     placeholder="Select stock item"
//                                   />
//                                 </FormControl>
//                                 <FormMessage />
//                               </FormItem>
//                             )}
//                           />
//                         </div>
//
//                         {/* Quantity */}
//                         <div className="md:col-span-4">
//                           <FormField
//                             control={form.control}
//                             name={`stockIntakePurchaseOrderItems.${index}.quantity`}
//                             render={({ field }) => (
//                               <FormItem>
//                                 <FormLabel className="text-sm">
//                                   Quantity
//                                 </FormLabel>
//                                 <FormControl>
//                                   <NumericFormat
//                                     className={cn(
//                                       "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
//                                       "file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground",
//                                       "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
//                                       "disabled:cursor-not-allowed disabled:opacity-50",
//                                       showPreview &&
//                                         "bg-gray-100 dark:bg-gray-800",
//                                     )}
//                                     value={field.value}
//                                     disabled={isPending || showPreview}
//                                     placeholder="Enter quantity"
//                                     thousandSeparator={true}
//                                     allowNegative={false}
//                                     onValueChange={(values) => {
//                                       const rawValue = Number(
//                                         values.value.replace(/,/g, ""),
//                                       );
//                                       field.onChange(rawValue);
//                                     }}
//                                   />
//                                 </FormControl>
//                                 <FormMessage />
//                               </FormItem>
//                             )}
//                           />
//                         </div>
//
//                         {/* Remove Button */}
//                         <div className="md:col-span-1 flex items-end">
//                           <Button
//                             type="button"
//                             variant="ghost"
//                             size="icon"
//                             onClick={() => removeStockItem(index)}
//                             disabled={fields.length <= 1 || showPreview}
//                             className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
//                           >
//                             <Trash2 className="h-4 w-4" />
//                           </Button>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//
//                 <Separator />
//
//                 {/* Supplier & Delivery */}
//                 <div className="space-y-4">
//                   <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
//                     Supplier & Delivery
//                   </h3>
//
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <FormField
//                       control={form.control}
//                       name="supplier"
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel>
//                             Supplier <span className="text-red-500">*</span>
//                           </FormLabel>
//                           <FormControl>
//                             <SupplierSelector
//                               {...field}
//                               isDisabled={!!item || isPending || showPreview}
//                               placeholder="Select supplier"
//                               label="Select supplier"
//                             />
//                           </FormControl>
//                           <FormMessage />
//                         </FormItem>
//                       )}
//                     />
//                     <FormField
//                       control={form.control}
//                       name="deliveryDate"
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel className="font-medium flex items-center gap-2">
//                             <Clock className="h-4 w-4" />
//                             Expected Delivery Date{" "}
//                             <span className="text-red-500">*</span>
//                           </FormLabel>
//                           <FormControl>
//                             <DateTimePicker
//                               field={field}
//                               date={deliveryDate}
//                               setDate={setDeliveryDate}
//                               handleTimeChange={handleTimeChange}
//                               onDateSelect={handleDeliveryDateSelect}
//                               minDate={new Date()}
//                               disabled={!!item || showPreview}
//                             />
//                           </FormControl>
//                           <FormMessage />
//                         </FormItem>
//                       )}
//                     />
//                   </div>
//                 </div>
//
//                 <Separator />
//
//                 {/* Custom Instructions */}
//                 <div className="space-y-4">
//                   <FormField
//                     control={form.control}
//                     name="notes"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Custom Instructions (Optional)</FormLabel>
//                         <FormControl>
//                           <Textarea
//                             placeholder="Add any special instructions for the supplier (e.g., packaging requirements, delivery instructions, quality specifications)..."
//                             {...field}
//                             disabled={isPending || showPreview}
//                             maxLength={500}
//                             className={cn(
//                               "min-h-[100px] resize-none",
//                               showPreview && "bg-gray-100 dark:bg-gray-800",
//                             )}
//                           />
//                         </FormControl>
//                         <p className="text-xs text-muted-foreground">
//                           {field.value?.length || 0}/500 characters
//                         </p>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                 </div>
//
//                 {/* Action Buttons */}
//                 <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4">
//                   <div className="flex items-center gap-3">
//                     <CancelButton />
//                     {shareLink && !showPreview && (
//                       <Button
//                         type="button"
//                         variant="outline"
//                         onClick={() => router.push("/stock-purchases")}
//                       >
//                         View All Purchases
//                       </Button>
//                     )}
//                   </div>
//                   <SubmitButton
//                     isPending={isPending}
//                     label={item ? "Update Purchase" : "Create Purchase Order"}
//                   />
//                 </div>
//               </form>
//             </Form>
//           </CardContent>
//         </Card>
//       </div>
//
//       {/* Preview Modal */}
//       {showPreview && <PreviewSection />}
//     </>
//   );
// }
//
// export default StockPurchaseForm;

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
import CancelButton from "../widgets/cancel-button";
import { SubmitButton } from "../widgets/submit-button";
import { Separator } from "@/components/ui/separator";
import { FormError } from "../widgets/form-error";
import { FormSuccess } from "../widgets/form-success";
import { fetchStock } from "@/lib/actions/stock-actions";
import { Stock } from "@/types/stock/type";
import { NumericFormat } from "react-number-format";
import { Textarea } from "../ui/textarea";
import { useRouter, useSearchParams } from "next/navigation";
import StockVariantSelector from "../widgets/stock-variant-selector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SupplierSelector from "@/components/widgets/supplier-selector";
import { StockPurchase } from "@/types/stock-purchases/type";
import {
  Clock,
  Copy,
  Download,
  Eye,
  Mail,
  Phone,
  Plus,
  Printer,
  QrCode,
  Share2,
  ShoppingBag,
  Trash2,
  Calendar,
  User,
  Package,
  FileText,
  CheckCircle,
} from "lucide-react";
import DateTimePicker from "@/components/widgets/datetimepicker";
import { StockPurchaseSchema } from "@/types/stock-purchases/schema";
import { Button } from "@/components/ui/button";
import { createStockPurchase } from "@/lib/actions/stock-purchase-actions";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

function StockPurchaseForm({
  item,
}: {
  item: StockPurchase | null | undefined;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [shareLink, setShareLink] = useState<string>("");
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [purchaseId, setPurchaseId] = useState<string>("");
  const [purchaseData, setPurchaseData] = useState<any>();
  const { toast } = useToast();
  const router = useRouter();

  const searchParams = useSearchParams();
  const stockVariantId = searchParams.get("stockVariant");
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(
    item?.deliveryDate ? new Date(item.deliveryDate) : undefined,
  );

  useEffect(() => {
    const getData = async () => {
      try {
        const [stockResponse] = await Promise.all([fetchStock()]);
        setStocks(stockResponse);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load form data. Please refresh the page.",
        });
      }
    };
    getData();
  }, [toast]);

  // Handle date selection
  const handleDeliveryDateSelect = (date: Date) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (date < new Date()) {
      setError("Delivery date cannot be in the past.");
      return false;
    }

    setDeliveryDate(date);
    return true;
  };

  // Handle time changes
  const handleTimeChange = (type: "hour" | "minutes", value: string) => {
    if (!deliveryDate) return;

    const newDate = new Date(deliveryDate);

    if (type === "hour") {
      newDate.setHours(Number(value));
    } else if (type === "minutes") {
      newDate.setMinutes(Number(value));
    }

    setDeliveryDate(newDate);
    form.setValue("deliveryDate", newDate.toISOString());
  };

  // Initialize form
  const form = useForm<z.infer<typeof StockPurchaseSchema>>({
    resolver: zodResolver(StockPurchaseSchema),
    defaultValues: {
      supplier: item?.supplier || "",
      stockIntakePurchaseOrderItems: item?.stockIntakePurchaseOrderItems || [
        {
          stockVariantId: stockVariantId || "",
          quantity: 0,
        },
      ],
      deliveryDate: item?.deliveryDate || new Date().toISOString(),
      notes: item?.notes || "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "stockIntakePurchaseOrderItems",
  });

  const addStockItem = () => {
    append({
      stockVariantId: "",
      quantity: 1,
    });
  };

  const removeStockItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    } else {
      toast({
        variant: "destructive",
        title: "Cannot Remove",
        description: "At least one stock item is required.",
      });
    }
  };

  const getTotalQuantity = () => {
    const items = form.getValues("stockIntakePurchaseOrderItems");
    return items.reduce((total, item) => total + (item.quantity || 0), 0);
  };

  // Get total items count
  const getTotalItems = () => {
    return fields.length;
  };

  const onInvalid = useCallback(
    (errors: any) => {
      console.error("Validation errors:", errors);
      const firstError = Object.values(errors)[0] as any;
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: firstError?.message || "Please check all required fields.",
      });
    },
    [toast],
  );

  const copyShareLink = async () => {
    if (!shareLink) return;

    try {
      await navigator.clipboard.writeText(shareLink);
      toast({
        title: "Copied!",
        description: "Share link copied to clipboard.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy link.",
      });
    }
  };

  const generateShareLink = (id: string) => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/stock-purchases/share/${id}`;
  };

  const sendViaEmail = () => {
    toast({
      title: "Email Prepared",
      description: "Purchase order has been prepared for email sharing.",
    });
  };

  const downloadAsPDF = () => {
    toast({
      title: "Download Started",
      description: "Purchase order PDF is being generated.",
    });
  };

  const printOrder = () => {
    window.print();
  };

  const submitData = (values: z.infer<typeof StockPurchaseSchema>) => {
    setError("");
    setSuccess("");

    startTransition(() => {
      if (item) {
        console.log("Update logic for existing stock purchase");
        // TODO: Implement updateStockPurchase
      } else {
        createStockPurchase(values)
          .then((data) => {
            if (data && data.responseType === "success") {
              const purchaseOrder = data.data;
              setPurchaseData(purchaseOrder);
              setSuccess(data.message);

              toast({
                title: "Success",
                description: data.message,
              });

              // Show preview after successful creation
              setShowPreview(true);

              // Set purchase ID from API response
              const newPurchaseId = purchaseOrder.orderNumber;
              setPurchaseId(newPurchaseId);

              // Generate share link
              const link = generateShareLink(newPurchaseId);
              setShareLink(link);
            } else if (data && data.responseType === "error") {
              setError(data.message);
            }
          })
          .catch((err) => {
            console.error("Error creating stock purchase:", err);
            setError("An unexpected error occurred. Please try again.");
            toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to create stock purchase.",
            });
          });
      }
    });
  };

  // Enhanced Preview Component with better scroll handling
  const PreviewSection = () => {
    const values = form.getValues();
    const totalQuantity = getTotalQuantity();
    const totalItems = getTotalItems();

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
          <div className="flex flex-col h-full">
            {/* Header - Sticky */}
            <div className="border-b border-gray-200 dark:border-gray-800 px-6 py-4 bg-white dark:bg-gray-900 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                    <ShoppingBag className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Local Purchase Order
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <span>Order #{purchaseData?.orderNumber}</span>
                      <span>•</span>
                      <span>Preview & Share</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {purchaseData?.status || "SUBMITTED"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPreview(false)}
                    className="h-9 w-9"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Content with Scroll Area */}
            <div className="flex-1 min-h-0">
              <ScrollArea className="h-full">
                <div className="p-6">
                  <Tabs defaultValue="preview" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                      <TabsTrigger value="preview" className="gap-2">
                        <Eye className="h-4 w-4" />
                        Order Preview
                      </TabsTrigger>
                      <TabsTrigger value="share" className="gap-2">
                        <Share2 className="h-4 w-4" />
                        Share Options
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="preview" className="space-y-6 mt-0">
                      {/* Order Summary Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <Card className="border-l-4 border-l-blue-500">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                  Expected Delivery
                                </p>
                                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                  {purchaseData?.deliveryDate
                                    ? format(
                                        new Date(purchaseData.deliveryDate),
                                        "PP",
                                      )
                                    : "Not set"}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-green-500">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <Package className="h-5 w-5 text-green-600 dark:text-green-400" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                  Items & Quantity
                                </p>
                                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                  {totalItems} items • {totalQuantity} units
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-purple-500">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                  Order Number
                                </p>
                                <p className="text-lg font-semibold text-gray-900 dark:text-white font-mono">
                                  {purchaseData?.orderNumber}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Supplier Information */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Supplier Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Company Name
                              </p>
                              <p className="text-base font-semibold text-gray-900 dark:text-white">
                                {purchaseData?.supplierName}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Contact Email
                              </p>
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-gray-400" />
                                <p className="text-base text-gray-900 dark:text-white">
                                  {purchaseData?.supplierEmail}
                                </p>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Phone Number
                              </p>
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-gray-400" />
                                <p className="text-base text-gray-900 dark:text-white">
                                  {purchaseData?.supplierPhoneNumber}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Order Items Table with Scroll */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Order Items ({totalItems})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="border rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  <tr className="bg-gray-50 dark:bg-gray-800 border-b">
                                    <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300 w-12">
                                      #
                                    </th>
                                    <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300 min-w-[300px]">
                                      Item Description
                                    </th>
                                    <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300 w-32">
                                      Item Code
                                    </th>
                                    <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300 w-24">
                                      Quantity
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {purchaseData?.stockIntakePurchaseOrderItems?.map(
                                    (item: any, index: number) => (
                                      <tr
                                        key={item.id}
                                        className={cn(
                                          "border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors",
                                          index % 2 === 0
                                            ? "bg-white dark:bg-gray-900"
                                            : "bg-gray-50/50 dark:bg-gray-900/50",
                                        )}
                                      >
                                        <td className="p-4">
                                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium">
                                            {index + 1}
                                          </div>
                                        </td>
                                        <td className="p-4">
                                          <div>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                              {item.stockName}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                              {item.stockVariantName}
                                            </p>
                                          </div>
                                        </td>
                                        <td className="p-4">
                                          <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono">
                                            {item.stockVariant?.slice(0, 8)}...
                                          </code>
                                        </td>
                                        <td className="p-4">
                                          <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/20 rounded flex items-center justify-center">
                                              <span className="text-blue-600 dark:text-blue-400 font-medium">
                                                {item.quantity}
                                              </span>
                                            </div>
                                            <span className="text-sm text-gray-500">
                                              units
                                            </span>
                                          </div>
                                        </td>
                                      </tr>
                                    ),
                                  )}
                                </tbody>
                                <tfoot>
                                  <tr className="bg-gray-50 dark:bg-gray-800 border-t">
                                    <td
                                      colSpan={3}
                                      className="p-4 text-right font-semibold"
                                    >
                                      Total Quantity:
                                    </td>
                                    <td className="p-4">
                                      <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                          <span className="text-white font-bold">
                                            {totalQuantity}
                                          </span>
                                        </div>
                                        <span className="text-sm text-gray-500">
                                          units
                                        </span>
                                      </div>
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Notes Section */}
                      {purchaseData?.notes && (
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <FileText className="h-5 w-5" />
                              Special Instructions
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {purchaseData.notes}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>

                    <TabsContent value="share" className="space-y-6 mt-0">
                      {/* Share Link Card */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Share2 className="h-5 w-5" />
                            Share Purchase Order
                          </CardTitle>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Share this purchase order with your supplier
                          </p>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-6">
                            <div className="flex flex-col lg:flex-row items-center gap-6">
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                  Shareable Link
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                  Copy this link and send it to your supplier.
                                  They will be able to view the purchase order
                                  details.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <div className="flex-1 bg-white dark:bg-gray-800 border rounded-lg p-3 overflow-hidden">
                                    <p className="text-sm font-mono truncate select-all">
                                      {shareLink}
                                    </p>
                                  </div>
                                  <Button
                                    onClick={copyShareLink}
                                    className="gap-2 whitespace-nowrap"
                                  >
                                    <Copy className="h-4 w-4" />
                                    Copy Link
                                  </Button>
                                </div>
                              </div>
                              <div className="flex flex-col items-center gap-3">
                                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
                                  <QrCode className="h-32 w-32 text-gray-700 dark:text-gray-300" />
                                </div>
                                <p className="text-xs text-gray-500 text-center">
                                  Scan QR code for mobile sharing
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Share Actions */}
                          <div>
                            <h3 className="text-lg font-semibold mb-4">
                              Share via
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <Button
                                variant="outline"
                                className="h-auto py-4 flex flex-col gap-3"
                                onClick={sendViaEmail}
                              >
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                  <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                  <span className="font-medium">Email</span>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Send directly to supplier's email
                                  </p>
                                </div>
                              </Button>

                              <Button
                                variant="outline"
                                className="h-auto py-4 flex flex-col gap-3"
                                onClick={downloadAsPDF}
                              >
                                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                  <Download className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                  <span className="font-medium">
                                    PDF Export
                                  </span>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Download as printable document
                                  </p>
                                </div>
                              </Button>

                              <Button
                                variant="outline"
                                className="h-auto py-4 flex flex-col gap-3"
                                onClick={printOrder}
                              >
                                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                  <Printer className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                  <span className="font-medium">Print</span>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Physical copy for documentation
                                  </p>
                                </div>
                              </Button>
                            </div>
                          </div>

                          {/* Security Notice */}
                          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                              <div>
                                <h4 className="font-medium text-amber-800 dark:text-amber-300 mb-1">
                                  Security Information
                                </h4>
                                <ul className="text-sm text-amber-700 dark:text-amber-400 space-y-1 list-disc pl-4">
                                  <li>
                                    This link provides read-only access to
                                    purchase order details
                                  </li>
                                  <li>
                                    No sensitive account information is shared
                                  </li>
                                  <li>
                                    The link expires after 30 days automatically
                                  </li>
                                  <li>
                                    Suppliers cannot modify the order through
                                    this link
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              </ScrollArea>
            </div>

            {/* Footer - Sticky */}
            <div className="border-t border-gray-200 dark:border-gray-800 px-6 py-4 bg-white dark:bg-gray-900 sticky bottom-0">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p>Order created on {format(new Date(), "PPP 'at' p")}</p>
                  <p className="text-xs">
                    Share link: {shareLink ? "Active" : "Not generated"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPreview(false);
                      router.push("/stock-purchases");
                    }}
                    className="gap-2"
                  >
                    View All Purchases
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowPreview(false)}
                  >
                    Close Preview
                  </Button>
                  <Button
                    onClick={() => {
                      copyShareLink();
                      setShowPreview(false);
                    }}
                    className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Copy className="h-4 w-4" />
                    Copy & Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Add missing icon imports
  const X = ({ className }: { className?: string }) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );

  const ShieldAlert = ({ className }: { className?: string }) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.404 16.5c-.77.833.192 2.5 1.732 2.5z"
      />
    </svg>
  );

  return (
    <>
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-1 pb-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                  {item ? "Edit Local Purchase" : "New Local Purchase"}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Purchase multiple stocks from trusted suppliers
                </p>
              </div>
              {showPreview && (
                <Button
                  variant="outline"
                  onClick={() => setShowPreview(true)}
                  className="gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View Preview
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(submitData, onInvalid)}
                className="space-y-6"
              >
                {/* Error and Success Messages */}
                {error && <FormError message={error} />}
                {success && <FormSuccess message={success} />}

                {/* Success Banner */}
                {success && !showPreview && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 rounded-xl p-4 animate-in fade-in slide-in-from-top-5 duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="font-medium text-green-800 dark:text-green-300">
                            Purchase Order Created!
                          </p>
                          <p className="text-sm text-green-700 dark:text-green-400">
                            Order #{purchaseData?.orderNumber} has been created
                            successfully
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push("/stock-purchases")}
                          className="border-green-300 dark:border-green-700"
                        >
                          View All
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => setShowPreview(true)}
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Preview & Share
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Order Summary */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-4 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-sm font-medium text-muted-foreground">
                        Total Items
                      </p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {getTotalItems()}
                      </p>
                    </div>
                    <Separator orientation="vertical" className="h-10" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-muted-foreground">
                        Total Quantity
                      </p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {getTotalQuantity()}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addStockItem}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Item
                  </Button>
                </div>

                {/* Stock Items Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Stock Items <span className="text-red-500">*</span>
                  </h3>

                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border rounded-lg bg-white dark:bg-gray-800/50 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                      >
                        {/* Stock Variant */}
                        <div className="md:col-span-7">
                          <FormField
                            control={form.control}
                            name={`stockIntakePurchaseOrderItems.${index}.stockVariantId`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm">
                                  Stock Item{" "}
                                  {fields.length > 1 && `#${index + 1}`}
                                </FormLabel>
                                <FormControl>
                                  <StockVariantSelector
                                    {...field}
                                    value={field.value}
                                    isDisabled={
                                      isPending || !!item || showPreview
                                    }
                                    onChange={(value) => {
                                      field.onChange(value);
                                    }}
                                    placeholder="Select stock item"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Quantity */}
                        <div className="md:col-span-4">
                          <FormField
                            control={form.control}
                            name={`stockIntakePurchaseOrderItems.${index}.quantity`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm">
                                  Quantity
                                </FormLabel>
                                <FormControl>
                                  <NumericFormat
                                    className={cn(
                                      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                                      "file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground",
                                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                      "disabled:cursor-not-allowed disabled:opacity-50",
                                      showPreview &&
                                        "bg-gray-100 dark:bg-gray-800",
                                    )}
                                    value={field.value}
                                    disabled={isPending || showPreview}
                                    placeholder="Enter quantity"
                                    thousandSeparator={true}
                                    allowNegative={false}
                                    onValueChange={(values) => {
                                      const rawValue = Number(
                                        values.value.replace(/,/g, ""),
                                      );
                                      field.onChange(rawValue);
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Remove Button */}
                        <div className="md:col-span-1 flex items-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeStockItem(index)}
                            disabled={fields.length <= 1 || showPreview}
                            className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Supplier & Delivery */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Supplier & Delivery
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="supplier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Supplier <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <SupplierSelector
                              {...field}
                              isDisabled={!!item || isPending || showPreview}
                              placeholder="Select supplier"
                              label="Select supplier"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="deliveryDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-medium flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Expected Delivery Date{" "}
                            <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <DateTimePicker
                              field={field}
                              date={deliveryDate}
                              setDate={setDeliveryDate}
                              handleTimeChange={handleTimeChange}
                              onDateSelect={handleDeliveryDateSelect}
                              minDate={new Date()}
                              disabled={!!item || showPreview}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Custom Instructions */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custom Instructions (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Add any special instructions for the supplier (e.g., packaging requirements, delivery instructions, quality specifications)..."
                            {...field}
                            disabled={isPending || showPreview}
                            maxLength={500}
                            className={cn(
                              "min-h-[100px] resize-none",
                              showPreview && "bg-gray-100 dark:bg-gray-800",
                            )}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          {field.value?.length || 0}/500 characters
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4">
                  <div className="flex items-center gap-3">
                    <CancelButton />
                    {shareLink && !showPreview && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push("/stock-purchases")}
                      >
                        View All Purchases
                      </Button>
                    )}
                  </div>
                  <SubmitButton
                    isPending={isPending}
                    label={item ? "Update Purchase" : "Create Purchase Order"}
                  />
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Preview Modal */}
      {showPreview && <PreviewSection />}
    </>
  );
}

export default StockPurchaseForm;
