import { Combobox } from "@/components/ui/combobox";
import { useEffect, useState } from "react";
import { Warehouses } from "@/types/warehouse/warehouse/type";
import { searchWarehouses } from "@/lib/actions/warehouse/list-warehouse";

interface WarehouseProps {
    label: string;
    placeholder: string;
    isRequired?: boolean;
    value?: string;
    isDisabled?: boolean;
    description?: string;
    onChange: (value: string) => void;
    onBlur: () => void;
}
function WarehouseSelector({
    placeholder,
    value,
    isDisabled,
    onChange,
}: WarehouseProps) {
    const [warehouses, setWarehouses] = useState<Warehouses[]>([]);

    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        async function loadSuppliers() {
            try {
                setIsLoading(true);
                const fetchedWarehouses = await searchWarehouses();
                setWarehouses(fetchedWarehouses);
            } catch (error: any) {
                console.log("Error fetching warehouses:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadSuppliers();
    }, []);
    return (
        <Combobox
            options={warehouses.map((item) => ({
                value: item.id,
                label: item.name,
            }))}
            value={value ?? null}
            onChange={(v) => onChange(v ?? "")}
            placeholder={placeholder || "Select warehouse"}
            searchPlaceholder="Search warehouses…"
            emptyText={isLoading ? "Loading warehouses…" : "No warehouses available"}
            disabled={isDisabled || isLoading}
            ariaLabel="Warehouse"
        />
    )
}
export default WarehouseSelector