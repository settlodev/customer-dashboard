import { Supplier } from "@/types/supplier/type";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface SupplierProps {
    label: string;
    placeholder: string;
    suppliers: Supplier[];
    isRequired?: boolean;
    value?: string;
    isDisabled?: boolean;
    description?: string;
    onChange: (value: string) => void;
    onBlur: () => void;
}
function SupplierSelector({
    placeholder,
    value,
    isDisabled,
    onChange,
    suppliers
}: SupplierProps) {
    return (
        <Select value={value} onValueChange={onChange} disabled={isDisabled}>
            <SelectTrigger>
                <SelectValue placeholder={placeholder || "Select supplier"}/>
            </SelectTrigger>
            <SelectContent>
                {suppliers && suppliers.length > 0 ?
                    suppliers.map((item, index) => {
                        return <SelectItem key={index} value={item.id}>
                            {item.name}
                        </SelectItem>
                    })
                    : <></>}
            </SelectContent>
        </Select>
    )
}
export default SupplierSelector
