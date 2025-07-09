import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Staff } from "@/types/staff";
import { searchStaffFromWarehouse } from "@/lib/actions/warehouse/staff-actions";

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

function WarehouseStaffSelectorWidget({
    placeholder,
    value,
    isDisabled,
    onChange,
}: StaffProps) {
    const [staffs, setStaffs] = useState<Staff[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const q = "";
    const size = 10;
    const page = 0;

    useEffect(() => {
        async function loadStaffs() {
            try {
                setIsLoading(true);
                const fetchedStaffs = await searchStaffFromWarehouse(q, page, size);
                setStaffs(fetchedStaffs.content);
               
                if (!value && fetchedStaffs.content.length > 0) {
                    onChange(fetchedStaffs.content[0].id);
                }
            } catch (error: any) {
                console.log("Error fetching staff:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadStaffs();
    }, [onChange, value]);

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

export default WarehouseStaffSelectorWidget;