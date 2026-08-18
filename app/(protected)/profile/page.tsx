import React from "react";
import UpdateProfileForm from "@/app/(protected)/profile/update_profile_form";
import MyPinCard from "@/app/(protected)/profile/my_pin_card";
import PhoneCard from "@/app/(protected)/profile/phone_card";
import MfaCard from "@/app/(protected)/profile/mfa_card";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { getMyProfileCached } from "@/lib/identity/me-profile";
import { getAuthToken } from "@/lib/auth-utils";
const breadcrumbItems = [{ title: "Profile", link: "/profile" }];

export default async function Page() {
    // Seed the form from `/me/profile` — the caller's OWN row — rather than the
    // NextAuth session, which carries the account holder's details for invited
    // members and staff. `relationship` also tells the form which fields the
    // caller's row can actually store (bio/photo are account-holder only).
    const [profile, authToken] = await Promise.all([
        getMyProfileCached(),
        getAuthToken(),
    ]);

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between mb-2">
                <div className="relative flex-1 md:max-w-md">
                    <BreadcrumbsNav items={breadcrumbItems}/>
                </div>
            </div>
            <UpdateProfileForm
                relationship={profile?.relationship ?? "OWNER"}
                firstName={profile?.firstName ?? authToken?.firstName ?? ""}
                lastName={profile?.lastName ?? authToken?.lastName ?? ""}
                email={profile?.email ?? authToken?.email ?? ""}
                phoneNumber={profile?.phoneNumber ?? authToken?.phoneNumber ?? ""}
                pictureUrl={profile?.pictureUrl ?? null}
                bio={profile?.bio ?? ""}
            />
            {/* Self-service POS PIN management — only renders for users with
                an associated StaffEntity that has POS access enabled. */}
            <MyPinCard />
            {/* AUTH verifiable phone — add/change + SMS code verification.
                Distinct from the read-only Accounts phone in the form above. */}
            <PhoneCard />
            {/* Two-factor authentication (TOTP) enrollment + management. */}
            <MfaCard />
        </div>

    )
}
