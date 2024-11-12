import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import {StockVariant } from "@/types/stockVariant/type";

interface StockVariantProps {
    label: string;
    placeholder: string;
    stockVariants: StockVariant[];
    isRequired?: boolean;
    value?: string;
    isDisabled?: boolean;
    description?: string;
    onChange: (value: string) => void;
    onBlur: () => void;
}
function StockVariantSelector({
    placeholder,
    value,
    isDisabled,
    onChange,
    stockVariants
}: StockVariantProps) {
    return (
        <Select value={value} onValueChange={onChange} disabled={isDisabled}>
            <SelectTrigger>
                <SelectValue placeholder={placeholder || "Select stock variant"}/>
            </SelectTrigger>
            <SelectContent>
                {stockVariants && stockVariants.length > 0 ?
                    stockVariants.map((item, index) => {
                        return <SelectItem key={index} value={item.id}>
                            {item.name}
                        </SelectItem>
                    })
                    : <></>}
            </SelectContent>
        </Select>
    )
}
export default StockVariantSelector
