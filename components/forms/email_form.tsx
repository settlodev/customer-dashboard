"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback, useEffect, useState, useTransition } from "react";
import { FieldErrors, useForm } from "react-hook-form";
import * as z from "zod";
import DOMPurify from 'dompurify';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
// import dynamic from "next/dynamic";
import { FormResponse } from "@/types/types";
import { Input } from "@/components/ui/input";
import { Button } from "../ui/button";
import { Loader2Icon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Template } from "@/types/communication-templates/types";
// import "react-quill/dist/quill.snow.css";
import DateTimePicker from "../widgets/datetimepicker";
import { Customer } from "@/types/customer/type";
import {fetchAllCustomers } from "@/lib/actions/customer-actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Checkbox } from "../ui/checkbox";
import { Email } from "@/types/email/type";
import { EmailSchema } from "@/types/email/schema";
import { sendEmail } from "@/lib/actions/broadcast-email-action";
import { MultiSelect } from "../ui/multi-select";
// import ReactQuill from "react-quill";
import { Staff } from "@/types/staff";
import { fetchAllStaff } from "@/lib/actions/staff-actions";
import { fetchTemplates } from "@/lib/actions/communication-templates-actions";
import { Textarea } from "../ui/textarea";

// const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
// import "react-quill/dist/quill.snow.css";

