"use client";

import {LoginSchema} from "@/types/data-schemas";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {useForm} from "react-hook-form";
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {useCallback, useTransition} from "react";
import {login} from "@/lib/actions/auth/login";
import {useRouter} from "next/navigation";
import {useCookies} from "next-client-cookies";
import {LoginResponse} from "@/types/types";

function LoginForm({userData}: { userData: LoginResponse }) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const cookies = useCookies();

    const form = useForm<z.infer<typeof LoginSchema>>({
        resolver: zodResolver(LoginSchema),
        defaultValues: {},
    });

    const submitData = useCallback(
        (values: z.infer<typeof LoginSchema>) => {
            startTransition(() => {
                login(values)
                    .then((data) => {
                        console.log("Login Response:", data);
                        router.push('/dashboard');
                    })
                    .catch((err) => {
                        console.log("Login Error:", err);
                    });
            });
        }, []
    );

    if (cookies.get('authToken')) {
        console.log("user data:", userData);
        if(userData && userData.id) {
            router.push('/dashboard');
        }
    }else {
        return (
            <Card className="mx-auto max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">Login</CardTitle>
                    <CardDescription>
                        Enter your email below to login to your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
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
                                                    <Input placeholder="User name" {...field} />
                                                </FormControl>
                                                <FormDescription>
                                                    Enter user name
                                                </FormDescription>
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
                                                    <Input placeholder="Password" {...field} />
                                                </FormControl>
                                                <FormDescription>
                                                    Enter password
                                                </FormDescription>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <Button type="submit" disabled={isPending} className="w-full">
                                    Login
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>

        );
    }
}

export default LoginForm;
