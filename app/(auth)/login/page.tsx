import { Suspense } from "react";
import LoginForm from "@/components/forms/login_form";

export default async function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
