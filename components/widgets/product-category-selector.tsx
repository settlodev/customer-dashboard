import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import {Category} from "@/types/category/type";

interface ProductCategorySelectorProps {
    label: string;
    placeholder: string;
    categories: Category[]|null;
    isRequired?: boolean;
    value?: string;
    isDisabled?: boolean;
    description?: string;
    onChange: (value: string) => void;
    onBlur: () => void;
}
function ProductCategorySelector({
    label,
    placeholder,
    isRequired,
    value,
    isDisabled,
    description,
    onChange,
    onBlur,
    categories
}: ProductCategorySelectorProps) {
    return (
        <Select value={value} onValueChange={onChange} disabled={isDisabled}>
            <SelectTrigger>
                <SelectValue placeholder={placeholder || "Select category"}/>
            </SelectTrigger>
            <SelectContent>
                {categories && categories.length > 0 ?
                    categories.map((item, index) => {
                        return <SelectItem key={index} value={item.id}>
                            {item.name}
                        </SelectItem>
                    })
                    : <></>}
            </SelectContent>
        </Select>
    )
}
export default ProductCategorySelector
