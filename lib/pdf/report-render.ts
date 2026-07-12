/**
 * Server-side HTML→PDF via the self-hosted report-renderer service
 * (headless Chromium on the DigitalOcean droplet — no Docker, and NOT on
 * Vercel where Chromium doesn't fit). Turns a public document page (e.g.
 * `/cod/{token}`) into a PDF for email attachments; Vercel just calls out
 * to the droplet service.
 *
 * Configure `REPORT_RENDER_URL` (e.g. https://renderer.example.com) and
 * `REPORT_RENDER_SECRET` (the shared secret the service checks). See
 * /report-renderer for the service itself.
 */

const RENDER_URL = process.env.REPORT_RENDER_URL?.replace(/\/$/, "") ?? "";
const RENDER_SECRET = process.env.REPORT_RENDER_SECRET ?? "";

export function isPdfRenderConfigured(): boolean {
  return RENDER_URL.length > 0;
}

/** Render a public URL to a PDF via the report-renderer service. */
export async function renderUrlToPdf(url: string): Promise<Buffer> {
  if (!RENDER_URL) {
    throw new Error("REPORT_RENDER_URL is not configured — cannot render PDF");
  }

  const res = await fetch(`${RENDER_URL}/render`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(RENDER_SECRET ? { "X-Render-Secret": RENDER_SECRET } : {}),
    },
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`PDF render failed (${res.status}): ${body.slice(0, 200)}`);
  }

  return Buffer.from(await res.arrayBuffer());
}
