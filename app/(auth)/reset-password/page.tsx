"use client";

import { useSearchParams } from "next/navigation";
import ResetPasswordForm from "@/components/forms/reset_password_form";

function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const action = searchParams.get("action");

  return <ResetPasswordForm linkToken={token} action={action} />;
}

export default ResetPasswordPage;