const EmailForm = ({
  item,
}: {
  item: Email | null | undefined;
}) => {
  const [isPending, startTransition] = useTransition();
  const [, setResponse] = useState<FormResponse | undefined>();
  const [scheduledDate, setSchuledDate] = useState<Date | undefined>(
    item?.scheduled ? new Date(item.scheduled) : undefined);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [staffs, setStaffs] = useState<Staff[]>([]);

 
  const { toast } = useToast();




  const form = useForm<z.infer<typeof EmailSchema>>({
    resolver: zodResolver(EmailSchema),
    defaultValues: item ? item : { status: true },
  });

  const onInvalid = useCallback(
    (errors: FieldErrors) => {
      console.log("Errors during form submission:", errors);
      toast({
        variant: "destructive",
        title: "Uh oh! something went wrong",
        description: typeof errors.message === 'string' ? errors.message : "There was an issue submitting your form, please try later",
      });
    },
    [toast],
  );

  const submitData = (values: z.infer<typeof EmailSchema>) => {

    console.log("Submitting data:", values);

    setResponse(undefined);

    startTransition(() => {
      sendEmail(values).then((data) => {
        if (data) setResponse(data);
      });

    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customerResponse, templateResponse, staffResponse] = await Promise.all([
         fetchAllCustomers(),
         fetchTemplates(),
          fetchAllStaff(),
        ]);
        setCustomers(customerResponse);
        setTemplates(templateResponse);
        setStaffs(staffResponse);
      } catch (error) {
        console.error("Error fetching data", error);
      }
    };
  
    fetchData();
  }, []);



  const handleTimeChange = (type: "hour" | "minutes", value: string) => {
    const currentDate = new Date();
    const newDate = new Date(currentDate);
    if (type === "hour") {
      newDate.setHours(Number(value));
    } else if (type === "minutes") {
      newDate.setMinutes(Number(value));
    }
  };

  const handleDateSelect = (date: Date) => {
    setSchuledDate(date);
  };

  function sanitizeAndStripHtml(html: string): string {
    // Sanitize the HTML
    const sanitizedHtml = DOMPurify.sanitize(html);

    // Create a temporary div to strip tags
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = sanitizedHtml;

    // Get the text content, replacing <p> tags with line breaks
    return tempDiv.innerText.replace(/\n/g, ' ').trim(); // Replace new lines with spaces
  }


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submitData, onInvalid)}>
        <div className="lg:grid grid-cols-2 gap-4 mt-2">
          <div className="grid gap-2">
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>From</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Eg: pb@settlo.co.tz"
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

        </div>
        <div className="grid gap-2 mt-2">
          <FormField
            control={form.control}
            name="receipt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Receipt</FormLabel>
                <FormControl>
                  <MultiSelect
                     options={
                      [
                        // { label: "Customers", value: "group-customers"},
                        ...customers.map((customer) => ({
                          label: customer.firstName + " " + customer.lastName,
                          value: customer.id,
                        })),
                        // { label: "Staff", value: "group-staff"},
                        ...staffs.map((staff) => ({ 
                          label: staff.firstName + " " + staff.lastName, 

                          
                          value: staff.id, 
                        })),
                      ]
                    }
                    onValueChange={(field as any).onChange}
                    placeholder="Select customers"
                    variant="inverted"
                    animation={2}
                    maxCount={3}
                    {...field}
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="items-center justify-center lg:grid grid-cols-2 gap-4 mt-2">
          <div className="grid gap-2">
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Eg: Order Confirmation"
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-2 mt-2">
            <FormField
              control={form.control}
              name="template"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Template <span className="text-blue-500">(You can use templates in this section)</span></FormLabel>
                  <FormControl>
                    <Select
                      disabled={isPending || templates.length === 0}
                      value={field.value}
                      onValueChange={(value) => {
                        console.log("Selected Template ID:", value);
                        field.onChange(value);

                        const selectedTemplate = templates.find(template => template.id === value);
                        if (selectedTemplate) {
                          const plainTextMessage = sanitizeAndStripHtml(selectedTemplate.message); // Sanitize and strip HTML
                          form.setValue("message", plainTextMessage);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.length > 0
                          ? templates
                            .filter(temp => temp.broadcastType === "EMAIL") 
                            .map((temp: Template, index: number) => (
                              <SelectItem key={index} value={temp.id}>
                                {temp.subject}-{temp.broadcastType}
                              </SelectItem>
                            ))
                          : null}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="grid gap-2 mt-6">
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Message</FormLabel>
                <FormControl>


                  {/* <ReactQuill
                    theme="snow"
                    placeholder="Enter message"
                    value={field.value}
                    onChange={(value) => {
                      field.onChange(value);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                      }
                    }}
                    onKeyUp={(event) => {
                      if (event.key === "Enter" && event.shiftKey) {
                        event.preventDefault();
                      }
                    }}
                    className="resize-none bg-gray-50"
                    modules={{
                      toolbar: [
                        ["bold", "italic", "underline", "strike"],
                        ["blockquote", "code-block"],
                        [{ header: 1 }, { header: 2 }],
                        [{ list: "ordered" }, { list: "bullet" }],
                        [{ size: ["small", false, "large", "huge"] }],
                        [{ header: [1, 2, 3, 4, 5, 6, false] }],
                        [{ color: [] }, { background: [] }],
                        [{ font: [] }],
                        [{ align: [] }],
                        ["clean"],
                        ["link", "image", "video"],
                      ],
                    }}
                  /> */}
                  <Textarea
                    placeholder="Enter message"
                    {...field}
                    disabled={isPending}
                    maxLength={1000}

                  />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />
        </div>


        <div className="grid gap-2 mt-8">
          <FormField
            control={form.control}
            name="sendingOptions"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Send Options</FormLabel>
                <div className="flex flex-col space-y-2 lg:flex-row lg:space-y-0 lg:space-x-8">
                  <div className="flex items-center">
                    <Checkbox
                      checked={field.value === "sendNow"}
                      onCheckedChange={(checked) => {
                        field.onChange(checked ? "sendNow" : "");
                        if (checked) setSchuledDate(undefined)
                      }}
                      disabled={isPending}
                    />
                    <span className="ml-2">Send Now</span>
                  </div>
                  <div className="flex items-center">
                    <Checkbox
                      checked={field.value === "sendTest"}
                      onCheckedChange={(checked) => {
                        field.onChange(checked ? "sendTest" : "");
                        if (checked) setSchuledDate(undefined)
                      }}
                      disabled={isPending}
                    />
                    <span className="ml-2">Send Test</span>
                  </div>
                  <div className="flex items-center">
                    <Checkbox
                      checked={field.value === "schedule"}
                      onCheckedChange={(checked) => {

                        field.onChange(checked ? "schedule" : "");
                        if (checked) setSchuledDate(new Date())
                      }}
                      disabled={isPending}
                    />
                    <span className="ml-2">Schedule</span>
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {
          form.getValues("sendingOptions")?.includes("schedule") && (
            <div className="grid gap-2 mt-12">
              <FormField
                control={form.control}
                name="scheduled"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Schedule Email</FormLabel>
                    <DateTimePicker
                      field={field}
                      date={scheduledDate}
                      setDate={setSchuledDate}
                      handleTimeChange={handleTimeChange}
                      onDateSelect={handleDateSelect}
                      minDate={new Date()}
                    />
                    <FormDescription>
                      Schedule an email to be sent at a specific date and time.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )
        }

        {isPending ? (
          <div className="flex justify-center items-center bg-black rounded p-2 text-white">
            <Loader2Icon className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <Button
            type="submit"
            disabled={isPending}
            className={`mt-8 w-full capitalize`}
          >
            Send SMS
          </Button>
        )}
      </form>
    </Form>
  );
};

export default EmailForm;
