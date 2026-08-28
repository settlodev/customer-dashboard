import { robotsTxtForHost } from "@/lib/crawl-policy";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");

  return new Response(robotsTxtForHost(host), {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
