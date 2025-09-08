
"use client";

import { DEFAULT_LOGIN_REDIRECT_URL } from "@/routes";
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
import { UpdatePasswordSchema } from "@/types/data-schemas";
import { updatePassword } from "@/lib/actions/auth-actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { useSearchParams } from "next/navigation";
import { FormError } from "../widgets/form-error";
import { FormSuccess } from "../widgets/form-success";
import { motion } from "framer-motion";
import {
  KeyRound,
  Eye,
  EyeOff,
  Save,
  Loader2,
  ShieldCheck,
  Sparkles,
  Lock,
  CheckCircle,
} from "lucide-react";

function UpdatePasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [passwordUpdated, setPasswordUpdated] = useState<boolean>(false);

  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const action = searchParams.get("action") || "update"; // 'update' or 'create'

  const form = useForm<z.infer<typeof UpdatePasswordSchema>>({
    resolver: zodResolver(UpdatePasswordSchema),
    defaultValues: {},
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldUnregister: false,
  });

  const { reset } = form;

  const submitData = useCallback(
    (values: z.infer<typeof UpdatePasswordSchema>) => {
      setError("");
      setSuccess("");

      const payload = {
        password: values.password,
        token: token as string,
      };

      startTransition(async () => {
        try {
          const data: FormResponse = await updatePassword(payload);

          if (!data) {
            setError("An unexpected error occurred. Please try again.");
            return;
          }

          if (data.responseType === "error") {
            setError(data.message);
            return;
          }

          // Success
          setSuccess(data.message);
          setPasswordUpdated(true);
          reset();
          
          setTimeout(() => {
            window.location.href = DEFAULT_LOGIN_REDIRECT_URL;
          }, 5000);
        } catch (err: any) {
          console.error("Update password error:", err);
          setError("An unexpected error occurred. Please try again.");
        }
      });
    },
    [token, reset]
  );

  const isCreateAction = action === "create";

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 p-0.5">
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                  <motion.div
                    key={passwordUpdated ? "check" : "key"}
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
                    {passwordUpdated ? (
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    ) : (
                      <KeyRound className="w-8 h-8 text-green-600" />
                    )}
                  </motion.div>
                </div>
              </div>
            </motion.div>

            <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {passwordUpdated
                ? "Password Updated!"
                : isCreateAction
                ? "Create Your Password"
                : "Update Your Password"}
            </CardTitle>
            <CardDescription className="text-center text-gray-600 pt-2">
              {passwordUpdated
                ? "Your password has been successfully updated. You'll be redirected shortly."
                : isCreateAction
                ? "Set up a secure password to protect your account"
                : "Enter your new password to secure your account"}
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

              {!passwordUpdated ? (
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
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 flex items-center gap-2">
                            <Lock className="w-4 h-4 text-gray-500" />
                            New Password *
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your new password"
                                {...field}
                                disabled={isPending}
                                className="h-12 border-gray-200 focus:border-blue-500 transition-all duration-300 bg-gray-50/50 hover:bg-white pr-12"
                                autoComplete="new-password"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-12 px-3 py-2 hover:bg-transparent"
                                onClick={togglePasswordVisibility}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4 text-gray-400" />
                                ) : (
                                  <Eye className="h-4 w-4 text-gray-400" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormDescription className="text-gray-500 flex items-start gap-2 mt-2">
                            <Sparkles className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                            <span>
                              Choose a strong password with at least 8 characters
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
                        className="w-full h-12 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-blue-500/25"
                      >
                        {isPending ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {isCreateAction ? "Creating Password..." : "Updating Password..."}
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Save className="w-5 h-5" />
                            {isCreateAction ? "Create Password" : "Update Password"}
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
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left space-y-3">
                    <p className="text-sm text-green-800 font-medium flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      Password successfully updated!
                    </p>
                    <ul className="text-sm text-green-700 space-y-2 ml-6">
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        Your account is now secured with your new password
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        You&apos;ll be automatically redirected in a few seconds
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        Use your new password for future logins
                      </li>
                    </ul>
                  </div>

                  <Button
                    onClick={() => (window.location.href = DEFAULT_LOGIN_REDIRECT_URL)}
                    className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-green-500/25"
                  >
                    Continue to Sign In
                  </Button>
                </motion.div>
              )}
            </motion.div>
          </CardContent>
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
            Your password is encrypted and stored securely
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
}

export default UpdatePasswordForm;