"use server";

import { FormResponse } from "@/types/types";
import { AccountNote } from "@/types/admin/account-insights";

/**
 * STUBS — account-detail actions that have no backend endpoint yet.
 *
 * These exist so the redesigned UI can wire its buttons to a real server
 * action surface now; each returns an honest "pending" error rather than
 * pretending to succeed. Swap the bodies for the real service calls when the
 * endpoints exist (keep the signatures so the call sites don't change).
 */

/**
 * Staff impersonation ("log in as") now lives in
 * `@/lib/actions/admin/impersonation` — it calls the real `/auth/impersonate`
 * endpoint. This file keeps only the actions that are still stubbed.
 */

/** TODO(backend): internal account notes (create) endpoint. */
export async function addAccountNote(
  _accountId: string,
  _text: string,
): Promise<FormResponse<AccountNote>> {
  void _accountId;
  void _text;
  return {
    responseType: "error",
    message:
      "Saving account notes isn’t available yet — the notes endpoint is still pending.",
  };
}
