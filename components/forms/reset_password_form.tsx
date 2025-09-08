"use client";

import { FormResponse } from "@/types/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useState, useTransition } from "react";
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
import { ResetPasswordSchema } from "@/types/data-schemas";
import { resetPassword } from "@/lib/actions/auth-actions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import Link from "next/link";
import { FormError } from "../widgets/form-error";
import { motion } from "framer-motion";
import {
  Mail,
  KeyRound,
  Send,
  Loader2,
  ShieldCheck,
  Sparkles,
  Lock,
} from "lucide-react";

function ResetPasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>("");
  const [, setSuccess] = useState<string | undefined>("");
  const [persistentError, setPersistentError] = useState<string | undefined>(
    "",
  );
  const [emailSent, setEmailSent] = useState<boolean>(false);

  const form = useForm<z.infer<typeof ResetPasswordSchema>>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      email: "",
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldUnregister: false,
  });

  const { reset } = form;

  const submitData = useCallback(
    (values: z.infer<typeof ResetPasswordSchema>) => {
      setError("");
      setPersistentError("");
      setSuccess("");

      startTransition(async () => {
        try {
          const data: FormResponse = await resetPassword(values);

          if (!data) {
            const errorMsg = "An unexpected error occurred. Please try again.";
            setError(errorMsg);
            setPersistentError(errorMsg);
            return;
          }

          if (data.responseType === "error") {
            setError(data.message);
            setPersistentError(data.message);
            // Don't reload on error - let user fix and retry
            return;
          }

          // Success
          setSuccess(data.message);
          setEmailSent(true);
          reset();
        } catch (err: any) {
          console.error("Reset password error:", err);
          const errorMsg = "An unexpected error occurred. Please try again.";
          setError(errorMsg);
          setPersistentError(errorMsg);
        }
      });
    },
    [reset],
  );

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
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 p-0.5">
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                  <motion.div
                    key={emailSent ? "mail" : "key"}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                      duration: 0.4,
                    }}
                  >
                    {emailSent ? (
                      <Mail className="w-8 h-8 text-green-600" />
                    ) : (
                      <KeyRound className="w-8 h-8 text-green-600" />
                    )}
                  </motion.div>
                </div>
              </div>
            </motion.div>

            <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {emailSent ? "Check Your Email" : "Reset Your Password"}
            </CardTitle>
            <CardDescription className="text-center text-gray-600 pt-2">
              {emailSent
                ? "We've sent password reset instructions to your email address."
                : "Enter your email address and we'll send you a link to reset your password"}
            </CardDescription>
          </CardHeader>

          <CardContent className="pb-8 px-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {(persistentError || error) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4"
                >
                  <FormError message={persistentError || error} />
                </motion.div>
              )}

              {!emailSent ? (
                <Form {...form}>
                  <form
                    className="space-y-6"
                    onSubmit={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      form.handleSubmit(submitData)(e);
                    }}
                    noValidate
                  >
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-500" />
                            Email address *
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="Enter your email address"
                              {...field}
                              disabled={isPending}
                              className="h-12 border-gray-200 focus:border-emerald-500 transition-all duration-300 bg-gray-50/50 hover:bg-white"
                              autoComplete="email"
                            />
                          </FormControl>
                          <FormDescription className="text-gray-500 flex items-start gap-2 mt-2">
                            <Sparkles className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                            <span>
                              We&#39;ll send you a secure link to reset your
                              password
                            </span>
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4">
                      <Button
                        type="submit"
                        disabled={isPending}
                        className="w-full h-12 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-emerald-500/25"
                      >
                        {isPending ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Sending Reset Link...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Send className="w-5 h-5" />
                            Send Reset Link
                          </span>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-6"
                >
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-left space-y-3">
                    <p className="text-sm text-emerald-800 font-medium flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      What happens next?
                    </p>
                    <ul className="text-sm text-emerald-700 space-y-2 ml-6">
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-500 mt-1">•</span>
                        Check your inbox for an email from us
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-500 mt-1">•</span>
                        Click the secure link in the email
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-500 mt-1">•</span>
                        Create your new password
                      </li>
                    </ul>
                  </div>

                  <Button
                    onClick={() => setEmailSent(false)}
                    variant="outline"
                    className="w-full h-12 border-gray-200 hover:bg-gray-50 transition-all duration-300"
                  >
                    Didn&#39;t receive the email? Try again
                  </Button>
                </motion.div>
              )}
            </motion.div>
          </CardContent>

          <div className="border-t border-gray-100 bg-gray-50/50 px-8 py-6 text-center">
            <p className="text-sm text-gray-600">
              Remember your password ?{" "}
              <Link
                href="/login"
                className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                Sign in instead
              </Link>
            </p>
          </div>
        </Card>

        {/* Security note */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-xs text-gray-500 flex items-center justify-center gap-2">
            <Lock className="w-3 h-3" />
            Password reset links expire after 24 hours for security
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
}

export default ResetPasswordForm;
