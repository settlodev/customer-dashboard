import { Metadata } from "next";
import ContactUsForm from "@/components/forms/contact_us_form";

export const metadata: Metadata = {
    title: "Contact Us",
    description: "Get in touch with our support team. We're here to help with any questions or inquiries.",
};

export default function ContactPage() {
    return (
        <div className="w-full">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Contact Us</h1>
                <p className="text-muted-foreground mt-2">
                    Have questions or need assistance? We&#39;re here to help!
                </p>
            </div>

            <ContactUsForm />
        </div>
    );
}
