import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
    const cookieStore = await cookies();

    // Clear chunked auth token cookies
    cookieStore.delete("authToken");
    for (let i = 0; i < 10; i++) {
        cookieStore.delete(`authToken.${i}`);
    }

    // Clear internal-staff (admin portal) session cookies. SessionExpired hits
    // this route to recover a dead session; on the admin subdomain the session
    // lives entirely in staffAuthToken, so it must be cleared here too.
    cookieStore.delete("staffAuthToken");
    for (let i = 0; i < 10; i++) {
        cookieStore.delete(`staffAuthToken.${i}`);
    }

    // Clear session cookies
    cookieStore.delete("next-auth.session-token");
    cookieStore.delete("next-auth.csrf-token");
    cookieStore.delete("authjs.session-token");
    cookieStore.delete("authjs.csrf-token");
    cookieStore.delete("authjs.callback-url");

    // Clear app state cookies
    cookieStore.delete("activeBusiness");
    cookieStore.delete("currentBusiness");
    cookieStore.delete("currentLocation");
    cookieStore.delete("currentWarehouse");
    cookieStore.delete("pendingVerification");

    return NextResponse.json(
        { message: "Sessions cleared" },
        { status: 200 },
    );
}
