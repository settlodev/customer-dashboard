"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback,  useState, useTransition } from "react";
import { FieldErrors, useForm } from "react-hook-form";
import * as z from "zod";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
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
import { TemplateSchema } from "@/types/communication-templates/schema";
import { createTemplate, updateTemplate } from "@/lib/actions/communication-templates-actions";
import BroadCastTypeSelector from "../widgets/broadcast-type-selector";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Switch } from "../ui/switch";

const TemplateForm = ({
  item,
}: {
  item: Template | null | undefined;
}) => {
  const [isPending, startTransition] = useTransition();
  const [, setResponse] = useState<FormResponse | undefined>();
  const { toast } = useToast();



  const form = useForm<z.infer<typeof TemplateSchema>>({
    resolver: zodResolver(TemplateSchema),
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

  const submitData = (values: z.infer<typeof TemplateSchema>) => {

    console.log("Submitting data:", values);

    setResponse(undefined);

    startTransition(() => {
      if (item) {
        updateTemplate(item.id, values).then((data) => {
          if (data) setResponse(data);
        });
      } else {
        createTemplate(values).then((data) => {
          if (data) setResponse(data);
        });
      }
    });
  };


  return (
    <>
      <>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submitData, onInvalid)}>
            <div className="lg:grid grid-cols-2 gap-4 mt-2">
              <div className="grid gap-2">
                <FormField
                  control={form.control}
                  name="broadcastType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Broadcast Type</FormLabel>
                      <FormControl>
                        <BroadCastTypeSelector
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          isRequired
                          isDisabled={isPending}
                          label="Broadcast Type"
                          placeholder="Select broadcast type"
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
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter subject"
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
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <ReactQuill
                          theme="snow"
                          placeholder="Enter business description"
                          {...field}
                          // disabled={isPending}
                          value={field.value}
                          onChange={field.onChange}
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
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {
                item && (
                  <div className="grid gap-2 mt-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <FormLabel>Template Status</FormLabel>
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

            {isPending ? (
              <div className="flex justify-center items-center bg-black rounded p-2 text-white">
                <Loader2Icon className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <Button
                type="submit"
                disabled={isPending}
                className={`mt-4 w-full capitalize`}
              >
                setup template
              </Button>
            )}
          </form>
        </Form>
      </>
    </>
  );
};

export default TemplateForm;
