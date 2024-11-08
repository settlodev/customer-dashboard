// import { Meta } from './Meta';
// import { AppConfig } from './AppConfig';
import {CallToAction } from './Banner';
import { Footer } from './Footer';
import { Hero } from './Hero';
import { Sponsors } from './Sponsors';
import { VerticalFeatures } from './VerticalFeatures';
import { Testimonial } from './Testimonial';
import { FAQS } from './Faqs';
import { Pricing } from './Pricing';
import LandingPageNav from "./LandingPageNav";

const Base = () => {
    return (
    <div className="flex flex-col items-center justify-center w-full antialiased max-w-[1280px] mx-auto">
        {/* <Meta title={AppConfig.title} description={AppConfig.description} /> */}
        <LandingPageNav />
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
