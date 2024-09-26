import {cookies} from "next/headers";
import {AuthToken} from "@/lib/auth";

export const getAuthToken = async (): Promise<AuthToken | null> => {
    const cookieStore = cookies();

    const tokens = cookieStore.get("authToken")?.value;

    if (!tokens) return null;

    return JSON.parse(tokens) as AuthToken;
};
