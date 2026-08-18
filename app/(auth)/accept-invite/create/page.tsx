import InvitedSignupForm from "@/components/forms/invited_signup_form";

export default async function AcceptInviteCreatePage({
  searchParams,
}: {
  searchParams: Promise<{ member?: string; email?: string }>;
}) {
  const { member, email } = await searchParams;
  if (!member || !email) {
    return (
      <div className="p-8 text-center text-gray-600 dark:text-muted-foreground">
        Invalid invitation link.
      </div>
    );
  }
  return (
    <InvitedSignupForm
      email={decodeURIComponent(email)}
      memberId={member}
    />
  );
}
