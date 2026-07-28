import ShareProforma from "@/components/proforma/shared-proforma";

export default async function SharePerforma({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ShareProforma proformaId={id} />;
}
