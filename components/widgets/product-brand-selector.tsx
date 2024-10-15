import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import {ProductBrand} from "@/types/product/type";

interface ProductBrandSelectorProps {
    label: string;
    placeholder: string;
    brands: ProductBrand[];
    isRequired?: boolean;
    value?: string;
    isDisabled?: boolean;
    description?: string;
    onChange: (value: string) => void;
    onBlur: () => void;
}
function ProductBrandSelector({
    label,
    placeholder,
    isRequired,
    value,
    isDisabled,
    description,
    onChange,
    onBlur,
    brands
}: ProductBrandSelectorProps) {
    return (
        <Select value={value} onValueChange={onChange} disabled={isDisabled}>
            <SelectTrigger>
                <SelectValue placeholder={placeholder || "Select brand"}/>
            </SelectTrigger>
            <SelectContent>
                {brands && brands.length > 0 ?
                    brands.map((item, index) => {
                        return <SelectItem key={index} value={item.id}>
                            {item.name}
                        </SelectItem>
                    })
                    : <></>}
            </SelectContent>
        </Select>
    )
}
export default ProductBrandSelector
