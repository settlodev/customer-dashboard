import { AuthLayoutWrapper } from "@/components/auth/authLayout";
import "@/styles/globals.css";
import React from "react";
import {auth} from "@/auth";
import {SessionProvider} from "next-auth/react";

export default async function RootLayout({children}: {
    children: React.ReactNode;
}) {
    const session= await auth();

    return <SessionProvider session={session}>
        <AuthLayoutWrapper>{children}</AuthLayoutWrapper>
    </SessionProvider>
}
