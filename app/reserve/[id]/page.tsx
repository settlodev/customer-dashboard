import ReservationWidget from "@/components/widgets/reservation/reservation-widget";

type Params = Promise<{ id: string }>;

export default async function ReservePage({ params }: { params: Params }) {
  const { id } = await params;

  return <ReservationWidget locationId={id} />;
}
