"use client";

import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import axios from "axios";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Clock, Mail, MapPin, Phone } from "lucide-react";

const formSchema = z.object({
    name: z.string().min(2, {
        message: "Name must be at least 2 characters.",
    }),
    email: z.string().email({
        message: "Please enter a valid email address.",
    }),
    subject: z.string().min(5, {
        message: "Subject must be at least 5 characters.",
    }),
    message: z.string().min(10, {
        message: "Message must be at least 10 characters.",
    }),
});

const contactInfo = [
    {
        icon: MapPin,
        label: "Address",
        content: (
            <>
                8th Floor Noble Center Building,<br />
                Plot # 89 Block 45B, P.O. Box 8059,<br />
                Dar Es Salaam, United Republic of Tanzania
            </>
        ),
    },
    {
        icon: Clock,
        label: "Business Hours",
        content: (
            <>
                Monday &ndash; Friday: 9:00 AM &ndash; 5:00 PM<br />
                Saturday &ndash; Sunday: Closed
            </>
        ),
    },
    {
        icon: Phone,
        label: "Phone",
        content: (
            <a href="tel:+255759229777" className="text-primary hover:text-primary/80 transition-colors">
                +255 759 229 777
            </a>
        ),
    },
    {
        icon: Mail,
        label: "Email",
        content: (
            <a href="mailto:support@settlo.co.tz" className="text-primary hover:text-primary/80 transition-colors">
                support@settlo.co.tz
            </a>
        ),
    },
];

export default function ContactUsForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            subject: "",
            message: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);

        try {
            await axios.post("/api/contact", values);

            toast({
                title: "Message Sent",
                description: "Thank you for your message. Someone from our team will get in touch with you within 24 hours.",
                variant: "success",
            });

            form.reset();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to send your message. Please try again later.",
                variant: "destructive",
            });
            console.error("Contact form error:", error);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="grid md:grid-cols-3 gap-8 w-full">
            {/* Contact Info */}
            <div className="md:col-span-1 space-y-6">
                {contactInfo.map((item) => {
                    const Icon = item.icon;
                    return (
                        <div key={item.label} className="flex gap-4">
                            <div className="flex-shrink-0 mt-0.5">
                                <span className="block w-2.5 h-2.5 rounded-full bg-primary mt-1.5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1">
                                    {item.label}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                    {item.content}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Form */}
            <div className="md:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 md:p-8">
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                        Send us a message
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Fill out the form below and we&#39;ll get back to you as soon as possible.
                    </p>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                        <div className="grid md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm text-gray-700 dark:text-gray-300">Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Your name" className="rounded-xl" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm text-gray-700 dark:text-gray-300">Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Your email address" className="rounded-xl" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="subject"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm text-gray-700 dark:text-gray-300">Subject</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Message subject" className="rounded-xl" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="message"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm text-gray-700 dark:text-gray-300">Message</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Tell us how we can help..."
                                            className="min-h-32 rounded-xl"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button
                            type="submit"
                            className="w-full rounded-xl bg-primary hover:bg-primary/90 text-white"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Sending..." : "Send Message"}
                        </Button>
                    </form>
                </Form>
            </div>
        </div>
    );
}
