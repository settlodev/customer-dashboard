import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Staff } from "@/types/staff";
import { fetchAllStaff } from "@/lib/actions/staff-actions";

interface StaffProps {
    label: string;
    placeholder: string;
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
}: StaffProps) {
    const [staffs, setStaffs] = useState<Staff[]>([]);

    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        async function loadStaffs() {
            try {
                setIsLoading(true);
                const fetchedStaffs = await fetchAllStaff();
                setStaffs(fetchedStaffs);
            } catch (error: any) {
                console.log("Error fetching  staff:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadStaffs();
    }, []);
    return (
        <Select value={value} onValueChange={onChange} disabled={isDisabled || isLoading}>
            <SelectTrigger>
                <SelectValue placeholder={placeholder || "Select staff"}/>
            </SelectTrigger>
            <SelectContent>
                {staffs && staffs.length > 0 ?
                    staffs.map((item, index) => {
                        return <SelectItem key={index} value={item.id}>
                            {item.firstName} {item.lastName}
                        </SelectItem>
                    })
                    : <></>}
            </SelectContent>
        </Select>
    )
}
export default StaffSelectorWidget
