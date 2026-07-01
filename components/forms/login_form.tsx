"use client";

import { LoginSchema } from "@/types/data-schemas";
import { login, verifyMfaLogin } from "@/lib/actions/auth-actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { useCallback, useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { FormResponse } from "@/types/types";
import { FormError } from "@/components/widgets/form-error";
import Link from "next/link";
import {
  EyeOffIcon,
  EyeIcon,
  Loader2,
  ArrowRight,
  Shield,
  KeyRound,
  ArrowLeft,
} from "lucide-react";
import { DEFAULT_LOGIN_REDIRECT_URL } from "@/routes";
import { motion } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import { deleteAuthCookie } from "@/lib/auth-utils";
import { ACCOUNT_CTX_CACHE_KEY } from "@/components/sidebar/account-switcher";
import { executeRecaptcha } from "@/lib/recaptcha";
import SocialAuthButtons from "@/components/widgets/social-auth-buttons";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

type Step = "credentials" | "mfa";

function LoginForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  // Until this client component hydrates, the onSubmit handlers below aren't
  // attached, so a click/Enter falls back to a NATIVE browser submit — which
  // serializes email+password into the URL (visible, and written to the access
  // logs). Gate the submit button on this flag so the JS path owns the submit.
  const [mounted, setMounted] = useState<boolean>(false);

  // MFA challenge state (new model): the credentials step returns an mfaToken
  // and issues no session; the user completes the second factor separately via
  // verifyMfaLogin. A wrong code does NOT consume the token, so we keep the same
  // mfaToken across retries until success, lockout, or expiry.
  const [step, setStep] = useState<Step>("credentials");
  const [mfaToken, setMfaToken] = useState<string>("");
  const [mfaCode, setMfaCode] = useState<string>("");
  const [useRecoveryCode, setUseRecoveryCode] = useState<boolean>(false);

  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get("email") ?? "";

  useEffect(() => {
    deleteAuthCookie();
    setMounted(true);
    // A fresh login must not inherit the previous user's cached account list
    // (the switcher cache uses a fixed sessionStorage key, so it would otherwise
    // leak across logins in the same browser). Clear it at the session boundary.
    try {
      sessionStorage.removeItem(ACCOUNT_CTX_CACHE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: emailFromQuery, password: "" },
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldUnregister: false,
  });

  // Enter the MFA challenge with a fresh token. Clears any prior code/error so
  // an OAuth-triggered challenge and a password-triggered one look identical.
  const enterMfaStep = useCallback((token: string) => {
    setMfaToken(token);
    setMfaCode("");
    setUseRecoveryCode(false);
    setError("");
    setStep("mfa");
  }, []);

  // Return to the credentials step (token expired / locked, or user backed out).
  const resetToCredentials = useCallback((message?: string) => {
    setStep("credentials");
    setMfaToken("");
    setMfaCode("");
    setUseRecoveryCode(false);
    setError(message ?? "");
  }, []);

  const submitData = useCallback(
    (values: z.infer<typeof LoginSchema>) => {
      setError("");
      startTransition(async () => {
        try {
          let recaptchaToken: string | undefined;
          try {
            recaptchaToken = await executeRecaptcha("login");
          } catch (recaptchaErr) {
            console.error("[LOGIN] reCAPTCHA failed:", recaptchaErr);
            setError(
              "Security verification failed. Please refresh the page and try again.",
            );
            return;
          }

          const data: FormResponse = await login(
            values,
            rememberMe,
            recaptchaToken,
          );
          if (!data) return;
          if (data.responseType === "mfa_required") {
            const token = (data.data as { mfaToken?: string } | undefined)
              ?.mfaToken;
            if (token) {
              enterMfaStep(token);
            } else {
              setError(
                data.message ||
                  "Multi-factor authentication is required. Please try again.",
              );
            }
            return;
          }
          if (data.responseType === "needs_verification") {
            window.location.href = "/email-verification";
            return;
          }
          if (data.responseType === "error") {
            setError(data.message);
            return;
          }
          if (data.responseType === "success") {
            window.location.href = DEFAULT_LOGIN_REDIRECT_URL;
          }
        } catch (err: any) {
          setError(err.message ?? "Invalid email address and/or password");
        }
      });
    },
    [rememberMe, enterMfaStep],
  );

  const submitMfa = useCallback(() => {
    if (isPending) return; // double-submit guard
    const code = mfaCode.trim();
    if (!code) {
      setError(
        useRecoveryCode
          ? "Please enter a recovery code."
          : "Please enter the 6-digit code from your authenticator app.",
      );
      return;
    }
    setError("");
    startTransition(async () => {
      try {
        const data: FormResponse = await verifyMfaLogin(
          mfaToken,
          code,
          rememberMe,
        );
        if (!data) return;
        if (data.responseType === "success") {
          window.location.href = DEFAULT_LOGIN_REDIRECT_URL;
          return;
        }
        // Token expired / account locked → can't retry the code, restart.
        if ((data.data as { mfaExpired?: boolean } | undefined)?.mfaExpired) {
          resetToCredentials(data.message);
          return;
        }
        // Wrong code → keep the same token and let the user try again.
        setMfaCode("");
        setError(data.message);
      } catch (err: any) {
        setError(err.message ?? "Could not verify the code. Please try again.");
      }
    });
  }, [isPending, mfaCode, useRecoveryCode, mfaToken, rememberMe, resetToCredentials]);

  const isMfaStep = step === "mfa";

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[440px]"
      >
        <Card className="border-0 shadow-2xl bg-white/90 dark:bg-card/90 backdrop-blur-sm overflow-hidden">
          <CardHeader className="pb-4 pt-8 px-8">
            <CardTitle className="text-2xl font-bold text-center text-gray-900 dark:text-foreground">
              {isMfaStep ? "Two-factor authentication" : "Welcome Back"}
            </CardTitle>
            <CardDescription className="text-center text-gray-500 dark:text-muted-foreground">
              {isMfaStep
                ? useRecoveryCode
                  ? "Enter one of your recovery codes to continue"
                  : "Enter the code from your authenticator app to continue"
                : "Sign in to your account to continue"}
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-6 space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <FormError message={error} />
              </motion.div>
            )}

            {isMfaStep ? (
              <form
                className="space-y-5"
                method="post"
                onSubmit={(e) => {
                  e.preventDefault();
                  submitMfa();
                }}
                noValidate
              >
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-foreground">
                  <KeyRound className="w-4 h-4 text-primary" />
                  <span>
                    {useRecoveryCode
                      ? "Enter a recovery code you saved when enabling 2FA"
                      : "Enter the 6-digit code from your authenticator app"}
                  </span>
                </div>

                {useRecoveryCode ? (
                  <Input
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    placeholder="Recovery code"
                    disabled={isPending}
                    autoComplete="one-time-code"
                    autoFocus
                    className="text-center tracking-wider"
                  />
                ) : (
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={mfaCode}
                      onChange={(value) => setMfaCode(value)}
                      disabled={isPending}
                      autoFocus
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                )}

                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setUseRecoveryCode((v) => !v);
                      setMfaCode("");
                      setError("");
                    }}
                    disabled={isPending}
                    className="text-xs font-medium text-primary hover:text-orange-700 transition-colors disabled:opacity-50"
                  >
                    {useRecoveryCode
                      ? "Use your authenticator app instead"
                      : "Use a recovery code instead"}
                  </button>
                </div>

                <Button
                  type="submit"
                  disabled={isPending || !mfaCode.trim()}
                  className="w-full h-11 bg-gradient-to-r from-primary to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium rounded-lg transition-all duration-200 shadow-md shadow-primary/20"
                >
                  {isPending ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verifying...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Verify
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>

                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => resetToCredentials()}
                    disabled={isPending}
                    className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-muted-foreground hover:text-gray-700 dark:hover:text-foreground transition-colors disabled:opacity-50"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to sign in
                  </button>
                </div>
              </form>
            ) : (
              <>
                <Form {...form}>
                  <form
                    className="space-y-4"
                    // Defense-in-depth for the pre-hydration window: if a native
                    // submit slips through, POST keeps the credentials in the
                    // request body instead of leaking them into the URL/logs.
                    method="post"
                    onSubmit={(e) => {
                      e.preventDefault();
                      form.handleSubmit(submitData)(e);
                    }}
                    noValidate
                  >
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 dark:text-foreground text-sm">
                            Email
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="you@example.com"
                              {...field}
                              type="email"
                              disabled={isPending}
                              autoComplete="email"
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
                          <div className="flex items-center justify-between">
                            <FormLabel className="text-gray-700 dark:text-foreground text-sm">
                              Password
                            </FormLabel>
                            <Link
                              href="/reset-password"
                              className="text-xs font-medium text-primary hover:text-orange-700 transition-colors"
                              tabIndex={-1}
                            >
                              Forgot password?
                            </Link>
                          </div>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                {...field}
                                disabled={isPending}
                                className="pr-10"
                                autoComplete="current-password"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={isPending}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-muted-foreground hover:text-gray-600 dark:hover:text-foreground/80 transition-colors"
                                tabIndex={-1}
                              >
                                {showPassword ? (
                                  <EyeOffIcon className="w-4 h-4" />
                                ) : (
                                  <EyeIcon className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-center space-x-2 pt-1">
                      <Checkbox
                        id="remember"
                        checked={rememberMe}
                        onCheckedChange={(checked) =>
                          setRememberMe(checked as boolean)
                        }
                        disabled={isPending}
                        className="border-gray-300 dark:border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <label
                        htmlFor="remember"
                        className="text-sm text-gray-600 dark:text-foreground/80 cursor-pointer select-none"
                      >
                        Remember me for 30 days
                      </label>
                    </div>

                    <Button
                      type="submit"
                      disabled={isPending || !mounted}
                      className="w-full h-11 bg-gradient-to-r from-primary to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium rounded-lg transition-all duration-200 shadow-md shadow-primary/20"
                    >
                      {isPending ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Signing in...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Sign In
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      )}
                    </Button>
                  </form>
                </Form>

                <div className="relative pt-1">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200 dark:border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-card px-3 text-gray-400 dark:text-muted-foreground font-medium">
                      or
                    </span>
                  </div>
                </div>

                <SocialAuthButtons
                  mode="login"
                  onError={(msg) => setError(msg)}
                  onMfaRequired={(token) => enterMfaStep(token)}
                  disabled={isPending}
                />
              </>
            )}
          </CardContent>

          {!isMfaStep && (
            <div className="border-t border-gray-100 dark:border-border bg-gray-50/50 dark:bg-muted/30 px-8 py-5 text-center">
              <p className="text-sm text-gray-600 dark:text-foreground/80">
                Don&#39;t have an account?{" "}
                <Link
                  href="/register"
                  className="font-semibold text-primary hover:text-orange-700 transition-colors"
                >
                  Create one
                </Link>
              </p>
            </div>
          )}
        </Card>

        <p className="mt-6 text-center text-xs text-gray-400 dark:text-muted-foreground flex items-center justify-center gap-1.5">
          <Shield className="w-3 h-3" />
          Secured with end-to-end encryption
        </p>
      </motion.div>
    </div>
  );
}

export default LoginForm;
