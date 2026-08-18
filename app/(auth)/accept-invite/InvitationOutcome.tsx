import Link from "next/link";

export type OutcomeAction = { label: string; href: string };

/**
 * Terminal screen for an invite that can't proceed (invalid / not found /
 * revoked / already accepted / accept failed). The caller passes context-aware
 * `actions` — the first renders as the primary button, the rest as links. It
 * falls back to "Go to login" so a callsite that omits actions is still usable.
 */
export default function InvitationOutcome({
  title,
  message,
  actions,
}: {
  title: string;
  message: string;
  actions?: OutcomeAction[];
}) {
  const resolved =
    actions && actions.length > 0
      ? actions
      : [{ label: "Go to login", href: "/login" }];
  const [primary, ...secondary] = resolved;

  return (
    <div className="mx-auto max-w-md p-8 text-center">
      <h1 className="mb-2 text-xl font-semibold">{title}</h1>
      <p className="mb-6 text-sm text-muted-foreground">{message}</p>

      <Link
        href={primary.href}
        className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
      >
        {primary.label}
      </Link>

      {secondary.map((action) => (
        <Link
          key={`${action.label}-${action.href}`}
          href={action.href}
          className="mt-4 block text-sm font-medium underline"
        >
          {action.label}
        </Link>
      ))}
    </div>
  );
}
