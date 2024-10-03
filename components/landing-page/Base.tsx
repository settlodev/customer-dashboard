"use client"

import { Meta } from './Meta';
import { AppConfig } from './AppConfig';
import { Banner } from './Banner';
import { Footer } from './Footer';
import { Hero } from './Hero';
import { Sponsors } from './Sponsors';
import { VerticalFeatures } from './VerticalFeatures';
import {useSession} from "next-auth/react";

const Base = () => {
    const {data: session} = useSession();
    //console.log("session is:", user);

    return (<div className="text-gray-600 antialiased">
            <Meta title={AppConfig.title} description={AppConfig.description}/>
            <Hero session={session} />
            <Sponsors />
            <VerticalFeatures />
            <Banner />
            <Footer />
        </div>
    );
}

export { Base };
