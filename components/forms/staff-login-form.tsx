"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, EyeIcon, EyeOffIcon, Loader2, ShieldCheck } from "lucide-react";

import { LoginSchema } from "@/types/data-schemas";
import { loginAsStaff } from "@/lib/actions/auth-actions";
import { ADMIN_DEFAULT_REDIRECT_URL } from "@/routes";
import { deleteStaffAuthCookie } from "@/lib/auth-utils";
import { executeRecaptcha } from "@/lib/recaptcha";
import { FormResponse } from "@/types/types";

import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { FormError } from "@/components/widgets/form-error";

export default function StaffLoginForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    deleteStaffAuthCookie();
  }, []);

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const onSubmit = useCallback((values: z.infer<typeof LoginSchema>) => {
    setError("");
    startTransition(async () => {
      try {
        let recaptchaToken: string | undefined;
        try {
          recaptchaToken = await executeRecaptcha("login");
        } catch {
          // reCAPTCHA is best-effort for staff — surface but don't block.
        }

        const data: FormResponse = await loginAsStaff(values, recaptchaToken);
        if (!data) return;

        if (data.responseType === "error") {
          setError(data.message);
          return;
        }

        if (data.responseType === "success") {
          window.location.href = ADMIN_DEFAULT_REDIRECT_URL;
        }
      } catch (err: any) {
        setError(err?.message ?? "Sign-in failed. Please try again.");
      }
    });
  }, []);

  return (
    <div className="w-full max-w-[440px]">
      <Card className="overflow-hidden border-0 bg-white shadow-2xl dark:bg-card">
        <CardHeader className="space-y-3 px-8 pb-4 pt-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-semibold tracking-tight text-ink">
            Settlo Staff Portal
          </CardTitle>
          <CardDescription className="font-mono text-[12px] text-muted-foreground">
            Internal access only. Customer accounts use the main dashboard.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 px-8 pb-8">
          {error && <FormError message={error} />}

          <Form {...form}>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                form.handleSubmit(onSubmit)(e);
              }}
              noValidate
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-ink">Work email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="firstname.lastname@settlo.co.tz"
                        autoComplete="email"
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-ink">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          autoComplete="current-password"
                          disabled={isPending}
                          className="pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          disabled={isPending}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-ink"
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOffIcon className="h-4 w-4" />
                          ) : (
                            <EyeIcon className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={isPending}
                className="h-11 w-full rounded-lg bg-gradient-to-r from-primary to-orange-600 font-medium text-white shadow-md shadow-primary/20 transition-all hover:from-orange-600 hover:to-orange-700"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign in
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>
          </Form>

          <p className="text-center font-mono text-[11px] text-muted-foreground">
            Access is invitation-only. Contact a system administrator to be
            added.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
