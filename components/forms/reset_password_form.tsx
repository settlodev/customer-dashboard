"use client";

import { FormResponse } from "@/types/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { ResetPasswordSchema, NewPasswordSchema } from "@/types/data-schemas";
import {
  resetPassword,
  verifyResetCode,
  verifyResetToken,
  confirmNewPassword,
} from "@/lib/actions/auth-actions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import Link from "next/link";
import { FormError } from "../widgets/form-error";
import { FormSuccess } from "../widgets/form-success";
import { motion } from "framer-motion";
import {
  Mail,
  KeyRound,
  Send,
  Loader2,
  ShieldCheck,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

type ResetStep = "email" | "code" | "password" | "done";

interface ResetPasswordFormProps {
  /** Token from email reset link (?token= query param) */
  linkToken?: string | null;
  /** "create" when setting a password for the first time (e.g. staff invite) */
  action?: string | null;
}

function ResetPasswordForm({ linkToken, action }: ResetPasswordFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [step, setStep] = useState<ResetStep>(linkToken ? "password" : "email");
  const [userId, setUserId] = useState<string>("");
  const [resetToken, setResetToken] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [linkTokenHandled, setLinkTokenHandled] = useState(false);

  // Handle ?token= from password reset email links
  useEffect(() => {
    if (!linkToken || linkTokenHandled) return;
    setLinkTokenHandled(true);

    startTransition(async () => {
      try {
        const data = await verifyResetToken(linkToken);

        if (data.responseType === "error") {
          setError(data.message);
          setStep("email"); // Fall back to email step
          return;
        }

        if (data.data && (data.data as any).resetToken) {
          setResetToken((data.data as any).resetToken);
        }
        setSuccess("Link verified. Set your new password.");
        setStep("password");
      } catch {
        setError("Invalid or expired reset link. Please request a new one.");
        setStep("email");
      }
    });
  }, [linkToken, linkTokenHandled]);

  const emailForm = useForm<z.infer<typeof ResetPasswordSchema>>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: { email: "" },
    mode: "onSubmit",
  });

  const passwordForm = useForm<z.infer<typeof NewPasswordSchema>>({
    resolver: zodResolver(NewPasswordSchema),
    defaultValues: { password: "" },
    mode: "onSubmit",
  });

  // Step 1: Request password reset
  const submitEmail = useCallback(
    (values: z.infer<typeof ResetPasswordSchema>) => {
      setError("");
      setSuccess("");

      startTransition(async () => {
        try {
          const data: FormResponse = await resetPassword(values);

          if (data.responseType === "error") {
            setError(data.message);
            return;
          }

          if (data.data && (data.data as any).userId) {
            setUserId((data.data as any).userId);
          }
          setSuccess("A reset code has been sent to your email.");
          setStep("code");
        } catch {
          setError("An unexpected error occurred. Please try again.");
        }
      });
    },
    [],
  );

  // Step 2: Verify reset code
  const submitCode = useCallback(() => {
    if (verificationCode.length !== 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    setError("");
    setSuccess("");

    startTransition(async () => {
      try {
        const data: FormResponse = await verifyResetCode(
          userId,
          verificationCode,
        );

        if (data.responseType === "error") {
          setError(data.message);
          return;
        }

        if (data.data && (data.data as any).resetToken) {
          setResetToken((data.data as any).resetToken);
        }
        setSuccess("Code verified! Set your new password.");
        setStep("password");
      } catch {
        setError("An unexpected error occurred. Please try again.");
      }
    });
  }, [userId, verificationCode]);

  // Step 3: Set new password
  const submitNewPassword = useCallback(
    (values: z.infer<typeof NewPasswordSchema>) => {
      setError("");
      setSuccess("");

      startTransition(async () => {
        try {
          const data: FormResponse = await confirmNewPassword(
            resetToken,
            values.password,
          );

          if (data.responseType === "error") {
            setError(data.message);
            return;
          }

          setSuccess(data.message);
          setStep("done");

          setTimeout(() => {
            window.location.href = "/login";
          }, 3000);
        } catch {
          setError("An unexpected error occurred. Please try again.");
        }
      });
    },
    [resetToken],
  );

  const getIcon = () => {
    switch (step) {
      case "email":
        return <KeyRound className="w-8 h-8 text-primary" />;
      case "code":
        return <Mail className="w-8 h-8 text-primary" />;
      case "password":
        return <Lock className="w-8 h-8 text-primary" />;
      case "done":
        return <CheckCircle className="w-8 h-8 text-primary" />;
    }
  };

  const isCreateAction = action === "create";

  const getTitle = () => {
    switch (step) {
      case "email":
        return "Reset Your Password";
      case "code":
        return "Enter Verification Code";
      case "password":
        return isCreateAction ? "Create Your Password" : "Set New Password";
      case "done":
        return isCreateAction ? "Password Created!" : "Password Updated!";
    }
  };

  const getDescription = () => {
    switch (step) {
      case "email":
        return "Enter your email address and we'll send you a code to reset your password";
      case "code":
        return "Enter the 6-digit code sent to your email";
      case "password":
        return isCreateAction
          ? "Set up a secure password to protect your account"
          : "Choose a strong new password for your account";
      case "done":
        return "Your password has been updated. Redirecting to login...";
    }
  };

  return (
    <section className="flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <motion.div
              className="flex justify-center mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 15,
                delay: 0.2,
              }}
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-orange-600 p-0.5">
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                  <motion.div
                    key={step}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                    }}
                  >
                    {getIcon()}
                  </motion.div>
                </div>
              </div>
            </motion.div>

            <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {getTitle()}
            </CardTitle>
            <CardDescription className="text-center text-gray-600 pt-2">
              {getDescription()}
            </CardDescription>
          </CardHeader>

          <CardContent className="pb-8 px-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4"
                >
                  <FormError message={error} />
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4"
                >
                  <FormSuccess message={success} />
                </motion.div>
              )}

              {/* Step 1: Email */}
              {step === "email" && (
                <Form {...emailForm}>
                  <form
                    className="space-y-6"
                    onSubmit={(e) => {
                      e.preventDefault();
                      emailForm.handleSubmit(submitEmail)(e);
                    }}
                    noValidate
                  >
                    <FormField
                      control={emailForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email address *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                              <Input
                                className="pl-10"
                                type="email"
                                placeholder="Enter your email address"
                                {...field}
                                disabled={isPending}
                                autoComplete="email"
                              />
                            </div>
                          </FormControl>
                          <FormDescription className="text-gray-500 flex items-start gap-2 mt-2">
                            <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <span>
                              We&#39;ll send you a 6-digit code to reset your
                              password
                            </span>
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={isPending}
                      className="w-full h-12 bg-gradient-to-r from-primary to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-primary/25"
                    >
                      {isPending ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Sending Code...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Send className="w-5 h-5" />
                          Send Reset Code
                        </span>
                      )}
                    </Button>
                  </form>
                </Form>
              )}

              {/* Step 2: Code Verification */}
              {step === "code" && (
                <div className="space-y-6">
                  <div className="flex flex-col items-center space-y-6">
                    <InputOTP
                      maxLength={6}
                      value={verificationCode}
                      onChange={(value) => setVerificationCode(value)}
                      disabled={isPending}
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

                    <Button
                      onClick={submitCode}
                      disabled={isPending || verificationCode.length !== 6}
                      className="w-full h-12 bg-gradient-to-r from-primary to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-primary/25"
                    >
                      {isPending ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Verifying...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Verify Code
                          <ArrowRight className="w-5 h-5" />
                        </span>
                      )}
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setStep("email");
                      setError("");
                      setSuccess("");
                    }}
                    className="w-full"
                  >
                    Didn&#39;t receive the code? Try again
                  </Button>
                </div>
              )}

              {/* Step 3: New Password */}
              {step === "password" && (
                <Form {...passwordForm}>
                  <form
                    className="space-y-6"
                    onSubmit={(e) => {
                      e.preventDefault();
                      passwordForm.handleSubmit(submitNewPassword)(e);
                    }}
                    noValidate
                  >
                    <FormField
                      control={passwordForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your new password"
                                {...field}
                                disabled={isPending}
                                className="pl-10 pr-12"
                                autoComplete="new-password"
                              />
                              <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-md hover:bg-gray-100"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </FormControl>
                          <FormDescription className="text-gray-500 flex items-start gap-2 mt-2">
                            <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <span>
                              Choose a strong password with at least 8 characters
                            </span>
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={isPending}
                      className="w-full h-12 bg-gradient-to-r from-primary to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-primary/25"
                    >
                      {isPending ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          {isCreateAction ? "Creating Password..." : "Updating Password..."}
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <ShieldCheck className="w-5 h-5" />
                          {isCreateAction ? "Create Password" : "Update Password"}
                        </span>
                      )}
                    </Button>
                  </form>
                </Form>
              )}

              {/* Step 4: Done */}
              {step === "done" && (
                <div className="space-y-6">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-left space-y-3">
                    <p className="text-sm text-orange-800 font-medium flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      Password successfully updated!
                    </p>
                    <p className="text-sm text-orange-700">
                      You&#39;ll be automatically redirected to the login page.
                    </p>
                  </div>

                  <Button
                    onClick={() => (window.location.href = "/login")}
                    className="w-full h-12 bg-gradient-to-r from-primary to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium rounded-lg transition-all duration-300"
                  >
                    Go to Login
                  </Button>
                </div>
              )}
            </motion.div>
          </CardContent>

          {step === "email" && (
            <div className="border-t border-gray-100 bg-gray-50/50 px-8 py-6 text-center">
              <p className="text-sm text-gray-600">
                Remember your password ?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-primary hover:text-orange-700 transition-colors"
                >
                  Sign in instead
                </Link>
              </p>
            </div>
          )}
        </Card>

        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-xs text-gray-500 flex items-center justify-center gap-2">
            <Lock className="w-3 h-3" />
            Password reset codes expire after 15 minutes for security
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
}

export default ResetPasswordForm;
