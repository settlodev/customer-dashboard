// import { Select, SelectTrigger, SelectValue } from "@radix-ui/react-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { BusinessType } from "@/types/enums";

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

    const isValidValue = [BusinessType.RETAIL, BusinessType.HOSPITALITY].includes(value as BusinessType);

    return (
        <Select value={isValidValue ? value : ""} onValueChange={onChange} disabled={isDisabled}>
            <SelectTrigger>
                <SelectValue placeholder={placeholder || "Select business type"}>
                    {value ? (value === BusinessType.RETAIL ? "Retail" : "Hospitality") : placeholder}
                </SelectValue>
            </SelectTrigger>
            <SelectContent>
                <SelectItem key={BusinessType.RETAIL} value={BusinessType.RETAIL}>
                    Retail
                </SelectItem>
                <SelectItem key={BusinessType.HOSPITALITY} value={BusinessType.HOSPITALITY}>
                    Hospitality
                </SelectItem>
            </SelectContent>
        </Select>
    )
}

export default BusinessTypeSelector