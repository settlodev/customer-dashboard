import { Recipe } from "@/types/recipe/type";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useEffect, useState } from "react";
import { fetchRecipes } from "@/lib/actions/recipe-actions";
import { Customer } from "@/types/customer/type";
import { fetchAllCustomers } from "@/lib/actions/customer-actions";

interface CustomerProps {
    label?: string;
    placeholder: string;
    isRequired?: boolean;
    value?: string;
    isDisabled?: boolean;
    description?: string;
    onChange: (value: string) => void;
    onBlur?: () => void;
}
function CustomerSelector({
    placeholder,
    value,
    isDisabled,
    onChange,
}: CustomerProps) {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        async function loadCustomers() {
            try {
                setIsLoading(true);
                const fetchedCustomers = await fetchAllCustomers();
                setCustomers(fetchedCustomers);
            } catch (error: any) {
                console.log("Error fetching customers:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadCustomers();
    }, []);
    return (
        
        <div className="space-y-2">
        <Select
            defaultValue={value}
            disabled={isDisabled || isLoading}
            value={value}
            onValueChange={onChange}
        >
            <SelectTrigger className="w-full">
                <SelectValue
                    placeholder={placeholder || "Select customer"}
                />
            </SelectTrigger>
            <SelectContent>
                {customers.map((customer) => (
                    <SelectItem
                        key={customer.id}
                        value={customer.id}
                    >
                        {customer.firstName} {customer.lastName}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
        
    </div>
    )
}
export default CustomerSelector
