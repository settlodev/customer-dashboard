import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Settlo - Daftari la kidigitali",
    short_name: "Settlo",
    description: "Tanzania's premier POS and business management platform",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#22c55e",
    icons: [
      {
        src: "/images/logo.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/images/logo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    related_applications: [
      {
        platform: "play",
        url: "https://play.google.com/store/apps/details?id=tz.co.settlo",
        id: "tz.co.settlo",
      },
    ],
    scope: "/",
    orientation: "any",
  };
}
