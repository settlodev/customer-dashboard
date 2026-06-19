import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getPublicInvitation } from "@/lib/actions/account-member-actions";
import { getAuthToken } from "@/lib/auth-utils";
import { acceptInvitation } from "@/lib/actions/account-member-actions";
import InvitationOutcome from "./InvitationOutcome";

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ member?: string; email?: string }>;
}) {
  const { member, email } = await searchParams;

  if (!member) {
    return (
      <InvitationOutcome
        title="Invalid invitation"
        message="This invitation link is missing required information."
      />
    );
  }

  const invitation = await getPublicInvitation(member);
  if (!invitation) {
    return (
      <InvitationOutcome
        title="Invitation not found"
        message="This invitation no longer exists or has been removed."
      />
    );
  }
  if (invitation.status === "REVOKED") {
    return (
      <InvitationOutcome
        title="Invitation revoked"
        message="This invitation has been revoked by the account owner."
      />
    );
  }

  // Remember which invite to accept after authentication.
  const cookieStore = await cookies();
  const isProduction = process.env.NODE_ENV === "production";
  cookieStore.set({
    name: "pendingInvite",
    value: member,
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    maxAge: 60 * 60, // 1 hour
  });

  // Already authenticated → accept now and continue into the app.
  const token = await getAuthToken();
  if (token?.accessToken && token?.emailVerified) {
    await acceptInvitation(member);
    try { cookieStore.delete("pendingInvite"); } catch { /* ok */ }
    redirect("/select-business");
  }

  const emailParam = encodeURIComponent(invitation.email || email || "");
  if (invitation.hasAccount) {
    redirect(`/login?email=${emailParam}`);
  }
  redirect(`/accept-invite/create?member=${member}&email=${emailParam}`);
}
