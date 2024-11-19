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
import { useCallback, useState, useTransition } from "react";
import { FormResponse } from "@/types/types";
import { DEFAULT_LOGIN_REDIRECT_URL } from "@/routes";
import { FormError } from "@/components/widgets/form-error";
import { FormSuccess } from "@/components/widgets/form-success";
import Link from "next/link";
import {EyeOffIcon, EyeIcon} from "lucide-react";

function LoginForm() {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string>("");
    const [success,] = useState<string>("");
    const [showPassword, setShowPassword] = useState<boolean>(false);

    const form = useForm<z.infer<typeof LoginSchema>>({
        resolver: zodResolver(LoginSchema),
        defaultValues: {},
    });

    const submitData = useCallback((values: z.infer<typeof LoginSchema>) => {
        startTransition(() => {
            login(values)
                .then((data: FormResponse) => {
                    if (!data) {
                        setError("An unexpected error occurred. Please try again.");

                        return;
                    }
                    if (data.responseType === "error") {
                        setError(data.message);
                    } else {
                        //setSuccess(data.message);
                        // Redirect to dashboard after successful login
                        window.location.href = DEFAULT_LOGIN_REDIRECT_URL;
                    }
                })
                .catch((err) => {
                    setError(
                        "An unexpected error occurred. Please try again." +
                        (err instanceof Error ? " " + err.message : "")
                    );
                });
        });
    }, []);

    return (
  <section>
      <Card className="w-full mx-auto max-w-md  mt-10 lg:mt-0 md:mt-0">
            <CardHeader className="border-b-1 mb-4 px-8">
                <CardTitle className="text-[32px] font-bold mb-2">Welcome back</CardTitle>
                <CardDescription>
                    Enter your email or phone login to your account
                </CardDescription>
            </CardHeader>
            <CardContent className="pb-4 px-8">
                <FormError message={error}/>
                <FormSuccess message={success}/>

                <Form {...form}>
                    <form className="space-y-6" onSubmit={form.handleSubmit(submitData)}>
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>Username</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter Username" {...field} />
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
                                                    <Input type={showPassword ? "text" : "password"}
                                                           placeholder="Enter password" {...field} />
                                                    <span onClick={() => setShowPassword(!showPassword)}
                                                          className="absolute right-0 top-0 h-full w-10 flex items-center justify-center z-40 cursor-pointer">
                                                      {showPassword ? <EyeOffIcon size={20}/> :
                                                          <EyeIcon size={20}/>}</span>
                                                </div>
                                            </FormControl>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <Button type="submit" disabled={isPending} className="w-full">Login</Button>
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
