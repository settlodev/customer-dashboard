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

function UpdatePasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");

  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const action = searchParams.get("action") || "update"; // 'update' or 'create'

  const form = useForm<z.infer<typeof UpdatePasswordSchema>>({
    resolver: zodResolver(UpdatePasswordSchema),
    defaultValues: {},
  });

  const submitData = useCallback(
    (values: z.infer<typeof UpdatePasswordSchema>) => {
      const payload = {
        password: values.password,
        token: token as string,
      };

      startTransition(() => {
        updatePassword(payload)
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
              }, 5000);
            }
          })
          .catch((err: Error) => {
            setError("An unexpected error occurred. Please try again.");
            console.error(err);
          });
      });
    },
    [token]
  );

  const isCreateAction = action === "create";

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl lg:text-2xl">
          {isCreateAction ? "Create Password" : "Update Password"}
        </CardTitle>
        <CardDescription>
          {isCreateAction
            ? "Set up your new password to proceed"
            : "Please enter your new password to continue"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FormError message={error} />
        <FormSuccess message={success} />
        <Form {...form}>
          <form
            className="space-y-6"
            onSubmit={form.handleSubmit(submitData)}
          >
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
              <Button
                type="submit"
                disabled={isPending}
                className="w-full"
              >
                {isCreateAction ? "Create Password" : "Update Password"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default UpdatePasswordForm;
