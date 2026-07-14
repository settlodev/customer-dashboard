import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import AcceptedPaymentMethodsPage from "@/components/settings/acceptedPaymentMethods";

const breadcrumbItems = [
  { title: "Accepted Payment Methods", link: "/payments" },
];

export default function Page() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between mb-2">
        <div className="relative flex-1 md:max-w-md">
          <BreadcrumbsNav items={breadcrumbItems} />
        </div>
      </div>
      <AcceptedPaymentMethodsPage />
    </div>
  );
}
