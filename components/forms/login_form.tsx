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
import {EyeOffIcon, EyeIcon, CheckIcon} from "lucide-react";
import Image from "next/image";

function LoginForm() {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string>("");
    const [success, setSuccess] = useState<string>("");
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
                        setSuccess(data.message);
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

    return (<div className='flex h-screen bg-gray-100 relative'>
            <div className='absolute left-0 right-0 bottom-0 z-[-1] opacity-10 w-full'>
                <Image
                    className='w-full'
                    src='/images/wave-2.svg'
                    alt='BG'
                    sizes="100vw"
                    height={0}
                    width={0}
                    style={{width: '100%', height: 'auto'}}
                />
            </div>
            <div className='hidden md:flex flex-1 justify-center h-screen'>
                <div className="container mx-auto w-1/2 relative">
                    <div className="absolute bottom-10 left-0">
                        <span className="mr-5 text-gray-400">About us</span>
                        <span className="mr-5 text-gray-400">Terms & Conditions</span>
                        <span className="mr-5 text-gray-400">Contact</span>
                    </div>
                    <div className='absolute left-0 right-0 bottom-0 top-0 z-0 opacity-3'>
                        <Image
                            className='w-full h-full'
                            src='/images/login-bg.png'
                            alt='gradient'
                            width={100}
                            height={100}
                        />

                    </div>
                    <div className='z-10'>
                        <div className="pt-20 pb-6 pl-3 w-full">
                            <Image
                                src="/images/new_logo.svg"
                                height={70}
                                width={200}
                                alt="Settlo"
                            />
                        </div>
                        {/*<h1 className='font-bold text-[45px] text-white'>Welcome to Settlo</h1>*/}
                        <div className='font-light text-slate-400 mt-4 ml-3'>
                            <div className="flex mb-5">
                                <div className="flex w-8 mr-4 mt-1.5">
                                        <span
                                            className="w-6 h-6 bg-emerald-500 overflow-hidden rounded-full flex items-center justify-center">
                                            <CheckIcon size={18} className="text-white"/>
                                        </span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-[26px] text-[#1E3E62]">Get started quickly</h3>
                                    <p className="text-gray-600 text-md">Login or signup easily to start managing
                                        your businesses.</p>
                                </div>
                            </div>
                            <div className="flex mb-5">
                                <div className="flex w-8 mr-4 mt-1.5">
                                        <span
                                            className="w-6 h-6 bg-emerald-500 overflow-hidden rounded-full flex items-center justify-center">
                                            <CheckIcon size={18} className="text-white"/>
                                        </span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-[26px] text-[#1E3E62]">Supports multiple
                                        businesses</h3>
                                    <p className="text-gray-600 text-md">Manage and monitor all your businesses
                                        under one account.</p>
                                </div>
                            </div>
                            <div className="flex mb-5">
                                <div className="flex w-8 mr-4 mt-1.5">
                                        <span
                                            className="w-6 h-6 bg-emerald-500 overflow-hidden rounded-full flex items-center justify-center">
                                            <CheckIcon size={18} className="text-white"/>
                                        </span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-[26px] text-[#1E3E62]">Multi-user capability</h3>
                                    <p className="text-gray-600 text-md">Manage all your staff from all your
                                        business locations.</p>
                                </div>
                            </div>
                            <div className="flex mb-5">
                                <div className="flex w-8 mr-4 mt-1.5">
                                        <span
                                            className="w-6 h-6 bg-emerald-500 overflow-hidden rounded-full flex items-center justify-center">
                                            <CheckIcon size={18} className="text-white"/>
                                        </span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-[26px] text-[#1E3E62]">Secured data access</h3>
                                    <p className="text-gray-600 text-md">Your business data is protected with
                                        passwords and passcodes.</p>
                                </div>
                            </div>
                            <div className="flex mb-5">
                                <div className="flex w-8 mr-4 mt-1.5">
                                        <span
                                            className="w-6 h-6 bg-emerald-500 overflow-hidden rounded-full flex items-center justify-center">
                                            <CheckIcon size={18} className="text-white"/>
                                        </span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-[26px] text-[#1E3E62]">Free trial period</h3>
                                    <p className="text-gray-600 text-md">Test before you buy, use our system for 30 days
                                        free
                                        trial period.</p>
                                </div>
                            </div>

                            <div className='mt-10 flex gap-6'>
                                <div
                                    className="flex flex-1 gap-2 items-center border-1 rounded-xl p-2 pl-4 pr-3 bg-gray-800">
                                    <div>
                                        <Image src="/images/apple.svg" width={40} height={40} alt='Apple AppStore'/>
                                    </div>
                                    <p className="text-sm font-bold text-center text-white">AppStore</p>
                                </div>

                                <div
                                    className="flex flex-1 gap-2 items-center border-1 rounded-xl p-2 pl-4 pr-3 bg-gray-800">
                                    <div>
                                        <Image src="/images/google-play.svg" width={40} height={40}
                                               alt='Google PlayStore'/>
                                    </div>
                                    <p className="text-sm font-bold text-center text-white">PlayStore</p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/*<div className='md:block'>
                    <Divider orientation='vertical' className="bg-gray-100 w-0.5"/>
                </div>*/}

            <div className='flex-1 flex-col items-center justify-center pt-32'>


                <Card className="mx-auto max-w-md w-[500px]">
                    {/*<div className="pt-3 border-b-1 pb-3 pl-3">
              <Link href="/">
                  <Image
                      src="/images/new_logo.svg"
                      height={70}
                      width={200}
                      alt="Settlo"
                  />
              </Link>
          </div>*/}
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
            </div>
        </div>
    )
}

export default LoginForm;
