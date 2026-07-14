"use client";

import React, { Suspense } from "react";
import { LoadingBarContainer } from "react-top-loading-bar";
import { RouteLoadingBar } from "@/components/navigation/route-loading-bar";

export const LoadingBarProvider = ({ children }: { children: React.ReactNode }) => {
    return (
        <LoadingBarContainer props={{ color: "#EB7F44", height: 2 }}>
            <Suspense>
                <RouteLoadingBar />
            </Suspense>
            {children}
        </LoadingBarContainer>
    );
};
