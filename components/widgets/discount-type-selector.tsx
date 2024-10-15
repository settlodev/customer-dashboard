// import { Select, SelectTrigger, SelectValue } from "@radix-ui/react-select";
import { discountType } from "@/types/enums";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface DiscountTypeSelectorProps {
    label: string;
    placeholder: string;
    isRequired?: boolean;
    value?: string;
    isDisabled?: boolean;
    description?: string;
    onChange: (value: string) => void;
    onBlur: () => void;
}
function DiscountTypeSelector({
    placeholder,
    value,
    isDisabled,
    onChange,
}: DiscountTypeSelectorProps) {

    return (
        <Select value={value} onValueChange={onChange} disabled={isDisabled}>
              <SelectTrigger>
                    <SelectValue placeholder={placeholder ||"Select discount type"} />
                </SelectTrigger>
            <SelectContent>
                <SelectItem key={discountType.FIXED} value={discountType.FIXED}>
                    Fixed
                </SelectItem>
                <SelectItem key={discountType.PERCENTAGE} value={discountType.PERCENTAGE}>
                    Percentage
                </SelectItem>

            </SelectContent>
        </Select>
    )
}
export default DiscountTypeSelector