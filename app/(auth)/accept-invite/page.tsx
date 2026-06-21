import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getPublicInvitation } from "@/lib/actions/account-member-actions";
import { getAuthToken, deleteAuthCookie } from "@/lib/auth-utils";
import { acceptInvitation } from "@/lib/actions/account-member-actions";
import { getUIErrorMessage } from "@/lib/settlo-api-error-handler";
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
  if (invitation.status === "ACCEPTED") {
    return (
      <InvitationOutcome
        title="Invitation already accepted"
        message="This invitation has already been accepted. Please log in to access the business."
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
    // lax (not strict) so the cookie survives top-level cross-site navigations
    // the invited flow depends on — the email-link entry and the OAuth round-trip
    // back from the provider — where a strict cookie would not be sent.
    sameSite: "lax",
    maxAge: 60 * 60, // 1 hour
  });

  // Already authenticated → accept now and continue into the app.
  const token = await getAuthToken();
  if (token?.accessToken && token?.emailVerified) {
    // The invite is bound to a specific email. If the signed-in user is someone
    // else, do NOT accept (the backend would reject it anyway) and do NOT touch
    // their session — explain that they're signed in as a different person.
    const signedInEmail = (token.email ?? "").trim().toLowerCase();
    const inviteEmail = (invitation.email ?? "").trim().toLowerCase();
    if (signedInEmail && inviteEmail && signedInEmail !== inviteEmail) {
      try { cookieStore.delete("pendingInvite"); } catch { /* ok */ }
      return (
        <InvitationOutcome
          title="Invitation sent to a different address"
          message={`This invitation was sent to ${invitation.email}, but you're signed in as ${token.email}. Sign out and sign in with the invited address to accept it.`}
        />
      );
    }

    // Emails match — accept and inspect the result instead of assuming success.
    const acceptRes = await acceptInvitation(member);
    if (acceptRes.responseType === "error") {
      try { cookieStore.delete("pendingInvite"); } catch { /* ok */ }
      return (
        <InvitationOutcome
          title="Couldn't accept invitation"
          message={getUIErrorMessage(null, acceptRes.message, "We couldn't accept this invitation. Please try again.")}
        />
      );
    }
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
