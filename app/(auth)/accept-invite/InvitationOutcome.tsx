"use client";

import Link from "next/link";

export default function InvitationOutcome({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="mx-auto max-w-md p-8 text-center">
      <h1 className="mb-2 text-xl font-semibold">{title}</h1>
      <p className="mb-6 text-sm text-muted-foreground">{message}</p>
      <Link href="/login" className="text-sm font-medium underline">
        Go to login
      </Link>
    </div>
  );
}
