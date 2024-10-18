import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import {TaxClass} from "@/types/tax/type";

interface ProductTaxSelectorProps {
    label: string;
    placeholder: string;
    data: TaxClass[]|null;
    isRequired?: boolean;
    value?: string;
    isDisabled?: boolean;
    description?: string;
    onChange: (value: string) => void;
    onBlur: () => void;
}
function ProductTaxSelector({
    placeholder,
    value,
    isDisabled,
    onChange,
    data
}: ProductTaxSelectorProps) {
    return (
        <Select value={value} onValueChange={onChange} disabled={isDisabled}>
            <SelectTrigger>
                <SelectValue placeholder={placeholder || "Select tax"}/>
            </SelectTrigger>
            <SelectContent>
                {data && data.length > 0 ?
                    data.map((item, index) => {
                        return <SelectItem key={index} value={item.name}>
                            {item.displayName} - {item.amount}%
                        </SelectItem>
                    })
                    : <></>}
            </SelectContent>
        </Select>
    )
}
export default ProductTaxSelector
