"use client";

import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
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
import { BusinessTimeType } from "@/types/types";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  Loader2Icon,
  Mail,
  MapPin,
  Phone,
  User,
  Clock,
  Store,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PhoneInput } from "@/components/ui/phone-input";
import CancelButton from "@/components/widgets/cancel-button";
import SubmitButton from "@/components/widgets/submit-button";
import {
  createWarehouse,
  updateWarehouse,
} from "@/lib/actions/warehouse/register-action";
import { RegisterWarehouseSchema } from "@/types/warehouse/register-warehose-schema";
import { getCurrentBusiness } from "@/lib/actions/business/get-current-business";
import { Business } from "@/types/business/type";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { businessTimes } from "@/types/constants";
import { Warehouses } from "@/types/warehouse/warehouse/type";

// Helper function to convert time string to businessTime name
const timeToBusinessTimeName = (timeString: string): string => {
  if (!timeString) return "";

  // Handle different time formats
  let normalizedTime = timeString;

  // If time is in HH:MM:SS format, convert to HH:MM
  if (timeString.includes(":")) {
    const timeParts = timeString.split(":");
    if (timeParts.length >= 2) {
      normalizedTime = `${timeParts[0]}:${timeParts[1]}`;
    }
  }

  // Try exact match first
  let businessTime = businessTimes.find((bt) => bt.name === normalizedTime);

  // If no exact match, try with original time string
  if (!businessTime) {
    businessTime = businessTimes.find((bt) => bt.name === timeString);
  }

  // If still no match, try comparing just the time part
  if (!businessTime) {
    businessTime = businessTimes.find((bt) => {
      const btTime = bt.name.split(":").slice(0, 2).join(":");
      return btTime === normalizedTime;
    });
  }

  const result = businessTime?.name || "";
  console.log("Time conversion result:", result);
  return result;
};

function WarehouseForm({ item }: { item: Warehouses | null | undefined }) {
  const [isPending, startTransition] = useTransition();
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoadingBusiness, setIsLoadingBusiness] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof RegisterWarehouseSchema>>({
    resolver: zodResolver(RegisterWarehouseSchema),
    defaultValues: {
      name: "",
      address: "",
      city: "",
      phone: "",
      image: "",
      email: "",
      description: "",
      openingTime: "",
      closingTime: "",
    },
  });

  // Fetch business data
  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        setIsLoadingBusiness(true);
        const cookieBusiness = await getCurrentBusiness();
        setBusiness(cookieBusiness ?? null);
      } finally {
        setIsLoadingBusiness(false);
      }
    };
    fetchBusiness();
  }, []);

  // Set form values when item or business data is available
  useEffect(() => {
    if (!isLoadingBusiness) {
      const formValues = {
        name: item?.name || "",
        address: item?.address || business?.countryName || "",
        city: item?.city || "",
        phone: item?.phone || business?.notificationPhone || "",
        image: item?.image || business?.image || "",
        email: item?.email || business?.notificationEmailAddress || "",
        description: item?.description || "",
        openingTime: item?.openingTime
          ? timeToBusinessTimeName(item.openingTime)
          : "",
        closingTime: item?.closingTime
          ? timeToBusinessTimeName(item.closingTime)
          : "",
      };

      form.reset(formValues);
      console.log("Form reset with values:", formValues);
    }
  }, [item, business, isLoadingBusiness, form]);

  const onInvalid = useCallback(
    (errors: any) => {
      console.log(errors);
      toast({
        variant: "destructive",
        title: "Validation error",
        description: "Please check the form for errors and try again.",
      });
    },
    [toast],
  );

  const submitData = (values: z.infer<typeof RegisterWarehouseSchema>) => {
    startTransition(() => {
      if (item) {
        updateWarehouse(values).then((data) => {
          if (data && data.responseType === "success") {
            toast({
              title: "Success",
              description: data.message,
              duration: 5000,
            });
            router.push("/warehouse-profile");
          }
        });
      } else {
        createWarehouse(values)
          .then((data) => {
            console.log(data);
            if (data && data.responseType === "success") {
              toast({
                title: "Success",
                description: data.message,
                duration: 5000,
              });
              router.push("/warehouse-profile");
            }
          })
          .catch((err) => {
            console.log(err);
          });
      }
    });
  };

  if (isLoadingBusiness) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <Loader2Icon className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-gray-600">Loading warehouse data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6">
      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
        <CardContent className="p-6 md:p-8">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(submitData, onInvalid)}
              className="space-y-6"
            >
              {/* Basic Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Store className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-800">
                    Basic Information
                  </h3>
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">
                        Warehouse Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter warehouse name"
                          disabled={isPending}
                          className="h-12 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
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
                      <FormLabel className="text-gray-700 font-medium">
                        Warehouse Description
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Enter warehouse description"
                          disabled={isPending}
                          rows={3}
                          className="border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="my-6" />

              {/* Contact Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-800">
                    Contact Information
                  </h3>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">
                          Phone Number <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <PhoneInput
                              placeholder="Enter phone number"
                              {...field}
                              disabled={isPending}
                              className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">
                          Email Address <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                              {...field}
                              placeholder="Enter warehouse email"
                              disabled={isPending}
                              className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator className="my-6" />

              {/* Location Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-800">
                    Location Information
                  </h3>
                </div>

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">
                        City/Region <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter city or region"
                          disabled={isPending}
                          className="h-12 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">
                        Full Address <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter complete warehouse address"
                          disabled={isPending}
                          className="h-12 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="my-6" />

              {/* Operating Hours Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-800">
                    Operating Hours
                  </h3>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="openingTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">
                          Opening Time
                        </FormLabel>
                        <FormControl>
                          <Select
                            disabled={isPending}
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger className="h-12 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                              <SelectValue placeholder="Select opening time" />
                            </SelectTrigger>
                            <SelectContent>
                              {businessTimes.length > 0 ? (
                                businessTimes.map(
                                  (time: BusinessTimeType, index: number) => (
                                    <SelectItem key={index} value={time.name}>
                                      {time.label}
                                    </SelectItem>
                                  ),
                                )
                              ) : (
                                <SelectItem value="no-times">
                                  No times available
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="closingTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">
                          Closing Time
                        </FormLabel>
                        <FormControl>
                          <Select
                            disabled={isPending}
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger className="h-12 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                              <SelectValue placeholder="Select closing time" />
                            </SelectTrigger>
                            <SelectContent>
                              {businessTimes.length > 0 ? (
                                businessTimes.map(
                                  (time: BusinessTimeType, index: number) => (
                                    <SelectItem key={index} value={time.name}>
                                      {time.label}
                                    </SelectItem>
                                  ),
                                )
                              ) : (
                                <SelectItem value="no-times">
                                  No times available
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-8 border-t">
                <CancelButton />
                <Separator
                  orientation="vertical"
                  className="hidden sm:block h-8"
                />
                {isPending ? (
                  <button
                    disabled
                    className="flex items-center gap-3 bg-gradient-to-r from-gray-400 to-gray-500 text-white px-8 py-3 rounded-lg font-medium cursor-not-allowed min-w-[160px] justify-center"
                  >
                    <Loader2Icon className="w-5 h-5 animate-spin" />
                    Processing...
                  </button>
                ) : (
                  <SubmitButton
                    isPending={isPending}
                    label={item ? "Update Warehouse" : "Create Warehouse"}
                    className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-8 py-3 rounded-lg font-medium transition-all transform hover:scale-105 min-w-[160px]"
                  />
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export default WarehouseForm;
