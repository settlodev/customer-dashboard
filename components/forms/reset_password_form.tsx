"use client";
import { FormResponse } from "@/types/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { ResetPasswordSchema } from "@/types/data-schemas";
import { resetPassword } from "@/lib/actions/auth-actions";
import { Card, CardContent,CardHeader, CardTitle } from "../ui/card";
import Link from "next/link";
import { FormError } from "../widgets/form-error";
import { FormSuccess } from "../widgets/form-success";

function ResetPasswordForm() {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | undefined>("");
    const [success, setSuccess] = useState<string | undefined>("");


    const form = useForm<z.infer<typeof ResetPasswordSchema>>({
        resolver: zodResolver(ResetPasswordSchema),
        defaultValues: {},
    });
    const { reset } = form;

    const submitData = useCallback((values: z.infer<typeof ResetPasswordSchema>) => {
        startTransition(() => {
            resetPassword(values)
                .then((data: FormResponse) => {
                    if (!data) {
                        setError("An unexpected error occurred. Please try again.");
                        return;
                    }
                    if (data.responseType === "error") {
                        setError(data.message);
                        setTimeout(() => {
                            window.location.reload();
                        }, 5000);
                    } else {
                        setSuccess(data.message);
                        reset()
                        
                    }
                })
                .catch((err: Error) => {
                    setError("An unexpected error occurred. Please try again.");
                    console.error(err);
                });
        });
    }, []);

    return (
       <Card className="mx-auto max-w-sm">
           <CardHeader>
               <CardTitle className="text-xl lg:text-2xl">Reset Password</CardTitle>
           </CardHeader>
           <CardContent>

           <FormError message={error}/>
           <FormSuccess message={success}/>

           <Form{...form}>
            <form className="space-y-6" onSubmit={form.handleSubmit(submitData)}>
            <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Email address</FormLabel>
                        <FormControl>
                            <Input
                                type="email"
                                placeholder="Enter email address"
                                {...field}
                            />
                        </FormControl>
                        <FormDescription>
                            We&lsquo;ll send you a link to reset your password
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <div className="flex items-center justify-between">
                <Button
                    type="submit"
                    disabled={isPending}
                    className="w-full">
                    Reset Password Link
                </Button>
            </div>
            </form>
        </Form>
        <div className="mt-4 text-start text-sm">
          Already have an account?{" "}
          <Link href="/login" className="underline">
            Log in
          </Link>
        </div>
           </CardContent>
       </Card>
    );
}

export default ResetPasswordForm
