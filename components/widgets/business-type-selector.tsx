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

    return (
        <Select value={value} onValueChange={onChange} disabled={isDisabled}>
              <SelectTrigger>
                    <SelectValue placeholder={placeholder ||"Select business type"} />
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