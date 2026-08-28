import ApiClient from "@/lib/settlo-api-client";

/**
 * Same-origin proxy for a manual payment's proof file. Browsers can't pass
 * the staff Authorization header on <img src>, <iframe src>, or window.open,
 * so the backend's authenticated /manual-payments/{id}/proof endpoint is
 * unreachable from the client directly. This route runs server-side,
 * attaches staff auth via ApiClient, and streams the bytes back with an
 * inline disposition by default — the proof preview dialog then just works.
 *
 * Mirrors app/api/attachments/[id]/route.ts (same problem, inventory side).
 *
 * Append ?disposition=attachment for the Download button to force a file
 * save instead of inline render.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const requested = new URL(request.url).searchParams.get("disposition");
  const disposition = requested === "attachment" ? "attachment" : "inline";

  try {
    const apiClient = new ApiClient("billing", "staff");
    const result = await apiClient.downloadFile(
      `/api/v1/support/billing/manual-payments/${id}/proof`,
      "image/*,application/pdf",
    );

    const safeName = (result.filename || "proof").replace(/"/g, "");
    return new Response(new Uint8Array(result.data), {
      status: 200,
      headers: {
        "Content-Type": result.contentType,
        "Content-Disposition": `${disposition}; filename="${safeName}"`,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Download failed";
    return new Response(message, { status: 502 });
  }
}
