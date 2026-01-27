// "use client";
//
// import { Input } from "@/components/ui/input";
// import { FieldErrors, useForm } from "react-hook-form";
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
// import React, { useCallback, useState, useTransition } from "react";
// import { useToast } from "@/hooks/use-toast";
// import { FormResponse } from "@/types/types";
// import CancelButton from "../widgets/cancel-button";
// import { SubmitButton } from "../widgets/submit-button";
// import { Separator } from "@/components/ui/separator";
// import { FormError } from "../widgets/form-error";
// import { FormSuccess } from "../widgets/form-success";
// import { useRouter } from "next/navigation";
// import { DeviceSchema } from "@/types/device/schema";
// import DepartmentSelector from "@/components/widgets/department-selector";
// import { createDevice, updateDevice } from "@/lib/actions/devices-actions";
// import { Device } from "@/types/device/type";
//
// function DeviceForm({ item }: { item: Device | null | undefined }) {
//   const [isPending, startTransition] = useTransition();
//   const [, setResponse] = useState<FormResponse | undefined>();
//   const [error] = useState<string | undefined>("");
//   const [success] = useState<string | undefined>("");
//
//   const { toast } = useToast();
//   const router = useRouter();
//
//   const form = useForm<z.infer<typeof DeviceSchema>>({
//     resolver: zodResolver(DeviceSchema),
//     defaultValues: {
//       ...item,
//       deviceName: item?.deviceName,
//       department: item?.department,
//     },
//   });
//
//   const onInvalid = useCallback(
//     (errors: FieldErrors) => {
//       const errorEntries = Object.entries(errors);
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
//   const submitData = (values: z.infer<typeof DeviceSchema>) => {
//     console.log("The payload is submitted", values);
//     startTransition(() => {
//       if (item) {
//         updateDevice(item.id, values).then((data: FormResponse | void) => {
//           if (data) setResponse(data);
//           if (data && data.responseType === "success") {
//             toast({
//               title: "Success",
//               description: data.message,
//             });
//             router.push("/devices");
//           }
//         });
//       } else {
//         createDevice(values)
//           .then((data: FormResponse | void) => {
//             if (data && data.responseType === "success") {
//               setResponse(data);
//               toast({
//                 title: "Success",
//                 description: data.message,
//               });
//               router.push("/devices");
//             }
//           })
//           .catch((err) => {
//             console.log(err);
//           });
//       }
//     });
//   };
//
//   const handleFormSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     form.handleSubmit(submitData, onInvalid)(e);
//   };
//
//   return (
//     <div className="w-full max-w-4xl mx-auto">
//       <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
//         {/* Form Header */}
//         <div className="px-6 py-5 border-b border-gray-200">
//           <h2 className="text-xl font-semibold text-gray-900">
//             {item ? "Edit Device" : "Add New Device"}
//           </h2>
//           <p className="mt-1 text-sm text-gray-500">
//             {item
//               ? "Update the device information below"
//               : "Fill in the details to add a new device"}
//           </p>
//         </div>
//
//         {/* Form Body */}
//         <Form {...form}>
//           <div onSubmit={handleFormSubmit}>
//             <div className="px-6 py-6">
//               <FormError message={error} />
//               <FormSuccess message={success} />
//
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <FormField
//                   control={form.control}
//                   name="deviceName"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel className="text-sm font-medium text-gray-700">
//                         Device Name
//                         <span className="text-red-500 ml-1">*</span>
//                       </FormLabel>
//                       <FormControl>
//                         <Input
//                           placeholder="Enter device name"
//                           {...field}
//                           disabled={isPending}
//                           className="mt-1"
//                         />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//
//                 <FormField
//                   control={form.control}
//                   name="department"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel className="text-sm font-medium text-gray-700">
//                         Department
//                         <span className="text-red-500 ml-1">*</span>
//                       </FormLabel>
//                       <DepartmentSelector
//                         {...field}
//                         value={field.value ?? ""}
//                       />
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </div>
//             </div>
//
//             {/* Form Footer */}
//             <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg flex items-center justify-between">
//               <p className="text-xs text-gray-500">
//                 <span className="text-red-500">*</span> Required fields
//               </p>
//               <div className="flex items-center gap-3">
//                 <CancelButton />
//                 <SubmitButton
//                   isPending={isPending}
//                   label={item ? "Update Device" : "Add Device"}
//                 />
//               </div>
//             </div>
//           </div>
//         </Form>
//       </div>
//     </div>
//   );
// }
//
// export default DeviceForm;
//

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
import React, { useCallback, useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { FormResponse } from "@/types/types";
import CancelButton from "../widgets/cancel-button";
import { SubmitButton } from "../widgets/submit-button";
import { FormError } from "../widgets/form-error";
import { FormSuccess } from "../widgets/form-success";
import { useRouter } from "next/navigation";
import { DeviceSchema } from "@/types/device/schema";
import DepartmentSelector from "@/components/widgets/department-selector";
import { generateDeviceToken } from "@/lib/actions/devices-actions";

function DeviceForm() {
  const [isPending, startTransition] = useTransition();
  const [, setResponse] = useState<FormResponse | undefined>();
  const [error] = useState<string | undefined>("");
  const [success] = useState<string | undefined>("");

  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof DeviceSchema>>({
    resolver: zodResolver(DeviceSchema),
    defaultValues: {
      deviceCustomName: "",
      department: "",
    },
  });

  const onInvalid = useCallback(
    (errors: FieldErrors) => {
      const errorEntries = Object.entries(errors);
      const firstError = errorEntries[0]?.[1]?.message;
      const errorMessage =
        typeof firstError === "string"
          ? firstError
          : "Please check all fields and try again";

      toast({
        variant: "destructive",
        title: "Validation Error",
        description: errorMessage,
      });
    },
    [toast],
  );

  const submitData = (values: z.infer<typeof DeviceSchema>) => {
    console.log("Generating device token with payload:", values);
    startTransition(() => {
      generateDeviceToken(values)
        .then((data: FormResponse | void) => {
          if (data) {
            setResponse(data);
            if (data.responseType === "success") {
              toast({
                title: "Success",
                description: data.message,
              });
              form.reset(); // Reset form after successful token generation
              router.push("/devices"); // Or wherever you want to redirect
            } else if (data.responseType === "error") {
              toast({
                variant: "destructive",
                title: "Error",
                description: data.message,
              });
            }
          }
        })
        .catch((err) => {
          console.error("Error generating device token:", err);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to generate device token",
          });
        });
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    form.handleSubmit(submitData, onInvalid)(e);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {/* Form Header */}
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Generate Device Token
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Fill in the device details to generate a new token
          </p>
        </div>

        {/* Form Body */}
        <Form {...form}>
          <form onSubmit={handleFormSubmit}>
            <div className="px-6 py-6">
              <FormError message={error} />
              <FormSuccess message={success} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="deviceCustomName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Device Name
                        <span className="text-red-500 ml-1">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter device name"
                          {...field}
                          disabled={isPending}
                          className="mt-1"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Department
                        <span className="text-red-500 ml-1">*</span>
                      </FormLabel>
                      <DepartmentSelector
                        {...field}
                        value={field.value ?? ""}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Form Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg flex items-center justify-between">
              <p className="text-xs text-gray-500">
                <span className="text-red-500">*</span> Required fields
              </p>
              <div className="flex items-center gap-3">
                <CancelButton />
                <SubmitButton isPending={isPending} label="Generate Token" />
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

export default DeviceForm;
