import { UUID } from "crypto";
import { Combobox } from "@/components/ui/combobox";
import { useEffect, useState } from "react";
import { fetchBusinessType } from "@/lib/actions/business-actions";

interface BusinessType{
    id: UUID
    name: string
    code: string
    displayOrder: number
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
    onBlur,
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
    <Combobox
        options={businessType.map((type) => ({
            value: type.id,
            label: type.name,
            keywords: [type.code],
        }))}
        value={value ?? null}
        onChange={(v) => onChange(v ?? "")}
        placeholder={placeholder || "Select business type"}
        searchPlaceholder="Search business types…"
        emptyText={isLoading ? "Loading business types…" : "No business types found."}
        disabled={isDisabled || isLoading}
        ariaLabel="Business type"
        onOpenChange={(open) => {
            if (!open) onBlur?.();
        }}
    />
    
</div>
)
}
export default BusinessTypeSelector