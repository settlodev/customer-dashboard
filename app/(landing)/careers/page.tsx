import { Metadata } from "next";
import { CareerHero } from "@/components/widgets/website/careers-hero";
import { JobListings } from "@/components/widgets/website/job-listings";

export const metadata: Metadata = {
    title: "Careers",
    description: "Join our team and help us build the future. Explore current job openings and opportunities at Settlo.",
    // Without an explicit canonical this page inherits the root layout's
    // `canonical: "/"` and tells Google it is a duplicate of the homepage.
    alternates: { canonical: "/careers" },
};

export default function CareersPage() {
    return (
        <div className="w-full space-y-16">
            <CareerHero />

            <section id="open-positions">
                <JobListings />
            </section>
        </div>
    );
}
