import { UUID } from "node:crypto";

import { notFound } from "next/navigation";
import { isNotFoundError } from "next/dist/client/components/not-found";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import {Role} from "@/types/roles/type";
import {ApiResponse} from "@/types/types";
import {getRole} from "@/lib/actions/role-actions";
import RoleForm from "@/components/forms/role_form";

export default async function RolesPage({params}: {
    params: { id: string };
}) {
    const isNewItem = params.id === "new";
    let item: ApiResponse<Role> | null = null;

    if (!isNewItem) {
        try {
            item = await getRole(params.id as UUID);
            if (item.totalElements == 0) notFound();
        } catch (error) {
            // Ignore redirect error
            if (isNotFoundError(error)) throw error;

            throw new Error("Failed to load role data");
        }
    }

    const breadcrumbItems = [
        { title: "Roles", link: "/roles" },
        {
            title: isNewItem ? "New" : item?.content[0]?.name || "Edit",
            link: "",
        },
    ];

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between mb-2">
                <div className="relative flex-1 md:max-w-md">
                    <BreadcrumbsNav items={breadcrumbItems} />
                </div>
            </div>

            <RoleCard isNewItem={isNewItem} item={item?.content[0]} />
        </div>
    );
}

const RoleCard = ({isNewItem, item}: {
    isNewItem: boolean;
    item: Role | null | undefined;
}) => (
    <Card>
        <CardHeader>
            <CardTitle>{isNewItem ? "Add role" : "Edit role details"}</CardTitle>
            <CardDescription>
                {isNewItem ? "Add roles to your business" : "Edit role details"}
            </CardDescription>
        </CardHeader>
        <CardContent>
            <RoleForm item={item} />
        </CardContent>
    </Card>
);
