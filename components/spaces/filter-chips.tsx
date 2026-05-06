"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type Props = {
    currentTypes: string;
    currentParent: string;
    parentOptions: { id: string; name: string }[];
};

export default function SpacesFilterChips({
    currentTypes,
    currentParent,
    parentOptions,
}: Props) {
    const router = useRouter();
    const params = useSearchParams();

    const set = useCallback(
        (key: string, value: string | null) => {
            const next = new URLSearchParams(params.toString());
            if (!value) next.delete(key);
            else next.set(key, value);
            next.delete("page");
            router.push(`/spaces?${next.toString()}`);
        },
        [params, router],
    );

    const typeValue = currentTypes || "all";
    const parentValue = currentParent || "any";

    return (
        <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-sm text-muted-foreground">Type:</span>
            <Select
                value={typeValue}
                onValueChange={(v) => set("types", v === "all" ? null : v)}
            >
                <SelectTrigger className="w-40">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="spaces">Spaces only</SelectItem>
                    <SelectItem value="tables">Tables only</SelectItem>
                </SelectContent>
            </Select>

            <span className="text-sm text-muted-foreground ml-4">Parent:</span>
            <Select
                value={parentValue}
                onValueChange={(v) => set("parent", v === "any" ? null : v)}
            >
                <SelectTrigger className="w-56">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="top">Top-level only</SelectItem>
                    {parentOptions.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                            {p.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
