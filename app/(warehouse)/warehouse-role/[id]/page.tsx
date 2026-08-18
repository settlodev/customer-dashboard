import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
export default function Page() {
  return (
    <div className="flex-1 p-4 md:p-8 pt-4">
      <BreadcrumbsNav items={[{ title: "Roles", link: "/warehouse-role" }, { title: "Detail", link: "" }]} />
      <p className="text-sm text-muted-foreground mt-4">Role details.</p>
    </div>
  );
}
