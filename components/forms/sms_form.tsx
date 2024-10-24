"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback,  useEffect,  useState, useTransition } from "react";
import { FieldErrors, useForm } from "react-hook-form";
import * as z from "zod";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { FormResponse } from "@/types/types";
import { Input } from "@/components/ui/input";
import { Button } from "../ui/button";
import { Loader2Icon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Template } from "@/types/communication-templates/types";
import { Textarea } from "../ui/textarea";
import { fectchTemplates} from "@/lib/actions/communication-templates-actions";
import "react-quill/dist/quill.snow.css";
import DateTimePicker from "../widgets/datetimepicker";
import { Customer } from "@/types/customer/type";
import { fectchAllCustomers } from "@/lib/actions/customer-actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { SMS } from "@/types/sms/type";
import { SMSSchema } from "@/types/sms/schema";
import { sendSMS } from "@/lib/actions/broadcast-sms-action";
import { Checkbox } from "../ui/checkbox";

const SMSForm = ({
  item,
}: {
  item: SMS | null | undefined;
}) => {
  const [isPending, startTransition] = useTransition();
  const [, setResponse] = useState<FormResponse | undefined>();
  const [scheduledDate, setSchuledDate] = useState<Date | undefined>(
    item?.scheduled ? new Date(item.scheduled) : undefined);
    
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [charCount, setCharCount] = useState(0);
    const maxChars = 140;
  const { toast } = useToast();


  

  const form = useForm<z.infer<typeof SMSSchema>>({
    resolver: zodResolver(SMSSchema),
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

  const submitData = (values: z.infer<typeof SMSSchema>) => {

    console.log("Submitting data:", values);

    setResponse(undefined);

    startTransition(() => {
      sendSMS(values).then((data) => {
        if (data) setResponse(data);
      });
      
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customerResponse, templateResponse] = await Promise.all([
          fectchAllCustomers(),
          fectchTemplates(),
        ]);
        setCustomers(customerResponse);
        setTemplates(templateResponse);
      } catch (error) {
        console.error("Error fetching data", error);
      }
    };
  
    fetchData();
  }, []);

  // Update character count whenever the message changes
  useEffect(() => {
    const messageValue = form.getValues("message") || ""; // Get current message value
    setCharCount(messageValue.length); // Update character count
  }, [form.watch("message")]); // Watch for changes in the message field

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


  return (
    <Form {...form}>
          <form onSubmit={form.handleSubmit(submitData, onInvalid)}>
            <div className="lg:grid grid-cols-2 gap-4 mt-2">
            <div className="grid gap-2">
                <FormField
                  control={form.control}
                  name="senderId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SenderId</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="SETTLO"
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
                    <FormLabel>SMS Template <span className="text-blue-500">(Optional,You can use templates in this section)</span></FormLabel>
                    <FormControl>
                      <Select
                        disabled={isPending || templates.length === 0}
                        value={field.value}
                        onValueChange={(value) => {
                          console.log("Selected Template ID:", value);
                          field.onChange(value); // Update form state with selected template ID

                          // Find the selected template and update the message field
                          const selectedTemplate = templates.find(template => template.id === value);
                          if (selectedTemplate) {
                            form.setValue("message", selectedTemplate.message); // Auto-fill the message
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select template" />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.length > 0
                            ? templates.map((temp: Template, index: number) => (
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

            <div className="lg:grid grid-cols-2 gap-4 mt-2">
           
            <div className="grid gap-2 mt-2">
              <FormField
                control={form.control}
                name="receipt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Receipt</FormLabel>
                    <FormControl>
                      <Select
                        disabled={isPending || customers.length === 0}
                        value={field.value}
                        onValueChange={(value) => {
                          console.log("Selected Value:", value); // Debugging log
                          field.onChange(value); // Update form state
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select recipient" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.length > 0
                            ? customers.map((cust: Customer, index: number) => (
                                <SelectItem key={index} value={cust.phoneNumber}>
                                  {cust.firstName} {cust.lastName}
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
                        <Textarea
                          placeholder="Enter message"
                          {...field}
                          disabled={isPending}
                          maxLength={maxChars}

                        />
                      </FormControl>
                      <div className="text-right text-sm text-gray-500">
                        {maxChars - charCount} characters
                      </div>
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
                        <FormLabel>Schedule SMS <span className="text-blue-500">(Optional)</span></FormLabel>
                        <DateTimePicker
                          field={field}
                          date={scheduledDate}
                          setDate={ setSchuledDate}
                          handleTimeChange={handleTimeChange}
                          onDateSelect={handleDateSelect}
                        />
                        <FormDescription>
                        Optional enter date and time to schedule sending process
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

export default SMSForm;
