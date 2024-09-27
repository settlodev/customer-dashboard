import Link from "next/link";
import { HomeIcon } from "@radix-ui/react-icons";

import { buttonVariants } from "@/components/ui/button";
import {cn} from "@/lib/utils";

export default async function NotFound() {
    return (
        <div className="h-svh">
            <div className="m-auto flex h-full w-full flex-col items-center justify-center gap-2">
                <h1 className="text-[7rem] font-bold leading-tight">404</h1>
                <span className="font-medium">Oops! Page Not Found!</span>
                <p className="text-center text-muted-foreground">
                    It seems like the page you&#39;re looking for <br />
                    does not exist or might have been removed.
                </p>
                <div className="mt-6 flex gap-4">
                    <Link
                        className={cn(buttonVariants({ variant: "default" }))}
                        href={`/dashboard`}
                    >
                        <HomeIcon className="mr-2 h-4 w-4" /> Go home
                    </Link>
                </div>
            </div>
        </div>
    );
}
