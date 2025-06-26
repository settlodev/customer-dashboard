'use client';
import { useState, useCallback, useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { CalendarIcon, PlusCircle, X} from "lucide-react";
import { format } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";


import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { createPurchases, updatePurchases } from "@/lib/actions/warehouse/purchases-action";
import { FormError } from "@/components/widgets/form-error";
import SupplierSelector from "@/components/widgets/supplier-selector";
import ProductSelector from "@/components/widgets/product-selector";
import CancelButton from "@/components/widgets/cancel-button";
import SubmitButton from "@/components/widgets/submit-button";
import { Purchase } from "@/types/warehouse/purchase/type";



// Updated schema to handle an array of products
const PurchaseProductSchema = z.object({
  product: z.string({ required_error: "Product is required" }).uuid("Please select a valid product"),
  quantity: z.coerce.number({ required_error: "Quantity is required" })
    .positive("Quantity must be positive"),
  price: z.coerce.number({ required_error: "Price is required" })
    .positive("Price must be positive"),
});

const PurchaseSchema = z.object({
  date: z.string({ required_error: "Date is required" }),
  supplier: z.string({ required_error: "Supplier is required" }).uuid("Please select a valid supplier"),
  products: z.array(PurchaseProductSchema)
    .min(1, "At least one product is required"),
  note: z.string().optional(),
});

interface FormResponse {
  responseType: "success" | "error";
  message?: string;
}

const PurchaseForm = ({ item }: { item: Purchase | null | undefined }) => {
  const [isPending, startTransition] = useTransition();
  const [,setResponse] = useState<FormResponse | undefined>();
  const [error,] = useState<string | undefined>("");
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof PurchaseSchema>>({
    resolver: zodResolver(PurchaseSchema),
    defaultValues: {
      date: item?.date || format(new Date(), "yyyy-MM-dd"),
      supplier: item?.supplier || "",
      products: item?.products || [{
        product: "",
        quantity: 1,
        price: 0
      }],
      note: item?.note || ""
    }
  });

  const { fields: productFields, append: productAppend, remove: productRemove } = useFieldArray({
    name: "products",
    control: form.control,
  });

  // Calculate the total amount based on all products
  const calculateTotal = () => {
    const products = form.watch("products");
    return products.reduce((acc, product) => {
      return acc + (product.quantity * product.price || 0);
    }, 0);
  };

  const total = calculateTotal();

  const addProduct = () => {
    productAppend({
      product: "",
      quantity: 1,
      price: 0,
    });
  };

  const onInvalid = useCallback(
    (errors: any) => {
      console.error("Form errors:", errors);
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please check the form for errors and try again.",
      });
    },
    [toast]
  );

  const submitData = (values: z.infer<typeof PurchaseSchema>) => {
    setResponse(undefined);

    startTransition(() => {
      // Format the data for submission
      const formattedData = {
        ...values,
        amount: calculateTotal(),
        // Generate an order ID if creating a new purchase
        order_Id: item?.order_Id || `PO-${Date.now().toString().slice(-6)}`,
        status: item?.status || "pending",
      };

      if (item) {
        updatePurchases(item.id, formattedData).then((data) => {
          if (data) setResponse(data);

          if (data?.responseType === "success") {
            toast({
              variant: "default",
              title: "Purchase updated",
              description: "Purchase order has been updated successfully",
              duration: 5000,
            });
            router.push("/purchases");
          }
        });
      } else {
        createPurchases(formattedData).then((data) => {
          if (data) setResponse(data);

          if (data?.responseType === "success") {
            toast({
              variant: "default",
              title: "Purchase created",
              description: "Purchase order has been created successfully",
              duration: 5000,
            });
            router.push("/purchases");
          }
        });
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submitData, onInvalid)}>
        <FormError message={error} />

        <Card className="mt-8 mb-6">
          <CardHeader>
            <CardTitle>{item ? "Edit Purchase Order" : "Create Purchase Order"}</CardTitle>
            {item && (
              <div className="flex items-center gap-2">
                <Badge variant="outline">{item.order_Id}</Badge>
                <Badge variant={item.status === "completed" ? "default" : "secondary"}>
                  {item.status}
                </Badge>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Purchase Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(new Date(field.value), "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                          disabled={isPending}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="supplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier</FormLabel>
                    <FormControl>
                      <SupplierSelector
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        isRequired
                        isDisabled={isPending}
                        label="Supplier"
                        value={field.value}
                        placeholder="Select supplier"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Items</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addProduct}
                  disabled={isPending}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </div>

              {productFields.map((field, index) => (
                <div
                  key={field.id}
                  className="space-y-4 p-4 border rounded-md relative bg-muted/20"
                >
                  <div className="absolute top-2 right-2">
                    {productFields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => productRemove(index)}
                        disabled={isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name={`products.${index}.product`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Item {index + 1}</FormLabel>
                          <FormControl>
                            <ProductSelector
                                      onChange={field.onChange}
                                      onBlur={field.onBlur}
                                      isRequired
                                      isDisabled={isPending}
                                      value={field.value}
                                      placeholder="Select product" label={""} products={[]}                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`products.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              placeholder="How many?"
                              {...field}
                              onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                              disabled={isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`products.${index}.price`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit Price</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="Price per unit"
                              {...field}
                              onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                              disabled={isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Display subtotal for this product */}
                  <div className="flex justify-end">
                    <p className="text-sm text-muted-foreground">
                      Subtotal: $
                      {(
                        form.watch(`products.${index}.quantity`) *
                          form.watch(`products.${index}.price`) || 0
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}

              {/* Display total amount */}
              <div className="flex justify-end mt-4 p-2 bg-muted/30 rounded-md">
                <p className="text-lg font-semibold">
                  Total: ${total.toFixed(2)}
                </p>
              </div>
            </div>

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional information here"
                      className="min-h-[100px]"
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
        <div className="flex items-center justify-end gap-2 pt-6">
          <CancelButton/>
          <Separator orientation="vertical" className="h-8" />
          <SubmitButton
            isPending={isPending}
            label={item ? "Update Purchase Order" : "Create Purchase Order"}
          />
        </div>
      </form>
    </Form>
  );
};

export default PurchaseForm;
