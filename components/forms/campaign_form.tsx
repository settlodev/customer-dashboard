"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback, useEffect, useState, useTransition } from "react";
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
import { fetchTemplates } from "@/lib/actions/communication-templates-actions";
import DateTimePicker from "../widgets/datetimepicker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { sendCampaign } from "@/lib/actions/campaign_action";
import { Checkbox } from "../ui/checkbox";
import { CampaignSchema } from "@/types/campaign/schema";
import { Campaign } from "@/types/campaign/type";
import { audienceType } from "@/types/enums";
import Link from "next/link";

const CampaignForm = ({
  item,
}: {
  item: Campaign | null | undefined;
}) => {
  const [isPending, startTransition] = useTransition();
  const [, setResponse] = useState<FormResponse | undefined>();
  const [scheduledDate, setSchuledDate] = useState<Date | undefined>(
    item?.scheduled ? new Date(item.scheduled) : undefined);
  const [templates, setTemplates] = useState<Template[]>([]);

  const { toast } = useToast();




  const form = useForm<z.infer<typeof CampaignSchema>>({
    resolver: zodResolver(CampaignSchema),
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

  const submitData = (values: z.infer<typeof CampaignSchema>) => {

    console.log("Submitting data:", values);

    setResponse(undefined);

    startTransition(() => {
      sendCampaign(values).then((data) => {
        if (data) setResponse(data);
      });

    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [templateResponse] = await Promise.all([
          fetchTemplates(),

        ]);
        setTemplates(templateResponse);
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


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submitData, onInvalid)}>
        <div className="lg:grid grid-cols-2 gap-4 ">

          <div className="grid gap-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaign Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="SWITCH CLOTHES NA X-MAS"
                      {...field}
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
              name="senderId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SenderId</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="SETTLO"
                      {...field}
                      disabled
                    />
                  </FormControl>
                  <FormDescription>
                    <Link href='#'>
                    <span className="text-sm text-emerald-500 cursor-pointer">
                      Please request senderId to be able to campaign
                    </span>
                    </Link>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="lg:grid grid-cols-2 gap-4 mt-2">

          <div className="grid gap-2 mt-4">
            <FormField
              control={form.control}
              name="audience"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Audience</FormLabel>
                  <div className="flex flex-col space-y-2 lg:flex-row lg:space-y-0 lg:space-x-8">
                    <div className="flex items-center">
                      <Checkbox
                        checked={field.value === audienceType.CUSTOMER}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            field.onChange(audienceType.CUSTOMER);
                          } else if (field.value === audienceType.CUSTOMER) {
                            field.onChange("");
                          }
                        }}
                        disabled={isPending}
                      />
                      <span className="ml-2">Customers</span>
                    </div>
                    <div className="flex items-center">
                      <Checkbox
                        checked={field.value === audienceType.STAFF}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            field.onChange(audienceType.STAFF);
                          } else if (field.value === audienceType.STAFF) {
                            field.onChange("");
                          }
                        }}
                        disabled={isPending}
                      />
                      <span className="ml-2">Staff</span>
                    </div>
                    <div className="flex items-center">
                      <Checkbox
                        checked={field.value === audienceType.ALL}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            field.onChange(audienceType.ALL);
                          } else if (field.value === audienceType.ALL) {
                            field.onChange("");
                          }
                        }}
                        disabled={isPending}
                      />
                      <span className="ml-2">All</span>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-2 mt-2">
            <FormField
              control={form.control}
              name="communicationTemplate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template <span className="text-emerald-500 text-sm">(Optional)</span></FormLabel>
                  <FormControl>
                    <Select
                      disabled={isPending || templates.length === 0}
                      value={field.value}
                      onValueChange={(value) => {
                        console.log("Selected Template ID:", value);
                        field.onChange(value);

                        const selectedTemplate = templates.find(template => template.id === value);
                        if (selectedTemplate) {
                          form.setValue("message", selectedTemplate.message);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.length > 0
                          ? templates
                            .filter(temp => temp.broadcastType === "SMS")
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
                    <FormLabel>Schedule Campaign <span className="text-emerald-500 text-sm">(Optional)</span></FormLabel>
                    <DateTimePicker
                      field={field}
                      date={scheduledDate}
                      setDate={setSchuledDate}
                      handleTimeChange={handleTimeChange}
                      onDateSelect={handleDateSelect}
                      minDate={new Date()}
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
            Send Campaign
          </Button>
        )}
      </form>
    </Form>
  );
};

export default CampaignForm;
