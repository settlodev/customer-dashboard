import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import GrnForm from "@/components/forms/grn-form";

const breadcrumbItems = [
  { title: "Goods Received", link: "/goods-received" },
  { title: "New", link: "" },
];

export default function NewGrnPage() {
  return (
    <div className="flex-1 px-4 pt-4 pb-8 md:px-8 md:pt-6 md:pb-8 mt-12">
      <div className="space-y-6">
        <div>
          <div className="hidden sm:block mb-2">
            <BreadcrumbsNav items={breadcrumbItems} />
          </div>
          <h1 className="text-2xl font-bold">Goods Received Note</h1>
          <p className="text-sm text-muted-foreground">
            Record a delivery from a supplier. Draft it first, then receive into
            inventory (optionally through a quality inspection hold).
          </p>
        </div>
        <GrnForm />
      </div>
    </div>
  );
}
