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

  try {
    const settings = await fetchPublicReservationSettings(id);

    const title = settings?.metaTitle || defaultTitle;
    const description = settings?.metaDescription || defaultDescription;
    const image = settings?.shareImageUrl || defaultImage;
    const favicon = settings?.faviconUrl;

    return {
      title,
      description,
      ...(favicon && {
        icons: { icon: favicon },
      }),
      openGraph: {
        title,
        description,
        ...(image && { images: [{ url: image }] }),
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        ...(image && { images: [image] }),
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
