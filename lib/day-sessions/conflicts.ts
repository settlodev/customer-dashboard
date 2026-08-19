/**
 * "The day is already in the state you asked for" conflicts, and the
 * stable codes the UI branches on.
 *
 * <p>Plain module, not a server-action file — {@code "use server"} may
 * only export async functions, and both the actions (server) and the
 * day-session widget (client) need these.
 *
 * <p><b>Why a message match.</b> Accounts throws
 * {@code DaySessionAlreadyOpenException} / {@code DaySessionNotOpenException},
 * both plain {@code IllegalStateException} subclasses with no dedicated
 * {@code @ExceptionHandler} — so {@code GlobalExceptionHandler}'s catch-all
 * turns them into
 * {@code 409 {"error":"INVALID_STATE","message":"A day session is already
 * open for location: …"}}. No {@code DAY_SESSION_ALREADY_OPEN} ever reaches
 * the wire, which is why the branch in {@code openDaySession} that tested
 * for one had never fired: opening a day the POS had already opened came
 * back as a flat red failure, and closing an already-closed day did the
 * same.
 *
 * <p>The specific codes stay first in each check. If Accounts grows real
 * handlers later, these keep working and the message match becomes dead
 * weight rather than a regression.
 */

/** Stable code for "a business day is already open at this location". */
export const DAY_SESSION_ALREADY_OPEN = "DAY_SESSION_ALREADY_OPEN";
/** Stable code for "there is no open business day to act on". */
export const DAY_SESSION_NOT_OPEN = "DAY_SESSION_NOT_OPEN";

export const isAlreadyOpenConflict = (
  code?: string,
  message?: string,
): boolean =>
  code === DAY_SESSION_ALREADY_OPEN ||
  (code === "INVALID_STATE" && /already open/i.test(message ?? ""));

export const isNotOpenConflict = (code?: string, message?: string): boolean =>
  code === DAY_SESSION_NOT_OPEN ||
  (code === "INVALID_STATE" && /no open day session/i.test(message ?? ""));
