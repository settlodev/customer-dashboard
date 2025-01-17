import { Footer } from './Footer';
import { Hero } from './Hero';
import { Sponsors } from './Sponsors';
import { VerticalFeatures } from './VerticalFeatures';
import { Testimonials } from './Testimonial';
import { FAQS } from './Faqs';
import { Pricing } from './Pricing';
import {LoggedOutNavbar} from "@/components/navigation/logged-out-user-nav";
import {LocationSection} from "@/components/landing-page/Location";

const Base = () => {
    return (
    <div className="min-h-screen flex flex-col items-center justify-center w-full antialiased mx-auto">
        <LoggedOutNavbar />
        <Hero />
        <Sponsors />
        <VerticalFeatures />
        <Pricing />
        <Testimonials />
        <FAQS />
        <LocationSection />
        <Footer />
    </div>
    );
}

export { Base };
