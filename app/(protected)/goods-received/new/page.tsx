import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import GrnForm from "@/components/forms/grn-form";

const breadcrumbItems = [
  { title: "Goods received", link: "/goods-received" },
  { title: "New", link: "" },
];

export default function NewGrnPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      <div>
        <div className="hidden sm:block mb-2">
          <BreadcrumbsNav items={breadcrumbItems} />
        </div>
        <h1 className="text-2xl font-bold">Goods received note</h1>
        <p className="text-sm text-muted-foreground">
          Record a delivery from a supplier. Draft it first, then receive into
          inventory (optionally through a quality inspection hold).
        </p>
      </div>
      <GrnForm />
    </div>
  );
}
