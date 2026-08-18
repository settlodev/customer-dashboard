import { Combobox } from "@/components/ui/combobox";
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
        <Combobox
            options={(departments ?? []).map((item) => ({
                value: item.id,
                label: item.name,
            }))}
            value={value ?? null}
            onChange={(v) => onChange(v ?? "")}
            placeholder={placeholder || "Select category"}
            searchPlaceholder="Search categories…"
            emptyText="No categories found."
            disabled={isDisabled}
            ariaLabel="Category"
        />
    )
}
export default ProductDepartmentSelector
