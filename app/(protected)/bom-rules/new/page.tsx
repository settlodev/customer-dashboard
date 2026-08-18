import Link from "next/link";
import { ChevronRight } from "lucide-react";

import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import {
  Alert,
  AlertBody,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import RecipeForm from "@/components/forms/recipe-form";
import { getLocationConfig } from "@/lib/actions/location-config-actions";

/**
 * /bom-rules/new
 *
 * Routes the operator to the right authoring surface based on the active
 * location's type:
 *
 * - LOCATION (front-of-house / POS) → slim recipe form. Posts to
 *   /api/v1/bom/recipes; categories restricted to STOCK / SUB_RULE,
 *   substitution implicitly AVAILABILITY, no scrap / batch yields.
 *
 * - WAREHOUSE → not yet wired up here. The full /api/v1/bom/rules
 *   endpoint stays available; surface a pointer for now and follow up
 *   with a warehouse-side authoring page.
 */
export default async function NewBomRulePage() {
  const config = await getLocationConfig();
  const locationType = config?.locationType ?? "LOCATION";
  const isWarehouse = locationType === "WAREHOUSE";

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Consumption rules", href: "/bom-rules" },
          { title: "New" },
        ]}
      />
      <PageHeader
        title={isWarehouse ? "New BOM rule" : "New consumption rule"}
        subtitle={
          isWarehouse
            ? "Detailed warehouse rule — outputs, routings, batch yields."
            : "Map a product variant to the stock items it consumes when sold."
        }
      />
      <PageBody>
        {isWarehouse ? <WarehousePlaceholder /> : <RecipeForm />}
      </PageBody>
    </PageShell>
  );
}

function WarehousePlaceholder() {
  return (
    <Alert>
      <AlertIcon>
        <ChevronRight className="h-4 w-4" />
      </AlertIcon>
      <AlertBody>
        <AlertTitle>Warehouse rule authoring is coming next</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>
            The warehouse contract — multi-output yields, by-products,
            routings (setup time + per-unit run time), scrap percentages,
            and batch quantities — is still authored via the underlying
            <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-xs">
              POST /api/v1/bom/rules
            </code>
            endpoint. The simpler consumption rule authoring you see at
            LOCATION sites will get its warehouse counterpart in a follow-up.
          </p>
          <p>
            Until then, use the existing console workflow or the API
            directly. Consumption rules created via this page won&apos;t
            apply to warehouse-typed locations.
          </p>
          <div>
            <Button asChild variant="outline" size="sm">
              <Link href="/bom-rules">Back to consumption rules</Link>
            </Button>
          </div>
        </AlertDescription>
      </AlertBody>
    </Alert>
  );
}
