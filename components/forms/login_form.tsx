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
  Loader2,
  ArrowRight,
  Shield,
} from "lucide-react";
import { DEFAULT_LOGIN_REDIRECT_URL } from "@/routes";
import { motion } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import { deleteAuthCookie } from "@/lib/auth-utils";
import SocialAuthButtons from "@/components/widgets/social-auth-buttons";

function LoginForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(false);

  useEffect(() => {
    deleteAuthCookie();
  }, []);

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldUnregister: false,
  });

  const submitData = useCallback(
    (values: z.infer<typeof LoginSchema>) => {
      setError("");
      startTransition(async () => {
        try {
          const data: FormResponse = await login(values, rememberMe);
          if (!data) return;
          if (data.responseType === "needs_verification") {
            window.location.href = "/user-verification";
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
    [rememberMe],
  );

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[440px]"
      >
        <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm overflow-hidden">
          <CardHeader className="pb-4 pt-8 px-8">
            <CardTitle className="text-2xl font-bold text-center text-gray-900">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-center text-gray-500">
              Sign in to your account to continue
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

            <Form {...form}>
              <form
                className="space-y-4"
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
                      <FormLabel className="text-gray-700 text-sm">
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="you@example.com"
                          {...field}
                          type="email"
                          disabled={isPending}
                          autoComplete="email"
                          className="h-11"
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
                        <FormLabel className="text-gray-700 text-sm">
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
                            className="h-11 pr-11"
                            autoComplete="current-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isPending}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
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
                    className="border-gray-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <label
                    htmlFor="remember"
                    className="text-sm text-gray-600 cursor-pointer select-none"
                  >
                    Remember me for 30 days
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={isPending}
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
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-gray-400 font-medium">
                  or
                </span>
              </div>
            </div>

            <SocialAuthButtons
              mode="login"
              onError={(msg) => setError(msg)}
              disabled={isPending}
            />
          </CardContent>

          <div className="border-t border-gray-100 bg-gray-50/50 px-8 py-5 text-center">
            <p className="text-sm text-gray-600">
              Don&#39;t have an account?{" "}
              <Link
                href="/register"
                className="font-semibold text-primary hover:text-orange-700 transition-colors"
              >
                Create one
              </Link>
            </p>
          </div>
        </Card>

        <p className="mt-6 text-center text-xs text-gray-400 flex items-center justify-center gap-1.5">
          <Shield className="w-3 h-3" />
          Secured with end-to-end encryption
        </p>
      </motion.div>
    </div>
  );
}

export default LoginForm;
