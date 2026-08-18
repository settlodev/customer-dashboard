import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
export default function Page() {
  return (
    <div className="flex-1 p-4 md:p-8 pt-4">
      <BreadcrumbsNav items={[{ title: "Billing", link: "/warehouse-invoice" }]} />
      <p className="text-sm text-muted-foreground mt-4">Warehouse billing coming soon.</p>
    </div>
  );
}
