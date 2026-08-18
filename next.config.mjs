import { withSentryConfig } from "@sentry/nextjs";

if (process.env.NODE_ENV !== "production") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // Manual-payment proof uploads (record-payment-dialog) stream a file
      // up to 10MB through the recordManualPayment Server Action. Next's
      // default Server Action body limit is 1MB, so raise it with headroom
      // for the multipart boundary + the other form fields.
      bodySizeLimit: "12mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "fhuvexerkaysoazmmlal.supabase.co",
        port: "",
      },
      {
        protocol: "https",
        hostname: "lporvjkotuidemnfvuzt.supabase.co",
        port: "",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
      },
      {
        protocol: "https",
        hostname: "app.tallity.co.tz",
        port: "",
      },
      {
        protocol: "https",
        hostname: "app.tality.co.tz",
        port: "",
      },
      {
        protocol: "https",
        hostname: "pub-fad679d0263c4fa9acb979076c137440.r2.dev",
        port: "",
      },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  org: "settlo-technologies",
  project: "web-dashboard",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  reactComponentAnnotation: {
    enabled: true,
  },
  tunnelRoute: "/monitoring",
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: true,
});
