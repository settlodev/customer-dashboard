import { Supplier } from "@/types/supplier/type";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useEffect, useState } from "react";
import { fetchSuppliers } from "@/lib/actions/supplier-actions";

interface SupplierProps {
    label: string;
    placeholder: string;
    isRequired?: boolean;
    value?: string;
    isDisabled?: boolean;
    description?: string;
    onChange: (value: string) => void;
    onBlur: () => void;
}
function SupplierSelector({
    placeholder,
    value,
    isDisabled,
    onChange,
}: SupplierProps) {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);

    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        async function loadSuppliers() {
            try {
                setIsLoading(true);
                const fetchedSuppliers = await fetchSuppliers();
                setSuppliers(fetchedSuppliers);
            } catch (error: any) {
                console.log("Error fetching  suppliers:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadSuppliers();
    }, []);
    return (
        <Select value={value} onValueChange={onChange} disabled={isDisabled || isLoading}>
            <SelectTrigger>
                <SelectValue placeholder={placeholder || "Select supplier"}/>
            </SelectTrigger>
            <SelectContent>
                {suppliers && suppliers.length > 0 ?
                    suppliers.map((item, index) => {
                        return <SelectItem key={index} value={item.id}>
                            {item.name}
                        </SelectItem>
                    })
                    : <></>}
            </SelectContent>
        </Select>
    )
}
export default SupplierSelector
