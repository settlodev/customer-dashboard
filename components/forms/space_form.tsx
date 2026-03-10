"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FieldErrors, useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import React, { useCallback, useEffect, useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { FormResponse } from "@/types/types";
import CancelButton from "../widgets/cancel-button";
import { SubmitButton } from "../widgets/submit-button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  createSpace,
  updateSpace,
  fetchAllSpaces,
  fetchFloorPlans,
} from "@/lib/actions/space-actions";
import { SpaceSchema } from "@/types/space/schema";
import {
  Space,
  FloorPlan,
  SPACE_TYPES,
  TABLE_SPACE_TYPE_LABELS,
  TABLE_STATUS_LABELS,
} from "@/types/space/type";
import { TableSpaceType, TableStatus } from "@/types/enums";
import { useRouter } from "next/navigation";

function SpaceForm({ item }: { item: Space | null | undefined }) {
  const [isPending, startTransition] = useTransition();
  const [, setResponse] = useState<FormResponse | undefined>();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const loadRelatedData = async () => {
      try {
        const [spacesData, floorPlansData] = await Promise.all([
          fetchAllSpaces(),
          fetchFloorPlans(),
        ]);
        setSpaces(spacesData);
        setFloorPlans(floorPlansData);
      } catch (error) {
        console.error("Failed to load related data:", error);
      }
    };
    loadRelatedData();
  }, []);

  const form = useForm<z.infer<typeof SpaceSchema>>({
    resolver: zodResolver(SpaceSchema),
    defaultValues: item
      ? {
          name: item.name,
          code: item.code ?? undefined,
          capacity: item.capacity,
          minCapacity: item.minCapacity ?? undefined,
          type: item.type,
          tableStatus: item.tableStatus ?? undefined,
          active: item.active,
          reservable: item.reservable,
          turnTimeMinutes: item.turnTimeMinutes ?? undefined,
          posX: item.posX ?? undefined,
          posY: item.posY ?? undefined,
          color: item.color ?? undefined,
          needsCleaning: item.needsCleaning,
          description: item.description ?? undefined,
          sortOrder: item.sortOrder ?? undefined,
          parent: item.parentSpaceId ?? undefined,
          floorPlan: item.floorPlanId ?? undefined,
          status: item.status,
        }
      : {
          active: true,
          reservable: true,
          needsCleaning: false,
          status: true,
          type: "TABLE" as TableSpaceType,
          capacity: 2,
        },
  });

  const selectedType = form.watch("type");
  const isBookableType = selectedType === "TABLE" || selectedType === "SEAT";

  const parentSpaces = spaces.filter(
    (s) =>
      SPACE_TYPES.includes(s.type) &&
      s.id !== item?.id,
  );

  const onInvalid = useCallback(
    (errors: FieldErrors) => {
      toast({
        variant: "destructive",
        title: "Uh oh! something went wrong",
        description:
          typeof errors.message === "string" && errors.message
            ? errors.message
            : "There was an issue submitting your form, please try later",
      });
    },
    [toast],
  );

  const submitData = (values: z.infer<typeof SpaceSchema>) => {
    startTransition(() => {
      if (item) {
        updateSpace(item.id, values).then((data) => {
          if (data) setResponse(data);
          if (data && data.responseType === "success") {
            toast({ title: "Success", description: data.message });
            router.push("/spaces");
          }
        });
      } else {
        createSpace(values).then((data) => {
          if (data) setResponse(data);
          if (data && data.responseType === "success") {
            toast({ title: "Success", description: data.message });
            router.push("/spaces");
          }
        });
      }
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(submitData, onInvalid)}
        className="space-y-6"
      >
        {/* Basic Information */}
        <div>
          <h3 className="text-lg font-medium mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Table 1, Bar Area"
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
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., T1, BA"
                      {...field}
                      value={field.value ?? ""}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Optional identifier code
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(TableSpaceType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {TABLE_SPACE_TYPE_LABELS[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Capacity */}
        <div>
          <h3 className="text-lg font-medium mb-4">Capacity</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Capacity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 4"
                      min={1}
                      {...field}
                      disabled={isPending}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? undefined
                            : parseInt(e.target.value),
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="minCapacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Capacity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="No minimum"
                      min={1}
                      {...field}
                      value={field.value ?? ""}
                      disabled={isPending}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? undefined
                            : parseInt(e.target.value),
                        )
                      }
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Minimum party size for this table
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isBookableType && (
              <FormField
                control={form.control}
                name="turnTimeMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Turn Time (minutes)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Default: 15"
                        min={0}
                        step={5}
                        {...field}
                        value={field.value ?? ""}
                        disabled={isPending}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? undefined
                              : parseInt(e.target.value),
                          )
                        }
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Buffer time between reservations
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </div>

        <Separator />

        {/* Hierarchy & Layout */}
        <div>
          <h3 className="text-lg font-medium mb-4">Location & Layout</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="parent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Space</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="None (top-level)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {parentSpaces.map((space) => (
                        <SelectItem
                          key={space.id}
                          value={space.id as string}
                        >
                          {space.name} ({TABLE_SPACE_TYPE_LABELS[space.type]})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-xs">
                    Place inside a section, room, or area
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="floorPlan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Floor Plan</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {floorPlans.map((plan) => (
                        <SelectItem
                          key={plan.id}
                          value={plan.id as string}
                        >
                          {plan.name}
                          {plan.isDefault ? " (Default)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sortOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sort Order</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      min={0}
                      {...field}
                      value={field.value ?? ""}
                      disabled={isPending}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? undefined
                            : parseInt(e.target.value),
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Status & Options */}
        <div>
          <h3 className="text-lg font-medium mb-4">Status & Options</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {item && (
              <FormField
                control={form.control}
                name="tableStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Table Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Not set" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(TableStatus).map((status) => (
                          <SelectItem key={status} value={status}>
                            {TABLE_STATUS_LABELS[status]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="#000000"
                      {...field}
                      value={field.value ?? ""}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Display color on floor plan
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex justify-between items-center space-x-3 space-y-0 rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="cursor-pointer">Active</FormLabel>
                    <FormDescription className="text-xs">
                      Table is in service
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isPending}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {isBookableType && (
              <FormField
                control={form.control}
                name="reservable"
                render={({ field }) => (
                  <FormItem className="flex justify-between items-center space-x-3 space-y-0 rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="cursor-pointer">
                        Reservable
                      </FormLabel>
                      <FormDescription className="text-xs">
                        Accepts reservations
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isPending}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="needsCleaning"
              render={({ field }) => (
                <FormItem className="flex justify-between items-center space-x-3 space-y-0 rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="cursor-pointer">
                      Needs Cleaning
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Flag for cleaning
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isPending}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {item && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="flex justify-between items-center space-x-3 space-y-0 rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="cursor-pointer">Status</FormLabel>
                      <FormDescription className="text-xs">
                        {item.status ? "Active" : "Inactive"}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isPending}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
          </div>
        </div>

        <Separator />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Optional description..."
                  {...field}
                  value={field.value ?? ""}
                  disabled={isPending}
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex h-5 items-center space-x-4 mt-4">
          <CancelButton />
          <Separator orientation="vertical" />
          <SubmitButton
            isPending={isPending}
            label={item ? "Update Table/Space" : "Add Table/Space"}
          />
        </div>
      </form>
    </Form>
  );
}

export default SpaceForm;
