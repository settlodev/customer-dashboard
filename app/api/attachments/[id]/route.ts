import ApiClient from "@/lib/settlo-api-client";
import { inventoryUrl } from "@/lib/actions/inventory-client";

/**
 * Same-origin proxy for inventory attachments. Browsers can't pass the
 * Authorization header on <img src>, <iframe src>, or window.open, so
 * the backend's authenticated /attachments/download/{id} endpoint is
 * unreachable from the client directly. This route runs server-side,
 * attaches auth via ApiClient, and streams the bytes back with an
 * inline disposition by default — the image preview dialog and the PDF
 * iframe then just work.
 *
 * Append ?disposition=attachment for the Download button to force a
 * file save instead of inline render.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const requested = new URL(request.url).searchParams.get("disposition");
  const disposition = requested === "attachment" ? "attachment" : "inline";

  try {
    const apiClient = new ApiClient();
    const result = await apiClient.downloadFile(
      inventoryUrl(`/api/v1/attachments/download/${id}`),
      "*/*",
    );

    const safeName = (result.filename || "file").replace(/"/g, "");
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
