import type { Metadata } from "next";
import ReservationWidget from "@/components/widgets/reservation/reservation-widget";
import { fetchPublicReservationSettings } from "@/lib/actions/public-reservation-actions";

type Params = Promise<{ id: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { id } = await params;

  const defaultTitle = "Book a Reservation | Settlo";
  const defaultDescription =
    "Book a table reservation online with Settlo";
  const defaultImage = "https://settlo.co.tz/og-image.png";

  // SEO branding (meta title / description / share image / favicon) is no
  // longer carried by PublicReservationSetting — it lives on the location /
  // business records and would be fetched separately if/when needed. For now
  // we always return the defaults; restore richer metadata by pulling
  // {@code fetchPublicLocationInfo} here when SEO matters.
  try {
    void (await fetchPublicReservationSettings(id));

    return {
      title: defaultTitle,
      description: defaultDescription,
      openGraph: {
        title: defaultTitle,
        description: defaultDescription,
        images: [{ url: defaultImage }],
      },
      twitter: {
        card: "summary_large_image",
        title: defaultTitle,
        description: defaultDescription,
        images: [defaultImage],
      },
    };
  } catch {
    return {
      title: defaultTitle,
      description: defaultDescription,
    };
  }
}

export default async function ReservePage({ params }: { params: Params }) {
  const { id } = await params;

  let settings = null;
  try {
    settings = await fetchPublicReservationSettings(id);
  } catch {
    // Widget will handle the error state
  }

  return <ReservationWidget locationId={id} initialSettings={settings} />;
}
