"use client";

import { LoginSchema } from "@/types/data-schemas";
import { login } from "@/lib/actions/auth-actions";
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
import { FormResponse } from "@/types/types";
import { FormError } from "@/components/widgets/form-error";
import Link from "next/link";
import {
  EyeOffIcon,
  EyeIcon,
  Mail,
  Lock,
  Loader2,
  ArrowRight,
  Shield,
  UserCheck,
} from "lucide-react";
import { DEFAULT_LOGIN_REDIRECT_URL } from "@/routes";
import { motion } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import { deleteAuthCookie } from "@/lib/auth-utils";

function LoginForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");
  const [persistentError, setPersistentError] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(false);

  useEffect(() => {
    deleteAuthCookie();
  }, []);

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldUnregister: false,
  });

  const submitData = useCallback((values: z.infer<typeof LoginSchema>) => {
    setError("");
    setPersistentError("");

    startTransition(async () => {
      try {
        const data: FormResponse = await login(values);

        if (data) {
          if (data.error === Error("Unexpected")) {
            console.error("Login error:", data.error);
            const errorMsg =
              "Something went wrong while processing your request, please try again.";
            setError(errorMsg);
            setPersistentError(errorMsg);
            return;
          }

          if (data.responseType === "error") {
            setError(data.message);
            setPersistentError(data.message);
            return;
          }

          // SUCCESS
          if (data.responseType === "success") {
            // Clear errors
            setError("");
            setPersistentError("");

            // Show success state briefly
            setTimeout(() => {
              window.location.href = DEFAULT_LOGIN_REDIRECT_URL;
            }, 100);
            return;
          }
        }
      } catch (err: any) {
        const errorMsg = err.message ?? "Invalid email address and/or password";
        setError(errorMsg);
        setPersistentError(errorMsg);
      }
    });
  }, []);

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
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 p-0.5">
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                  <Shield className="w-8 h-8 text-emerald-600" />
                </div>
              </div>
            </motion.div>

            <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              Enter your credentials to access your account
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

              <Form {...form}>
                <form
                  className="space-y-6"
                  onSubmit={(e) => {
                    e.preventDefault();
                    form.handleSubmit(submitData)(e);
                  }}
                  noValidate
                >
                  <div className="space-y-4">
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
                              placeholder="Enter your email address"
                              {...field}
                              type="email"
                              disabled={isPending}
                              className="h-12 border-gray-200 focus:border-emerald-500 transition-all duration-300 bg-gray-50/50 hover:bg-white"
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
                          <FormLabel className="text-gray-700 flex items-center gap-2">
                            <Lock className="w-4 h-4 text-gray-500" />
                            Password *
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                {...field}
                                disabled={isPending}
                                className="h-12 pr-12 border-gray-200 focus:border-emerald-500 transition-all duration-300 bg-gray-50/50 hover:bg-white"
                                autoComplete="current-password"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={isPending}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-md hover:bg-gray-100"
                              >
                                {showPassword ? (
                                  <EyeOffIcon className="w-5 h-5" />
                                ) : (
                                  <EyeIcon className="w-5 h-5" />
                                )}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remember"
                        checked={rememberMe}
                        onCheckedChange={(checked) =>
                          setRememberMe(checked as boolean)
                        }
                        disabled={isPending}
                        className="border-gray-300 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                      />
                      <label
                        htmlFor="remember"
                        className="text-sm font-medium text-gray-700 cursor-pointer select-none"
                      >
                        Remember me
                      </label>
                    </div>

                    <Link
                      href="/reset-password"
                      className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    disabled={isPending}
                    className="w-full h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-emerald-500/25"
                  >
                    {isPending ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Signing in...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <UserCheck className="w-5 h-5" />
                        Sign In
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                </form>
              </Form>
            </motion.div>
          </CardContent>

          <div className="border-t border-gray-100 bg-gray-50/50 px-8 py-6 text-center">
            <p className="text-sm text-gray-600">
              Don&#39;t have an account?{" "}
              <Link
                href="/register"
                className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                Sign up for free
              </Link>
            </p>
          </div>
        </Card>

        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-xs text-gray-500 flex items-center justify-center gap-2">
            <Shield className="w-3 h-3" />
            All data is encrypted and stored securely on our servers.{" "}
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
}

export default LoginForm;
