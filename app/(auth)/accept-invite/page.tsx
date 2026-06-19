import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getPublicInvitation } from "@/lib/actions/account-member-actions";
import { getAuthToken, deleteAuthCookie } from "@/lib/auth-utils";
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
    const emailParam = encodeURIComponent(invitation.email || email || "");
    // If they already have somewhere to land (own business set up) or the token
    // already reflects invited access, go straight in.
    if (token.isBusinessRegistrationComplete || token.hasInvitedAccess) {
      try { cookieStore.delete("pendingInvite"); } catch { /* ok */ }
      redirect("/select-business");
    }
    // Otherwise the session predates this invite AND their own account is
    // incomplete, so middleware would trap them at /business-registration.
    // Clear the session and send them through login so hasInvitedAccess is
    // recomputed (pendingInvite is kept; the login re-accept is a harmless no-op).
    await deleteAuthCookie();
    redirect(`/login?email=${emailParam}`);
  }

  const emailParam = encodeURIComponent(invitation.email || email || "");
  if (invitation.hasAccount) {
    redirect(`/login?email=${emailParam}`);
  }
  redirect(`/accept-invite/create?member=${member}&email=${emailParam}`);
}
