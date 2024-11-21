import { Location } from "@/types/location/type";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

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
        <Select value={value} onValueChange={onChange} disabled={isDisabled}>
            <SelectTrigger>
                <SelectValue placeholder={placeholder || "Select location"}/>
            </SelectTrigger>
            <SelectContent>
                {locations && locations.length > 0 ?
                    locations.map((item, index) => {
                        return <SelectItem key={index} value={item.id}>
                            {item.name}
                        </SelectItem>
                    })
                    : <></>}
            </SelectContent>
        </Select>
    )
}
export default LocationSelector
