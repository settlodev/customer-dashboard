"use client";

import Link from "next/link";

import { signOutToAcceptInvite } from "@/lib/actions/auth-actions";

/**
 * Shown when someone opens an invite link while signed in as a DIFFERENT email
 * than the invite was sent to. Instead of a dead-end "sign out manually"
 * message, give them a one-click way to sign out and re-enter the invite flow
 * as the invited address — and an escape hatch to stay where they are.
 */
export default function WrongAccountOutcome({
  member,
  inviteEmail,
  currentEmail,
}: {
  member: string;
  inviteEmail: string;
  currentEmail: string;
}) {
  return (
    <div className="mx-auto max-w-md p-8 text-center">
      <h1 className="mb-2 text-xl font-semibold">
        Invitation sent to a different address
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        This invitation was sent to <strong>{inviteEmail}</strong>, but you&apos;re
        signed in as <strong>{currentEmail}</strong>. Sign out and continue with
        the invited address to accept it.
      </p>

      <form action={signOutToAcceptInvite}>
        <input type="hidden" name="member" value={member} />
        <input type="hidden" name="email" value={inviteEmail} />
        <button
          type="submit"
          className="mb-4 inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
        >
          Sign out &amp; accept as {inviteEmail}
        </button>
      </form>

      <Link href="/dashboard" className="text-sm font-medium underline">
        Stay signed in as {currentEmail}
      </Link>
    </div>
  );
}
