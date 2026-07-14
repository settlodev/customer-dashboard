"use client";

import { useEffect, useCallback, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useLoadingBar } from "react-top-loading-bar";

export const RouteLoadingBar = () => {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { start, complete } = useLoadingBar({
        color: "#EB7F44",
        height: 2,
    });
    const startRef = useRef(start);
    startRef.current = start;

    // Complete the loading bar when the route changes
    useEffect(() => {
        complete();
    }, [pathname, searchParams]);

    // Intercept link clicks to start the bar
    const handleClick = useCallback(
        (e: MouseEvent) => {
            const anchor = (e.target as HTMLElement).closest("a");
            if (!anchor) return;

            const href = anchor.getAttribute("href");
            if (
                !href ||
                href.startsWith("#") ||
                href.startsWith("mailto:") ||
                href.startsWith("tel:") ||
                anchor.target === "_blank" ||
                e.metaKey ||
                e.ctrlKey
            ) {
                return;
            }

            // Only trigger for internal links navigating to a different page
            try {
                const url = new URL(href, window.location.origin);
                if (url.origin !== window.location.origin) return;
                if (url.pathname === pathname && url.search === (searchParams?.toString() ? `?${searchParams}` : "")) return;
                startRef.current();
            } catch {
                // Invalid URL, skip
            }
        },
        [pathname, searchParams]
    );

    useEffect(() => {
        document.addEventListener("click", handleClick, true);
        return () => {
            document.removeEventListener("click", handleClick, true);
        };
    }, [handleClick]);

    return null;
};
