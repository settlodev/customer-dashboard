import { Combobox } from "@/components/ui/combobox";
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
        <Combobox
            options={stocks.map((item) => ({ value: item.id, label: item.name }))}
            value={value ?? null}
            onChange={(v) => onChange(v ?? "")}
            placeholder={placeholder || "Select stock"}
            searchPlaceholder="Search stocks…"
            emptyText="No stocks found."
            disabled={isDisabled}
            ariaLabel="Stock"
        />
    )
}
export default StockSelector
