import { UUID } from "node:crypto";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import {Role} from "@/types/roles/type";
import { getWarehouseRole } from "@/lib/actions/warehouse/roles-action";
import WarehouseRoleForm from "@/components/forms/warehouse/role_form";

type Params = Promise<{ id: string }>;
export default async function WarehouseRolePage({params}: {params: Params}) {

    const resolvedParams = await params;
    const isNewItem = resolvedParams.id === "new";
    let item: Role| null = null;

    if (!isNewItem) {
        try {
            item = await getWarehouseRole(resolvedParams.id as UUID);
            
        } catch (error) {
            
            console.log(error)
            throw new Error("Failed to load role data");
        }
    }

    const breadcrumbItems = [
        { title: "Roles", link: "/warehouse-role" },
        {
            title: isNewItem ? "New" : item?.name || "Edit",
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

            <RoleCard isNewItem={isNewItem} item={item} />
        </div>
    );
}

const RoleCard = ({isNewItem, item}: {
    isNewItem: boolean;
    item: Role | null | undefined;
}) => (
    <Card>
        <CardContent>
            <WarehouseRoleForm item={item} />
        </CardContent>
    </Card>
);
