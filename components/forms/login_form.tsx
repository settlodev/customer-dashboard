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
import {useCallback, useState, useTransition} from "react";
import { FormResponse } from "@/types/types";
import { FormError } from "@/components/widgets/form-error";
import Link from "next/link";
import {EyeOffIcon, EyeIcon} from "lucide-react";
import {deleteActiveBusinessCookie, deleteActiveLocationCookie, deleteAuthCookie} from "@/lib/auth-utils";
import { DEFAULT_LOGIN_REDIRECT_URL } from "@/routes";

function LoginForm() {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string>("");
    const [showPassword, setShowPassword] = useState<boolean>(false);

    const form = useForm<z.infer<typeof LoginSchema>>({
        resolver: zodResolver(LoginSchema),
        defaultValues: {},
    });

    const clearUserData = () => {
        deleteAuthCookie();
        deleteActiveBusinessCookie();
        deleteActiveLocationCookie();
    }

    const submitData = useCallback((values: z.infer<typeof LoginSchema>) => {
        startTransition(() => {
            login(values)
                .then((data: FormResponse) => {
                    if (data) {
                        if (data.error === Error("Unexpected")) {
                            console.log("Error 1", data.error);
                            setError("Something went wrong while processing your credentials. Try again.");
                            clearUserData();
                            return;
                        }

                        if (data.responseType === "error") {
                            setError(data.message);
                            return;
                        }

                        // SUCCESS: Add delay to ensure session is properly set
                        if (data.responseType === "success") {
                            setTimeout(() => {
                                // Force a hard refresh to ensure middleware picks up the new session
                                window.location.href = DEFAULT_LOGIN_REDIRECT_URL;
                            }, 100);
                            return;
                        }
                    }
                })
                .catch((err: any) => {
                    //Sentry.captureException(err);
                    console.log("Error 3", err.message);
                    setError("Wrong credentials! Invalid email address and/or password");
                    clearUserData();
                    return;
                });
        });
    }, []);

    return (
        <section>
            <Card className="w-full mx-auto max-w-md mt-10 lg:mt-0 md:mt-0">
                <CardHeader>
                    <CardTitle>Welcome back</CardTitle>
                    <CardDescription>
                        Enter your credentials below to access your account
                    </CardDescription>
                </CardHeader>
            <CardContent className="pb-4 px-8">
                <FormError message={error}/>

                <Form {...form}>
                    <form className="space-y-6" onSubmit={form.handleSubmit(submitData)}>
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>Email address</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter email address" {...field} />
                                            </FormControl>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid gap-2">
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>Password</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        type={showPassword ? "text" : "password"}
                                                        placeholder="Enter password"
                                                        {...field}
                                                    />
                                                    <span
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-0 top-0 h-full w-10 flex items-center justify-center z-40 cursor-pointer">
                                                            {showPassword ? <EyeOffIcon size={20}/> : <EyeIcon size={20}/>}
                                                    </span>
                                                </div>
                                            </FormControl>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <Button type="submit" disabled={isPending} className="w-full">
                                {isPending ? "Signing in..." : "Login"}
                            </Button>
                        </div>
                    </form>
                </Form>
                <div className="grid gap-2 mt-6 text-center">
                    <Link href="/reset-password" className="text-sm text-slate-400">
                        Forgot password, <span className="font-bold text-emerald-500">click here</span> to
                        reset?
                    </Link>
                </div>
            </CardContent>
            <div className="font-light text-slate-400 mt-4 text-sm text-center border-t-1 py-6">
                <Link href="/register">Don&apos;t have an account? <span className="font-bold text-emerald-500">Register here</span></Link>
            </div>
        </Card>
  </section>
    )
}

export default LoginForm;