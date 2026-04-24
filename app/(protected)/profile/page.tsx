import React from "react";
import UpdateProfileForm from "@/app/(protected)/profile/update_profile_form";
import MyPinCard from "@/app/(protected)/profile/my_pin_card";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
const breadcrumbItems = [{ title: "Profile", link: "/profile" }];

export default function Page() {

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between mb-2">
                <div className="relative flex-1 md:max-w-md">
                    <BreadcrumbsNav items={breadcrumbItems}/>
                </div>
            </div>
            <UpdateProfileForm />
            {/* Self-service POS PIN management — only renders for users with
                an associated StaffEntity that has POS access enabled. */}
            <MyPinCard />
        </div>

    )
}
