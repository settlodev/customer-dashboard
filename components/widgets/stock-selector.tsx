import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Stock } from "@/types/stock/type";

interface StockProps {
    label: string;
    placeholder: string;
    stocks: Stock[];
    isRequired?: boolean;
    value?: string;
    isDisabled?: boolean;
    description?: string;
    onChange: (value: string) => void;
    onBlur: () => void;
}
function StockSelector({
    placeholder,
    value,
    isDisabled,
    onChange,
    stocks
}: StockProps) {
    return (
        <Select value={value} onValueChange={onChange} disabled={isDisabled}>
            <SelectTrigger>
                <SelectValue placeholder={placeholder || "Select stock"}/>
            </SelectTrigger>
            <SelectContent>
                {stocks && stocks.length > 0 ?
                    stocks.map((item, index) => {
                        return <SelectItem key={index} value={item.id}>
                            {item.name}
                        </SelectItem>
                    })
                    : <></>}
            </SelectContent>
        </Select>
    )
}
export default StockSelector
