"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

interface SentryStaffTagProps {
  userId: string | null;
  email: string | null;
  internalRole: string | null;
}

/**
 * Tags the current Sentry scope so admin-dashboard errors are filterable
 * separately from customer-dashboard errors. Mounted in the admin layout
 * so every admin page run carries the tags.
 *
 * The cleanup intentionally clears the staff tag — if the user navigates
 * to a non-admin route in the same tab (rare; admin lives on its own
 * subdomain) we don't want stale "staff" tagging on customer events.
 */
export function SentryStaffTag({
  userId,
  email,
  internalRole,
}: SentryStaffTagProps) {
  useEffect(() => {
    Sentry.setTag("dashboard_surface", "admin");
    Sentry.setTag("staff_subject_type", "STAFF");
    if (internalRole) {
      Sentry.setTag("staff_internal_role", internalRole);
    }
    if (userId) {
      Sentry.setUser({
        id: userId,
        email: email ?? undefined,
        username: email ?? undefined,
      });
    }

    return () => {
      Sentry.setTag("dashboard_surface", undefined);
      Sentry.setTag("staff_subject_type", undefined);
      Sentry.setTag("staff_internal_role", undefined);
      Sentry.setUser(null);
    };
  }, [userId, email, internalRole]);

  return null;
}
