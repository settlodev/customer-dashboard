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
import { Product } from "@/types/product/type";
import { fectchAllProducts } from "@/lib/actions/product-actions";
import { Modifier, ModifierItems } from "@/types/modifiers/type";
import { ModifierSchema } from "@/types/modifiers/schema";
import { createModifier, updateModifier } from "@/lib/actions/modifier-actions";
import { NumericFormat } from "react-number-format";
import { CirclePlus, Trash } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useRouter } from "next/navigation";


function ModifierForm({ item }: { item: Modifier | null | undefined }) {
  const [isPending, startTransition] = useTransition();
  const [, setResponse] = useState<FormResponse | undefined>();
  const [error,] = useState<string | undefined>("");
  const [success,] = useState<string | undefined>("");
  const [,setStocks] = useState<Stock[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [,setCombinedProductOptions] = useState<{ id: string; displayName: string }[]>([]);
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
      variant: item ? item.variant.toString() : "",
     
    },
    
  });

  useEffect(() => {
    const getData = async () => {
      try {
        const [productResponse] = await Promise.all([
          fectchAllProducts(),
        ]);
        setProducts(productResponse);

        const combinedProductVariant = productResponse.flatMap(product => product.variants.map(variant => ({ id: variant.id, displayName: `${product.name} - ${variant.name}` })));
        setCombinedProductOptions(combinedProductVariant);

        if (item) {
          const transformedItems = item.modifierItems.map((modifierItem) => ({
            ...modifierItem,
            price: parseFloat(modifierItem.price.toString()),
          }));
          form.setValue("modifierItems", transformedItems);
          setIsMultiple(item.isMaximum);
          setItemList(transformedItems);
          setItemName(transformedItems.length > 0 ? transformedItems[0].name : "");
          setItemPrice(transformedItems.length > 0 ? transformedItems[0].price : 0);
        }


      } catch (error) {
        throw error;
      }
    };
    getData();
  }, [item, form, setStocks, setProducts]);


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
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select product Variant" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) =>
                          product.variants.map((variant) => (
                            <SelectItem key={variant.id} value={variant.id}>
                              {`${product.name} - ${variant.name}`}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 md:grid-cols-2 gap-8 mt-3">
            <div className="grid gap-2">
              <FormLabel>Item List</FormLabel>
              <div className="flex flex-col gap-2 items-start justify-between w-full">
                <div className="flex gap-8 justify-between">
                  <Input
                    name="name"
                    className="w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm leading-1 text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black-2"
                    placeholder="Enter item name"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                  />

                  <NumericFormat
                    className="w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm leading-1 text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black-2"
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
                {itemList.map((item, index) => (
                  <>
                <div key={index} className="flex items-center  justify-between w-full ">
                <span>{item.name} - {new Intl.NumberFormat('en-US').format(item.price)}</span>
                
                      <button type="button" className="bg-red-500 hover:bg-red-600 text-white text-sm font-normal py-2 px-2 rounded items-end" onClick={() => removeItem(index)}>
                        <Trash className="w-3 h-3" />
                      </button>
                 
                  
                </div>
                <div className="border-b-2 w-full"/>
                  </>
              ))}
               
              </div>
               {/* <div className="flex"> */}
               <button type="button" onClick={addItem} className="flex items-center justify-center bg-[#18181A] text-white text-sm font-normal py-2 px-4 rounded w-full ">
                  <span><CirclePlus className="w-4 h-4 mr-2"/></span>
                  Add Item</button>
                {/* </div> */}
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

          {isMultiple && (
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
              label={item ? "Update modifier details" : "Add modifier"}
            />
          </div>
        </div>

      </form>
    </Form>
  );
}

export default ModifierForm;
