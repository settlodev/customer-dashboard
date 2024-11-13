import { Product } from "@/types/product/type";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface ProductProps {
    label: string;
    placeholder: string;
    products: Product[];
    isRequired?: boolean;
    value?: string;
    isDisabled?: boolean;
    description?: string;
    onChange: (value: string) => void;
    onBlur: () => void;
}
function ProductSelector({
    placeholder,
    value,
    isDisabled,
    onChange,
    products
}: ProductProps) {
    return (
        <Select value={value} onValueChange={onChange} disabled={isDisabled}>
            <SelectTrigger>
                <SelectValue placeholder={products.length > 0 ? placeholder : "No product found"}/>
            </SelectTrigger>
            <SelectContent>
                {products && products.length > 0 ?
                    products.map((item, index) => {
                        return <SelectItem key={index} value={item.id}>
                            {item.name}
                        </SelectItem>
                    })
                    : <></>}
            </SelectContent>
        </Select>
    )
}
export default ProductSelector
