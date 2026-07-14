import { useEffect, useRef, useState } from "react";
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
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;
    const valueRef = useRef(value);
    valueRef.current = value;

    useEffect(() => {
        async function loadStaffs() {
            try {
                setIsLoading(true);
                const fetchedStaffs = await fetchAllStaff();
                setStaffs(fetchedStaffs);

                if (!valueRef.current && fetchedStaffs.length > 0) {
                    onChangeRef.current(fetchedStaffs[0].id);
                }
            } catch (error: any) {
                console.log("Error fetching staff:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadStaffs();
    }, []);

    return (
        <Select 
            value={value} 
            onValueChange={onChange} 
            disabled={isDisabled || isLoading}
        >
            <SelectTrigger>
                <SelectValue placeholder={placeholder || "Select staff"} />
            </SelectTrigger>
            <SelectContent>
                {staffs && staffs.length > 0 ? (
                    staffs.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                            {item.firstName} {item.lastName}
                        </SelectItem>
                    ))
                ) : (
                    <div className="p-2 text-sm text-gray-500">
                        No staff available
                    </div>
                )}
            </SelectContent>
        </Select>
    );
}

export default StaffSelectorWidget;