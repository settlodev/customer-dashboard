import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Staff } from "@/types/staff";

interface StaffProps {
    label: string;
    placeholder: string;
    staffs: Staff[];
    isRequired?: boolean;
    value?: string;
    isDisabled?: boolean;
    description?: string;
    onChange: (value: string) => void;
    onBlur: () => void;
}
function StaffSelectorWidget({
    placeholder,
    value,
    isDisabled,
    onChange,
    staffs
}: StaffProps) {
    return (
        <Select value={value} onValueChange={onChange} disabled={isDisabled}>
            <SelectTrigger>
                <SelectValue placeholder={placeholder || "Select staff"}/>
            </SelectTrigger>
            <SelectContent>
                {staffs && staffs.length > 0 ?
                    staffs.map((item, index) => {
                        return <SelectItem key={index} value={item.id}>
                            {item.name}
                        </SelectItem>
                    })
                    : <></>}
            </SelectContent>
        </Select>
    )
}
export default StaffSelectorWidget
