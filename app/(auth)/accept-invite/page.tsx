import { redirect } from "next/navigation";
import {
  getPublicInvitation,
  acceptInvitation,
} from "@/lib/actions/account-member-actions";
import { getAuthToken } from "@/lib/auth-utils";
import { getUIErrorMessage } from "@/lib/settlo-api-error-handler";
import InvitationOutcome from "./InvitationOutcome";
import WrongAccountOutcome from "./WrongAccountOutcome";

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ member?: string; email?: string }>;
}) {
  const { member, email } = await searchParams;

  // Read the session up front so every outcome (and both the ACCEPTED and
  // PENDING branches) can be auth-aware. getAuthToken only reads cookies, so it
  // is safe during render; the cookie WRITES this flow needs happen in the
  // /accept-invite/continue route handler.
  const token = await getAuthToken();
  const isSignedIn = !!(token?.accessToken && token?.emailVerified);
  // Fallback action for a dead-end outcome: back into their own app if signed
  // in (a bare "Go to login" would just bounce a logged-in user to /dashboard),
  // otherwise to sign-in.
  const homeAction = isSignedIn
    ? { label: "Go to dashboard", href: "/dashboard" }
    : { label: "Go to login", href: "/login" };

  if (!member) {
    return (
      <InvitationOutcome
        title="Invalid invitation"
        message="This invitation link is missing required information."
        actions={[homeAction]}
      />
    );
  }

  const invitation = await getPublicInvitation(member);
  if (!invitation) {
    return (
      <InvitationOutcome
        title="Invitation not found"
        message="This invitation no longer exists or has been removed."
        actions={[homeAction]}
      />
    );
  }

  const signedInEmail = (token?.email ?? "").trim().toLowerCase();
  const inviteEmail = (invitation.email ?? "").trim().toLowerCase();
  const signedInAsInvitee =
    isSignedIn && !!signedInEmail && signedInEmail === inviteEmail;
  const emailParam = encodeURIComponent(invitation.email || email || "");

  if (invitation.status === "REVOKED") {
    return (
      <InvitationOutcome
        title="Invitation revoked"
        message="This invitation has been revoked by the account owner."
        actions={[homeAction]}
      />
    );
  }

  if (invitation.status === "ACCEPTED") {
    // Already accepted. If the invited user is the one looking at it, don't
    // dead-end them on a notice — refresh their access flag and drop them into
    // business selection. Anyone else gets the notice, pointed at the right next
    // step: sign in with the invited address (unauthenticated) or back to their
    // own app (signed in as someone else).
    if (signedInAsInvitee) {
      redirect("/accept-invite/continue?to=refresh");
    }
    return (
      <InvitationOutcome
        title="Invitation already accepted"
        message="This invitation has already been accepted. Log in with the invited address to access the business."
        actions={
          isSignedIn
            ? [homeAction]
            : [{ label: "Log in to continue", href: `/login?email=${emailParam}` }]
        }
      />
    );
  }

  // ── PENDING from here on ──────────────────────────────────────────────────

  // Signed in as the invited user → accept now and continue into the app.
  if (signedInAsInvitee) {
    const acceptRes = await acceptInvitation(member);
    if (acceptRes.responseType === "error") {
      return (
        <InvitationOutcome
          title="Couldn't accept invitation"
          message={getUIErrorMessage(
            null,
            acceptRes.message,
            "We couldn't accept this invitation. Please try again.",
          )}
          actions={[
            {
              label: "Try again",
              href: `/accept-invite?member=${encodeURIComponent(member)}&email=${emailParam}`,
            },
            { label: "Go to dashboard", href: "/dashboard" },
          ]}
        />
      );
    }
    // Owns a business already, or the token already reflects invited access →
    // straight to selection. Otherwise the token predates this invite, so hand
    // off to the route handler to refresh hasInvitedAccess (cookies can't be
    // written during render) before selection — no forced re-login.
    if (token?.isBusinessRegistrationComplete || token?.hasInvitedAccess) {
      redirect("/select-business");
    }
    redirect("/accept-invite/continue?to=refresh");
  }

  // Signed in as someone else → the invite is bound to a different email. Offer
  // an actionable way to switch instead of a dead-end message.
  if (isSignedIn) {
    return (
      <WrongAccountOutcome
        member={member}
        inviteEmail={invitation.email || email || ""}
        currentEmail={token?.email || ""}
      />
    );
  }

  // Not authenticated. Cookies can't be written during render, so hand off to
  // the route handler, which remembers the invite (pendingInvite cookie) and
  // routes on to sign-in (existing account) or the invited-signup form.
  const to = invitation.hasAccount ? "login" : "create";
  redirect(
    `/accept-invite/continue?to=${to}&member=${encodeURIComponent(member)}&email=${emailParam}`,
  );
}
