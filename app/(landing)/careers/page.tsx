import { Metadata } from "next";
import {CareerHero} from "@/components/widgets/website/careers-hero";
import {Testimonials} from "@/components/landing-page/Testimonial";
import {JobListings} from "@/components/widgets/website/job-listings";

export const metadata: Metadata = {
    title: "Careers",
    description: "Join our team and help us build the future. Explore current job openings and opportunities at Settlo.",
};

export default function CareersPage() {
    return (
        <div className="w-full space-y-12">
            {/* Hero Section */}
            <CareerHero />

            {/* Job Listings Section */}
            <section id="open-positions">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold tracking-tight">Open Positions</h2>
                    <p className="text-muted-foreground mt-2">
                        Find your perfect role in our growing team
                    </p>
                </div>

                <JobListings />
            </section>

            {/* Testimonials Section */}
            <Testimonials />
        </div>
    );
}
