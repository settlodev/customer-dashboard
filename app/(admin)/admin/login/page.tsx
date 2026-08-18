import StaffLoginForm from "@/components/forms/staff-login-form";

export const metadata = {
  title: "Staff Login",
  description: "Settlo internal staff portal",
};

export default function StaffLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <StaffLoginForm />
    </main>
  );
}
