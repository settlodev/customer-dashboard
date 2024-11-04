import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import {ItemStatuses} from "@/types/constants";

interface ItemStatusSelectorProps {
    label: string;
    placeholder: string;
    isRequired?: boolean;
    value?: string;
    isDisabled?: boolean;
    description?: string;
    onChange: (value: string) => void;
    onBlur: () => void;
}
function ItemStatusSelector({
    placeholder,
    value,
    isDisabled,
    onChange
}: ItemStatusSelectorProps) {
    const statuses = ItemStatuses;
    return (
        <Select value={value} onValueChange={onChange} disabled={isDisabled}>
            <SelectTrigger>
                <SelectValue placeholder={placeholder || "Select category"}/>
            </SelectTrigger>
            <SelectContent>
                {statuses && statuses.length > 0 ?
                    statuses.map((item, index) => {
                        return <SelectItem key={index} value={String(item.value)}>
                            {item.name}
                        </SelectItem>
                    })
                    : <></>}
            </SelectContent>
        </Select>
    )
}
export default ItemStatusSelector
