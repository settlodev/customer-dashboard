import { broadcastType } from "@/types/enums";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface BroadCastTypeSelectorProps {
    label: string;
    placeholder: string;
    isRequired?: boolean;
    value?: string;
    isDisabled?: boolean;
    description?: string;
    onChange: (value: string) => void;
    onBlur: () => void;
}
function BroadCastTypeSelector({
    placeholder,
    value,
    isDisabled,
    onChange,
}: BroadCastTypeSelectorProps) {

    return (
        <Select value={value} onValueChange={onChange} disabled={isDisabled}>
              <SelectTrigger>
                    <SelectValue placeholder={placeholder ||"Select discount type"} />
                </SelectTrigger>
            <SelectContent>
                <SelectItem key={broadcastType.SMS} value={broadcastType.SMS}>
                    SMS
                </SelectItem>
                <SelectItem key={broadcastType.EMAIL} value={broadcastType.EMAIL}>
                    Email
                </SelectItem>

                <SelectItem key={broadcastType.NOTIFICATION} value={broadcastType.NOTIFICATION}>
                    Notification
                </SelectItem>

            </SelectContent>
        </Select>
    )
}
export default BroadCastTypeSelector