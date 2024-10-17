import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import {Department} from "@/types/department/type";

interface ProductDepartmentSelectorProps {
    label: string;
    placeholder: string;
    departments: Department[];
    isRequired?: boolean;
    value?: string;
    isDisabled?: boolean;
    description?: string;
    onChange: (value: string) => void;
    onBlur: () => void;
}
function ProductDepartmentSelector({
    placeholder,
    value,
    isDisabled,
    onChange,
    departments
}: ProductDepartmentSelectorProps) {
    return (
        <Select value={value} onValueChange={onChange} disabled={isDisabled}>
            <SelectTrigger>
                <SelectValue placeholder={placeholder || "Select category"}/>
            </SelectTrigger>
            <SelectContent>
                {departments && departments.length > 0 ?
                    departments.map((item, index) => {
                        return <SelectItem key={index} value={item.id}>
                            {item.name}
                        </SelectItem>
                    })
                    : <></>}
            </SelectContent>
        </Select>
    )
}
export default ProductDepartmentSelector
