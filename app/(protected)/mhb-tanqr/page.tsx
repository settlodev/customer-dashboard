import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import RequestTanqrForm from "@/components/forms/tanqrForm";

const breadCrumbItems = [{ title: "", link: "/tanqr" }];

async function Page() {
  return (
    <div className="flex-1 space-y-4 md:p-8 pt-6">
      <div className="flex items-center justify-between mb-2">
        <div className="relative flex-1 md:max-w-md">
          <BreadcrumbsNav items={breadCrumbItems} />
        </div>
      </div>
      <RequestTanqrForm />
    </div>
  );
}

export default Page;
