"use client";

import { Input } from "@/components/ui/input";
import { FieldErrors, useForm } from "react-hook-form";
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
import { FormResponse } from "@/types/types";
import CancelButton from "../widgets/cancel-button";
import { SubmitButton } from "../widgets/submit-button";
import { Separator } from "@/components/ui/separator";
import { FormError } from "../widgets/form-error";
import { FormSuccess } from "../widgets/form-success";
import { Switch } from "../ui/switch";
import { Stock } from "@/types/stock/type";
import { Modifier, ModifierItems } from "@/types/modifiers/type";
import { ModifierSchema } from "@/types/modifiers/schema";
import { createModifier, updateModifier } from "@/lib/actions/modifier-actions";
import { NumericFormat } from "react-number-format";
import {Plus, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import ProductVariantSelector from "../widgets/product-variant-selector";


function ModifierForm({ item }: { item: Modifier | null | undefined }) {
  // console.log("ModifierForm item:", item);
  const [isPending, startTransition] = useTransition();
  const [, setResponse] = useState<FormResponse | undefined>();
  const [error,] = useState<string | undefined>("");
  const [success,] = useState<string | undefined>("");
  const [, setStocks] = useState<Stock[]>([]);
  // const [products, setProducts] = useState<Product[]>([]);
  // const [, setCombinedProductOptions] = useState<{ id: string; displayName: string }[]>([]);
  const [itemList, setItemList] = useState<ModifierItems[]>([]);
  const [itemName, setItemName] = useState<string>("");
  const [itemPrice, setItemPrice] = useState<number>(0);
  const [isMultiple, setIsMultiple] = useState<boolean>(false);
  const { toast } = useToast();
  const router = useRouter();

  const addItem = () => {
    if (itemName && itemPrice >= 0) {
      const newItem = { name: itemName, price: itemPrice };
      const updatedList = [...itemList, newItem];
      setItemList(updatedList);
      form.setValue("modifierItems", updatedList);
      setItemName("");
      setItemPrice(0);
    }
  };


  const removeItem = (index: number) => {
    const updatedList = itemList.filter((_, i) => i !== index);
    setItemList(updatedList);
    form.setValue("modifierItems", updatedList);
  };

  const form = useForm<z.infer<typeof ModifierSchema>>({
    resolver: zodResolver(ModifierSchema),
    defaultValues: {
      ...item,
      status: true,
      variant: item ? item.variant: "",
      // isMaximum: item ? item.isMaximum : false,
      isMandatory: item ? item.isMandatory : false,
      maximumSelection: item ? item.maximumSelection : 0,
      modifierItems: item ? item.modifierItems : [],

    },

  });

  useEffect(() => {
    const getData = async () => {
      try {
        

        if (item) {
          const transformedItems = item.modifierItems.map((modifierItem) => ({
            ...modifierItem,
            price: parseFloat(modifierItem.price.toString()),
          }));
          form.setValue("modifierItems", transformedItems);
          setIsMultiple(item.isMaximum);
          setItemList(transformedItems);
          // setItemName(transformedItems.length > 0 ? transformedItems[0].name : "");
          // setItemPrice(transformedItems.length > 0 ? transformedItems[0].price : 0);

          if(item?.maximumSelection > 0){
            setIsMultiple(true);
          }
        }
        else{
          setItemList([]);
        setItemName("");
        setItemPrice(0);
        }
        


      } catch (error) {
        throw error;
      }
    };
    getData();
  }, [item, form, setStocks]);


  const onInvalid = useCallback(
    (errors: FieldErrors) => {
      console.log("These are errors while submitting form", errors);
      toast({
        variant: "destructive",
        title: "Uh oh! something went wrong",
        description: typeof errors.message === 'string' && errors.message
          ? errors.message
          : "There was an issue submitting your form, please try later",
      });
    },
    [toast]
  );

  const submitData = (values: z.infer<typeof ModifierSchema>) => {
    startTransition(() => {
      if (item) {
        updateModifier(item.id, values).then((data) => {
          if (data) setResponse(data);

          if (data && data.responseType === "success") {
            toast({
              title: "Success",
              description: data.message,
            });
            router.push("/modifiers");
          }
        });
      } else {
        createModifier(values)
          .then((data) => {
            if (data) setResponse(data);

            if (data && data.responseType === "success") {
              toast({
                title: "Success",
                description: data.message,
              });
              router.push("/modifiers");
            }
          })
          .catch((err) => {
            console.log(err);
          });
      }
    });
  };
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(submitData, onInvalid)}
        className={`gap-1`}
      >
        <div>
          <FormError message={error} />
          <FormSuccess message={success} />
          <div className="grid grid-cols-1 lg:grid-cols-2 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter modifier group name"
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
              name="variant"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Variant</FormLabel>
                  <FormControl>
                    <ProductVariantSelector
                     value={field.value}
                     onChange={field.onChange}
                     placeholder="Select room to reserve"
                     isDisabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

          </div>
          <div className="grid grid-cols-1 lg:grid-cols-1 md:grid-cols-2 gap-8 mt-3">
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <FormLabel>Item List</FormLabel>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addItem()}
                  disabled={isPending}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>
              <div className="flex flex-col gap-4 w-full rounded-lg border p-3 bg-gray-50 shadow-sm">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="itemName" className="block text-sm font-medium text-gray-700 mb-2">
                      Item Name
                    </label>
                    <Input
                      id="itemName"
                      name="name"
                      className="w-full border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                      placeholder="E.g.: Small, Large, XL"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="itemPrice" className="block text-sm font-medium text-gray-700 mb-2">
                      Item Price
                    </label>
                    <NumericFormat
                      id="itemPrice"
                      className="w-full border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                      value={itemPrice}
                      name="price"
                      disabled={isPending}
                      placeholder="Enter item price"
                      thousandSeparator={true}
                      allowNegative={false}
                      onValueChange={(values) => {
                        const rawValue = Number(values.value.replace(/,/g, ""));
                        setItemPrice(rawValue);
                      }}
                    />
                  </div>
                </div>

                <div>
                  {itemList.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between w-full py-3 px-4 gap-2 bg-white rounded-md shadow-sm border hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-semibold text-gray-800">{item.name}</p> {" - "}
                        <p className="text-sm text-gray-500">
                          {new Intl.NumberFormat().format(item.price)}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="inline-flex items-center"
                        onClick={() => removeItem(index)}
                      >
                        <Trash className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-2 md:grid-cols-2 gap-4 mt-3">

            <div className="grid gap-2">
              <FormField
                control={form.control}
                name="isMandatory"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <FormLabel className="text-[12px] lg:text-[15px] font-normal ">Required</FormLabel>
                    <FormControl>
                      <Switch

                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-2">
              <FormField
                control={form.control}
                name="isMaximum"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <FormLabel className="text-[12px] lg:text-[15px] lg:font-normal">Multiple</FormLabel>
                    <FormControl>
                      <Switch

                        checked={field.value}
                        onCheckedChange={(value) => {
                          field.onChange(value);
                          setIsMultiple(value);
                        }}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 md:grid-cols-2 gap-4 mt-3">

            {isMultiple && isMultiple === true && (
              <div className="grid gap-2">
                <FormField
                  control={form.control}
                  name="maximumSelection"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum selection</FormLabel>
                      <FormControl>
                        <Input

                          {...field}
                          type="number"
                          placeholder="Enter maximum number of selections"
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          disabled={isPending}
                          value={field.value || 0}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            {item && (
              <div className="grid gap-2">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <FormLabel>Modifier Status</FormLabel>
                      <FormControl>
                        <Switch

                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )
            }
          </div>
          <div className="flex h-5 items-center space-x-4 mt-10">
            <CancelButton />
            <Separator orientation="vertical" />
            <SubmitButton
              isPending={isPending}
              label={item ? "Update modifier" : "Add modifier"}
            />
          </div>
        </div>

      </form>
    </Form>
  );
}

export default ModifierForm;
