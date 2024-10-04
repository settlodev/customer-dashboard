"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState, useTransition } from "react";
import { RegisterSchema } from "@/types/data-schemas";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

import { FormResponse } from "@/types/types";
import { DEFAULT_LOGIN_REDIRECT_URL } from "@/routes";
import { FormError } from "../widgets/form-error";
import { FormSuccess } from "../widgets/form-success";
import { register } from "@/lib/actions/auth-actions";
import { Loader2Icon } from "lucide-react";
import { fetchCountries } from "@/lib/actions/countries-actions";
function RegisterForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [countries, setCountries] = useState([]);

  const form = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {},
  });

  useEffect(() => {
    const getCountries = async () => {
      try {
        const response = await fetchCountries();
        setCountries(response);
      } catch (error) {
        console.error("Error fetching countries", error);
      }
    };
    getCountries();
  }, []);

  const submitData = async (values: z.infer<typeof RegisterSchema>) => {
    startTransition(() => {
      register(values)
        .then((data: FormResponse) => {
          if (!data) {
            setError("An unexpected error occurred. Please try again.");

            return;
          }
          if (data.responseType === "error") {
            setError(data.message);
          } else {
            setSuccess(data.message);
            // Redirect to dashboard after successful login
            window.location.href = DEFAULT_LOGIN_REDIRECT_URL;
          }
        })
        .catch((error) => {
          setError("An unexpected error occurred. Please try again.");
          console.error(error);
        });
    });
  };
  return (
    <Card className="mx-auto max-w-sm mt-8">
      <CardHeader>
        <CardTitle className="text-xl">Sign Up</CardTitle>
        <CardDescription>
          Enter your information to create an account with Settlo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FormError message={error} />
        <FormSuccess message={success} />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submitData)}>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter first name" {...field} />
                        </FormControl>
                        <FormDescription>
                          {/* Enter user name */}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter last name" {...field} />
                        </FormControl>
                        <FormDescription>
                          {/* Enter user name */}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter valid email"
                          {...field}
                          type="email"
                        />
                      </FormControl>
                      <FormDescription>{/* Enter user name */}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-2">
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter phone number" {...field} />
                      </FormControl>
                      <FormDescription>{/* Enter user name */}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-2">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Select
                          disabled={isPending || countries.length === 0}
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select your country" />
                          </SelectTrigger>
                          <SelectContent>
                            {countries.length > 0
                              ? countries.map((country: any, index: number) => (
                                  <SelectItem key={index} value={country.id}>
                                    {country.name}{" "}
                                    {/* Assuming 'name' is the country name */}
                                  </SelectItem>
                                ))
                              : null}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-2">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter password"
                          {...field}
                          type="password"
                        />
                      </FormControl>
                      <FormDescription>{/* Enter user name */}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            {isPending ? (
              <div className="flex justify-center items-center bg-black rounded p-2 text-white">
                <Loader2Icon className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <Button
                type="submit"
                disabled={isPending}
                className={`mt-4 w-full capitalize`}
              >
                create account
              </Button>
            )}
          </form>
        </Form>
        <div className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="underline">
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default RegisterForm;
