import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
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
                const fetchedWarehouses = await searchWarehouses("", 0, 10);
                setWarehouses(fetchedWarehouses.content);
            } catch (error: any) {
                console.log("Error fetching warehouses:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadSuppliers();
    }, []);
    return (
        <Select value={value} onValueChange={onChange} disabled={isDisabled || isLoading}>
            <SelectTrigger>
                <SelectValue placeholder={placeholder || "Select warehouse"}/>
            </SelectTrigger>
            <SelectContent>
                {warehouses && warehouses.length > 0 ?
                    warehouses.map((item, index) => {
                        return <SelectItem key={index} value={item.id}>
                            {item.name}
                        </SelectItem>
                    })
                    : <></>}
            </SelectContent>
        </Select>
    )
}
export default WarehouseSelector