import ResetPasswordForm from "@/components/forms/reset_password_form";
import { getPublicStaffInvitation } from "@/lib/actions/staff-actions";

async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{
    token?: string;
    action?: string;
    staff?: string;
    email?: string;
  }>;
}) {
  const { token, action, staff, email } = await searchParams;

  // Staff set-password invites carry ?staff=<id>; fetch greeting context so the
  // landing can welcome them by business/role instead of a bare "create your
  // password" box. Only for the create action — ordinary password resets stay
  // generic. Fetch failures fall back to null (generic copy).
  const staffContext =
    action === "create" && staff
      ? await getPublicStaffInvitation(staff)
      : null;

  return (
    <ResetPasswordForm
      linkToken={token ?? null}
      action={action ?? null}
      staffContext={staffContext}
      initialEmail={email ?? null}
    />
  );
}

export default ResetPasswordPage;
