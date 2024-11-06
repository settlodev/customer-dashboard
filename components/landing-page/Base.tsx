"use client"

import { Meta } from './Meta';
import { AppConfig } from './AppConfig';
import {CallToAction } from './Banner';
import { Footer } from './Footer';
import { Hero } from './Hero';
import { Sponsors } from './Sponsors';
import { VerticalFeatures } from './VerticalFeatures';
import { useSession } from "next-auth/react";
import Navbar from './NavbarTwoColumns';
import { Testimonial } from './Testimonial';
import { FAQS } from './Faqs';
import { Pricing } from './Pricing';

const Base = () => {
    const { data: session } = useSession();
    return (
    <div className="flex flex-col items-center justify-center w-full antialiased max-w-[1280px] mx-auto">
        <Meta title={AppConfig.title} description={AppConfig.description} />
        <Navbar session={session} />
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
