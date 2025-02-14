import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
    const cookieStore = cookies();

    cookieStore.delete("authToken");
    cookieStore.delete("next-auth.session-token");
    cookieStore.delete("next-auth.csrf-token");

    return NextResponse.json(
        { message: "Previous user sessions cleared" },
        { status: 200 },
    );
}
