import {CallToAction } from './Banner';
import { Footer } from './Footer';
import { Hero } from './Hero';
import { Sponsors } from './Sponsors';
import { VerticalFeatures } from './VerticalFeatures';
import { Testimonial } from './Testimonial';
import { FAQS } from './Faqs';
import { Pricing } from './Pricing';
import {LoggedOutNavbar} from "@/components/navigation/logged-out-user-nav";

const Base = () => {
    return (
    <div className="min-h-screen flex flex-col items-center justify-center w-full antialiased max-w-[1280px] mx-auto">
        <LoggedOutNavbar />
        <Hero />
        <Sponsors />
        <VerticalFeatures />
        <Pricing />
        <Testimonial />
        <FAQS />
        <CallToAction />
        <Footer />
    </div>
    );
}

export { Base };
