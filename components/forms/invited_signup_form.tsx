"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { RegisterSchema } from "@/types/data-schemas";
import { register as registerAction } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
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
import { PhoneInput } from "@/components/ui/phone-input";
import CountrySelector from "@/components/widgets/country-selector";
import { FormError } from "@/components/widgets/form-error";
import { EyeIcon, EyeOffIcon, Loader2Icon, ArrowRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Fallback country ISO for CountrySelector auto-select
const DEFAULT_COUNTRY_CODE = "TZ";
const defaultCountry = process.env.DEFAULT_COUNTRY;

export default function InvitedSignupForm({
  email,
  memberId,
}: {
  email: string;
  memberId: string;
}) {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email,
      phoneNumber: "",
      password: "",
      confirmPassword: "",
      countryId: defaultCountry ?? "",
      gender: undefined,
      referredByCode: "",
    },
  });

  const onSubmit = (values: z.infer<typeof RegisterSchema>) => {
    setError("");
    startTransition(async () => {
      const res = await registerAction({ ...values, email }, undefined, memberId);
      if (res.responseType === "error") {
        setError(res.message);
        return;
      }
      window.location.href = `/login?email=${encodeURIComponent(email)}`;
    });
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="w-full max-w-lg">
        <Card className="border-0 shadow-xl bg-white/90 dark:bg-card/90 backdrop-blur-sm overflow-hidden">
          <CardHeader className="pb-4 pt-8 px-8">
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-foreground">
              Create your Settlo account
            </CardTitle>
            <CardDescription className="text-gray-500 dark:text-muted-foreground">
              You&apos;ve been invited. Set up your credentials to get started.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8 space-y-5">
            {error && <FormError message={error} />}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Email — locked to invited address */}
                <FormItem>
                  <FormLabel className="text-sm text-gray-700 dark:text-foreground">
                    Email address
                  </FormLabel>
                  <FormControl>
                    <Input
                      value={email}
                      readOnly
                      disabled
                      type="email"
                      aria-label="Email address (locked)"
                      className="bg-gray-50 dark:bg-muted/50 cursor-not-allowed"
                    />
                  </FormControl>
                </FormItem>

                {/* First name / Last name */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-gray-700 dark:text-foreground">
                          First name
                        </FormLabel>
                        <FormControl>
                          <Input disabled={isPending} placeholder="John" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-gray-700 dark:text-foreground">
                          Last name
                        </FormLabel>
                        <FormControl>
                          <Input disabled={isPending} placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Phone number */}
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-gray-700 dark:text-foreground">
                        Phone number
                      </FormLabel>
                      <FormControl>
                        <PhoneInput
                          placeholder="Enter phone number"
                          {...field}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Gender / Country */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-gray-700 dark:text-foreground">
                          Gender
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value ?? ""}
                          disabled={isPending}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="MALE">Male</SelectItem>
                            <SelectItem value="FEMALE">Female</SelectItem>
                            <SelectItem value="UNDISCLOSED">Prefer not to say</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="countryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-gray-700 dark:text-foreground">
                          Country
                        </FormLabel>
                        <FormControl>
                          <CountrySelector
                            {...field}
                            defaultCode={DEFAULT_COUNTRY_CODE}
                            isDisabled={isPending}
                            placeholder="Select country"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Password / Confirm password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-gray-700 dark:text-foreground">
                          Password
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              disabled={isPending}
                              type={showPassword ? "text" : "password"}
                              placeholder="Min. 8 characters"
                              className="pr-10"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-muted-foreground hover:text-gray-600 dark:hover:text-foreground/80"
                              tabIndex={-1}
                            >
                              {showPassword ? (
                                <EyeOffIcon size={16} />
                              ) : (
                                <EyeIcon size={16} />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-gray-700 dark:text-foreground">
                          Confirm password
                        </FormLabel>
                        <FormControl>
                          <Input
                            disabled={isPending}
                            type={showPassword ? "text" : "password"}
                            placeholder="Re-enter password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isPending}
                  className="w-full h-11 bg-gradient-to-r from-primary to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium rounded-lg transition-all duration-200 shadow-md shadow-primary/20"
                >
                  {isPending ? (
                    <Loader2Icon className="w-4 h-4 animate-spin" />
                  ) : (
                    <span className="flex items-center gap-2">
                      Create account
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
