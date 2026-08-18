import { Product } from "@/types/product/type";
import { Combobox } from "@/components/ui/combobox";

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
        <Combobox
            options={products.map((item) => ({ value: item.id, label: item.name }))}
            value={value ?? null}
            onChange={(v) => onChange(v ?? "")}
            placeholder={products.length > 0 ? placeholder : "No product found"}
            searchPlaceholder="Search products…"
            emptyText="No products found."
            disabled={isDisabled}
            ariaLabel="Product"
        />
    )
}
export default ProductSelector
