import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getPublicProforma } from "@/lib/actions/invoicing-public-actions";
import { PublicProformaView } from "./public-proforma-view";

export const metadata: Metadata = {
  title: "Proforma invoice",
  robots: { index: false, follow: false },
};

type Params = Promise<{ token: string }>;

export default async function PublicProformaPage({
  params,
}: {
  params: Params;
}) {
  const { token } = await params;
  const proforma = await getPublicProforma(token);
  if (!proforma) notFound();

  return <PublicProformaView token={token} initial={proforma} />;
}
