//import Image from "next/image";
//import {CheckIcon} from "lucide-react";
//import {usePathname} from "next/navigation";
//import _ from "lodash";
import React from "react";
import {Footer} from "@/components/landing-page/Footer";
import {LoggedOutNavbar} from "@/components/navigation/logged-out-user-nav";

interface Props {
  children: React.ReactNode;
}

export const AuthLayoutWrapper = ({ children }: Props) => {
    //const router = usePathname();

    //const hideFromRoutes = ["/business-registration", "/business-location", "/login"];
    //const hideSidePanel = _.includes(hideFromRoutes, router);

    const hideSidePanel = false;

    return (<div className={`${!hideSidePanel && ''} bg-gray-100 relative w-full`}>
            <LoggedOutNavbar hideLogin={true} />

            <div className={`${hideSidePanel ? 'lg:container md:container md:mx-auto lg:mx-auto lg:pt-10 md:pt-10' : 'lg:container lg:mx-auto flex-1 lg:pl-28 lg:pr-28'}`}>
                {children}
            </div>

            <div className="pt-8">
                <Footer />
            </div>
        </div>
    )
}
