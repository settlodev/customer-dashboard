import { Metadata } from "next";
import ContactUsForm from "@/components/forms/contact_us_form";

export const metadata: Metadata = {
    title: "Contact Us",
    description: "Get in touch with our support team. We're here to help with any questions or inquiries.",
};

export default function ContactPage() {
    return (
        <div className="w-full space-y-20 md:space-y-24">
            <section className="pt-4 md:pt-8">
                <h1
                    className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-4"
                    style={{ lineHeight: "1.35" }}
                >
                    Get in{" "}
                    <span className="bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
                        touch
                    </span>
                </h1>
                <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed max-w-2xl">
                    Have questions or need assistance? We&#39;re here to help.
                    Our team typically responds within 24 hours.
                </p>
            </section>

            <ContactUsForm />
        </div>
    );
}
