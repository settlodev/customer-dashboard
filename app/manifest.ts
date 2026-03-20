import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Settlo - Daftari la Kidigitali",
    short_name: "Settlo",
    description:
      "Tanzania's premier POS and business management platform helping African SMEs streamline their operations with sales tracking, inventory control, payments for retail, restaurant & service businesses.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#F8F0E9",
    icons: [
      {
        src: "/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    related_applications: [
      {
        platform: "play",
        url: "https://play.google.com/store/apps/details?id=tz.co.settlo.v3",
        id: "tz.co.settlo.v3",
      },
    ],
    scope: "/",
    orientation: "any",
  };
}
