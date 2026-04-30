import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import ProductForm from "@/components/forms/product_form";

// Create page. Modifier groups, addon groups, and currency price overrides
// can only be added once the product exists, so the create form intentionally
// covers basics + variants only — saving redirects the merchant to
// /products/{id}/edit where the rest of the surfaces unlock.
export default function NewProductPage() {
  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Products", href: "/products" },
          { title: "New" },
        ]}
      />
      <PageHeader
        title="Add product"
        subtitle="Save the product first, then add modifiers, addons, and price overrides."
      />
      <PageBody>
        <ProductForm item={null} />
      </PageBody>
    </PageShell>
  );
}
