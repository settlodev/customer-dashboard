import { UUID } from "crypto";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useEffect, useState } from "react";
import { fetchBusinessType } from "@/lib/actions/business-actions";

interface BusinessType{
    id: UUID
    name: string
    status: boolean
    canDelete: boolean
    isArchived: boolean
}
interface BusinessTypeSelectorProps {
    label: string;
    placeholder: string;
    isRequired?: boolean;
    value?: string;
    isDisabled?: boolean;
    description?: string;
    onChange: (value: string) => void;
    onBlur: () => void;
}
function BusinessTypeSelector({
    placeholder,
    value,
    isDisabled,
    onChange,
}: BusinessTypeSelectorProps) {

const [businessType, setBusinessType] = useState<BusinessType[]>([]);
const [isLoading, setIsLoading] = useState<boolean>(true);

useEffect(() => {
    async function loadBusinessType() {
        try {
            setIsLoading(true);
            const fetchedBusinessType = await fetchBusinessType();
            setBusinessType(fetchedBusinessType);
        } catch (error: any) {
            console.log("Error fetching customers:", error);
        } finally {
            setIsLoading(false);
        }
    }
    loadBusinessType();
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
                placeholder={placeholder || "Select business type"}
            />
        </SelectTrigger>
        <SelectContent>
            {businessType.map((type) => (
                <SelectItem
                    key={type.id}
                    value={type.id}
                >
                    {type.name}
                </SelectItem>
            ))}
        </SelectContent>
    </Select>
    
</div>
)
}
export default BusinessTypeSelector