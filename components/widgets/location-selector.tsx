import { Location } from "@/types/location/type";
import { Combobox } from "@/components/ui/combobox";

interface LocationProps {
    label: string;
    placeholder: string;
    locations: Location[];
    isRequired?: boolean;
    value?: string;
    isDisabled?: boolean;
    description?: string;
    onChange: (value: string) => void;
    onBlur: () => void;
}
function LocationSelector({
    placeholder,
    value,
    isDisabled,
    onChange,
    locations
}: LocationProps) {
    return (
        <Combobox
            options={locations.map((item) => ({ value: item.id, label: item.name }))}
            value={value ?? null}
            onChange={(v) => onChange(v ?? "")}
            placeholder={placeholder || "Select location"}
            searchPlaceholder="Search locations…"
            emptyText="No locations found."
            disabled={isDisabled}
            ariaLabel="Location"
        />
    )
}
export default LocationSelector
