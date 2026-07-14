"use client";
import React, { useCallback, useState, useTransition } from "react";
import Image from "next/image";
import {
  Loader2Icon,
  PhoneCallIcon,
  UploadIcon,
  UserIcon,
  CheckCircle2,
  Mail,
  FileText,
  Camera,
} from "lucide-react";
import UploadImageWidget from "@/components/widgets/UploadImageWidget";
import { useSession } from "next-auth/react";
import { FieldErrors, useForm } from "react-hook-form";
import { z } from "zod";
import { UpdateUserSchema } from "@/types/data-schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateUser } from "@/lib/actions/auth-actions";
import { FormResponse } from "@/types/types";
import { Form, FormField, FormItem } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const PRIMARY = "#EB7F44";
const PRIMARY_LIGHT = "#fde8d8";
const SECONDARY = "#EAEAE5";

export default function UpdateProfileForm() {
  const session = useSession();
  const [imageUrl, setImageUrl] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>("");
  const { toast } = useToast();

  const form = useForm<z.infer<typeof UpdateUserSchema>>({
    resolver: zodResolver(UpdateUserSchema),
    defaultValues: {
      firstName: session.data?.user?.firstName,
      lastName: session.data?.user?.lastName,
      email: session.data?.user?.email,
      phoneNumber: session.data?.user?.phoneNumber,
      country: session.data?.user?.country,
      bio: session.data?.user?.bio,
    },
  });

  const onInvalid = useCallback(
    (errors: FieldErrors) => {
      toast({
        variant: "destructive",
        title: "Please check your inputs",
        description: "Some fields have errors. Please review and try again.",
      });
    },
    [toast],
  );

  const submitData = async (values: z.infer<typeof UpdateUserSchema>) => {
    if (imageUrl) values.avatar = imageUrl;
    setError("");
    startTransition(() => {
      updateUser(values)
        .then((data: FormResponse) => {
          if (!data) {
            setError("An unexpected error occurred. Please try again.");
            return;
          }
          if (data.responseType === "error") {
            setError(data.message);
            toast({
              variant: "destructive",
              title: "Update failed",
              description: data.message,
            });
          } else {
            toast({ title: "Profile updated successfully!" });
            window.location.reload();
          }
        })
        .catch((err) => {
          setError(err?.data?.message ?? "Something went wrong.");
        });
    });
  };

  const currentAvatar = imageUrl
    ? imageUrl
    : session.data?.user?.image
      ? session.data?.user?.image
      : null;

  const initials = [
    session.data?.user?.firstName?.[0],
    session.data?.user?.lastName?.[0],
  ]
    .filter(Boolean)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your personal information and photo
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div
            className="mb-4 px-4 py-3 rounded-lg text-sm text-red-700 flex items-center gap-2"
            style={{ backgroundColor: "#fee2e2", border: "1px solid #fca5a5" }}
          >
            <span className="font-medium">Error:</span> {error}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(submitData, onInvalid)}>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* ── LEFT: Photo card ── */}
              <div className="xl:col-span-1">
                <div
                  className="bg-white rounded-lg overflow-hidden"
                  style={{ border: `1px solid ${SECONDARY}` }}
                >
                  <div className="p-6">
                    <p
                      className="text-xs uppercase tracking-widest font-semibold mb-5"
                      style={{ color: PRIMARY }}
                    >
                      Profile Photo
                    </p>

                    {/* Avatar preview */}
                    <div className="flex flex-col items-center mb-6">
                      <div className="relative">
                        <div
                          className="h-24 w-24 rounded-full overflow-hidden flex items-center justify-center text-2xl font-bold text-white"
                          style={{
                            border: `3px solid ${PRIMARY}`,
                            backgroundColor: currentAvatar
                              ? "transparent"
                              : PRIMARY,
                          }}
                        >
                          {currentAvatar ? (
                            <Image
                              src={currentAvatar}
                              width={96}
                              height={96}
                              alt="Profile"
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            initials || <UserIcon size={32} />
                          )}
                        </div>
                        <div
                          className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: PRIMARY }}
                        >
                          <Camera size={13} className="text-white" />
                        </div>
                      </div>
                      <p className="mt-3 font-semibold text-gray-900 text-sm">
                        {session.data?.user?.firstName}{" "}
                        {session.data?.user?.lastName}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {session.data?.user?.email}
                      </p>
                    </div>

                    {/* Upload zone */}
                    <label
                      className="relative block w-full cursor-pointer rounded-lg border-2 border-dashed py-6 px-4 text-center transition-colors"
                      style={{
                        borderColor: `${PRIMARY}66`,
                        backgroundColor: PRIMARY_LIGHT,
                      }}
                    >
                      <div className="hidden">
                        <UploadImageWidget
                          setImage={setImageUrl}
                          imagePath="profiles"
                        />
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <div
                          className="h-9 w-9 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: PRIMARY }}
                        >
                          <UploadIcon size={16} className="text-white" />
                        </div>
                        <p className="text-sm text-gray-600">
                          <span
                            className="font-semibold"
                            style={{ color: PRIMARY }}
                          >
                            Click to upload
                          </span>{" "}
                          or drag and drop
                        </p>
                        <p className="text-xs text-gray-400">
                          PNG, JPG up to 5MB
                        </p>
                      </div>
                    </label>

                    {imageUrl && (
                      <div
                        className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium"
                        style={{ backgroundColor: "#dcfce7", color: "#15803d" }}
                      >
                        <CheckCircle2 size={14} />
                        New photo selected — save to apply
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── RIGHT: Info card ── */}
              <div className="xl:col-span-2">
                <div
                  className="bg-white rounded-lg overflow-hidden"
                  style={{ border: `1px solid ${SECONDARY}` }}
                >
                  <div className="p-6 lg:p-8">
                    <p
                      className="text-xs uppercase tracking-widest font-semibold mb-6"
                      style={{ color: PRIMARY }}
                    >
                      Personal Information
                    </p>

                    {/* First + Last name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field, fieldState }) => (
                          <FormItem>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
                              First Name
                            </label>
                            <div className="relative">
                              <UserIcon
                                size={15}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                              />
                              <input
                                className="w-full rounded-lg border py-2.5 pl-9 pr-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400"
                                style={{
                                  borderColor: fieldState.error
                                    ? "#f87171"
                                    : SECONDARY,
                                  backgroundColor: fieldState.error
                                    ? "#fef2f2"
                                    : "#fafafa",
                                }}
                                placeholder="First name"
                                disabled={isPending}
                                {...field}
                              />
                            </div>
                            {fieldState.error && (
                              <p className="text-xs text-red-500 mt-1">
                                {fieldState.error.message}
                              </p>
                            )}
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field, fieldState }) => (
                          <FormItem>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
                              Last Name
                            </label>
                            <div className="relative">
                              <UserIcon
                                size={15}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                              />
                              <input
                                className="w-full rounded-lg border py-2.5 pl-9 pr-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400"
                                style={{
                                  borderColor: fieldState.error
                                    ? "#f87171"
                                    : SECONDARY,
                                  backgroundColor: fieldState.error
                                    ? "#fef2f2"
                                    : "#fafafa",
                                }}
                                placeholder="Last name"
                                disabled={isPending}
                                {...field}
                              />
                            </div>
                            {fieldState.error && (
                              <p className="text-xs text-red-500 mt-1">
                                {fieldState.error.message}
                              </p>
                            )}
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Phone + Email (read-only) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <FormField
                        control={form.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
                              Phone Number
                            </label>
                            <div className="relative">
                              <PhoneCallIcon
                                size={15}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                              />
                              <CheckCircle2
                                size={15}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500"
                              />
                              <input
                                className="w-full rounded-lg border py-2.5 pl-9 pr-9 text-sm text-gray-500 outline-none cursor-not-allowed"
                                style={{
                                  borderColor: SECONDARY,
                                  backgroundColor: "#f5f5f5",
                                }}
                                readOnly
                                {...field}
                              />
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              Verified · cannot be changed
                            </p>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
                              Email Address
                            </label>
                            <div className="relative">
                              <Mail
                                size={15}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                              />
                              <CheckCircle2
                                size={15}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500"
                              />
                              <input
                                className="w-full rounded-lg border py-2.5 pl-9 pr-9 text-sm text-gray-500 outline-none cursor-not-allowed"
                                style={{
                                  borderColor: SECONDARY,
                                  backgroundColor: "#f5f5f5",
                                }}
                                type="email"
                                readOnly
                                {...field}
                              />
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              Verified · cannot be changed
                            </p>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Bio */}
                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field, fieldState }) => (
                        <FormItem className="mb-6">
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
                            Bio
                          </label>
                          <div className="relative">
                            <FileText
                              size={15}
                              className="absolute left-3 top-3 text-gray-400"
                            />
                            <textarea
                              className="w-full rounded-lg border py-2.5 pl-9 pr-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 resize-none"
                              style={{
                                borderColor: fieldState.error
                                  ? "#f87171"
                                  : SECONDARY,
                                backgroundColor: fieldState.error
                                  ? "#fef2f2"
                                  : "#fafafa",
                              }}
                              rows={4}
                              placeholder="Write a short bio about yourself…"
                              disabled={isPending}
                              {...field}
                            />
                          </div>
                          {fieldState.error && (
                            <p className="text-xs text-red-500 mt-1">
                              {fieldState.error.message}
                            </p>
                          )}
                        </FormItem>
                      )}
                    />

                    {/* Actions */}
                    <div
                      className="flex items-center justify-between pt-5"
                      style={{ borderTop: `1px solid ${SECONDARY}` }}
                    >
                      <p className="text-xs text-gray-400">
                        Changes are saved immediately after submitting
                      </p>
                      <Button
                        type="submit"
                        disabled={isPending}
                        className="px-6 py-2.5 text-sm font-semibold text-white rounded-lg transition-colors disabled:opacity-50"
                        style={{ backgroundColor: PRIMARY }}
                      >
                        {isPending ? (
                          <span className="flex items-center gap-2">
                            <Loader2Icon className="h-4 w-4 animate-spin" />
                            Saving…
                          </span>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
