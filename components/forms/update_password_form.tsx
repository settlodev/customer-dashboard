"use client";
import { DEFAULT_LOGIN_REDIRECT_URL } from "@/routes";
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
import { UpdatePasswordSchema } from "@/types/data-schemas";
import { updatePassword, verifyToken } from "@/lib/actions/auth-actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LoaderIcon } from "lucide-react";

function UpdatePasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [verifyingToken, setVerifyingToken] = useState<boolean>(false);
  const [isTokenValid, setIsTokenValid] = useState<boolean>(false);

  const searchParams = useSearchParams();
  console.log("searchParams", searchParams);
  const token = searchParams.get("token");

  console.log("The token from the URL", token);

  useEffect(() => {
    if (token) {
      console.log(token);
      setVerifyingToken(true);
      verifyResetPasswordToken(token as string);
    }
  }, [token]);

  const verifyResetPasswordToken = async (token: string) => {
    try {
      const result = await verifyToken(token);
      console.log("verifyResetPasswordToken from the API", result);
      setIsTokenValid(true);
    } catch (error) {
        setIsTokenValid(false);
      console.log(error);
    }
    finally{
        setVerifyingToken
    }
  };

  const form = useForm<z.infer<typeof UpdatePasswordSchema>>({
    resolver: zodResolver(UpdatePasswordSchema),
    defaultValues: {},
  });

  const submitData = useCallback(
    (values: z.infer<typeof UpdatePasswordSchema>) => {
      startTransition(() => {
        updatePassword(values)
          .then((data: FormResponse) => {
            if (!data) {
              setError("An unexpected error occurred. Please try again.");
              return;
            }
            if (data.responseType === "error") {
              setError(data.message);
            } else {
              setSuccess(data.message);

              setTimeout(() => {
                window.location.href = DEFAULT_LOGIN_REDIRECT_URL;
              }, 30000);
            }
          })
          .catch((err: any) => {
            setError("An unexpected error occurred. Please try again.");
            console.error(err);
          });
      });
    },
    []
  );

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl lg:text-2xl">Update Password</CardTitle>
        <CardDescription>
          Please enter your new password to continue
        </CardDescription>
      </CardHeader>
      <CardContent>
        {verifyingToken && <LoaderIcon className="animate-spin" />} {/* Show verifying message */}
        {isTokenValid === true && (
          <Form {...form}>
            <form className="space-y-6" onSubmit={form.handleSubmit(submitData)}>
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-center justify-between">
                <Button type="submit" disabled={isPending} className="w-full">
                  Update Password
                </Button>
              </div>
            </form>
          </Form>
        )}
        {isTokenValid === false && <p>Token verification failed. Please try again.</p>} {/* Show error message */}
      </CardContent>
    </Card>
  );
}

export default UpdatePasswordForm;
