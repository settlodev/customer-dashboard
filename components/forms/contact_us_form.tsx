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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {Clock, Mail, MapPin, Phone} from "lucide-react";

// Define the form schema with validation
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

export default function ContactUsForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast()

    // Initialize the form
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            subject: "",
            message: "",
        },
    });

    // Handle form submission
    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);

        try {
            // Replace with your actual API endpoint
            await axios.post("/api/contact", values);

            // Show success toast
            toast({
                title: "Message Sent",
                description: "Thank you for your message. Someone from our team will get in touch with you withing 24 hours.",
                variant: "default",
            });

            // Reset the form
            form.reset();
        } catch (error) {
            // Show error toast
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
        <div className="grid md:grid-cols-3 gap-6 w-full">
            {/* Contact Information Card */}
            <Card className="md:col-span-1 bg-primary text-primary-foreground">
                <CardHeader>
                    <CardTitle>Get in touch</CardTitle>
                    <CardDescription className="text-primary-foreground/80">
                        We&#39;d love to hear from you. Fill out the form and we&#39;ll be in touch as soon as possible.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="rounded-full p-2 bg-emerald-100 mt-1">
                                <MapPin className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-semibold text-gray-900">Address</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    8th Floor Noble Center Building,<br />
                                    Plot # 89 Block 45B,<br />
                                    P.O. Box 8059,<br />
                                    Dar Es Salaam, United Republic of Tanzania
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="rounded-full p-2 bg-emerald-100 mt-1">
                                <Clock className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-semibold text-gray-900">Business Hours</h3>
                                <p className="text-gray-600">
                                    Monday - Friday: 9:00 AM - 5:00 PM<br />
                                    Saturday - Sunday: Closed
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="rounded-full p-2 bg-emerald-100 mt-1">
                                <Phone className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-semibold text-gray-900">Phone</h3>
                                <a
                                    href="tel:+255788000000"
                                    className="text-emerald-600 hover:text-emerald-700 transition-colors"
                                >
                                    +255 788 000 000
                                </a>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="rounded-full p-2 bg-emerald-100 mt-1">
                                <Mail className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-semibold text-gray-900">Email</h3>
                                <a
                                    href="mailto:support@settlo.co.tz"
                                    className="text-emerald-600 hover:text-emerald-700 transition-colors"
                                >
                                    support@settlo.co.tz
                                </a>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Contact Form Card */}
            <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle>Send us a Message</CardTitle>
                    <CardDescription>
                        Fill out the form below to send us a message and we&#39;ll get back to you as soon as possible.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Your name" {...field} />
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
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Your email address" {...field} />
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
                                        <FormLabel>Subject</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Message subject" {...field} />
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
                                        <FormLabel>Message</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Tell us how we can help..."
                                                className="min-h-32"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? "Sending..." : "Send Message"}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
