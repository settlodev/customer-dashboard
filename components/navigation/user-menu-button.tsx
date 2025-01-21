"use client"

import { signOut } from "next-auth/react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {Settings, User, LogOut, ChevronDown, LayoutDashboard} from "lucide-react";
import UserAvatar from "@/components/widgets/user-avatar";
import { ExtendedUser } from "@/types/types";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface UserDropdownProps {
    user: ExtendedUser;
}

export const UserDropdown = ({ user }: UserDropdownProps) =>  {
    const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
    const initials = fullName.split(' ').map(n => n[0]).join('');
    const router = useRouter();

    const [currentLocation, setCurrentLocation] = useState<Location | undefined>(undefined);

    useEffect(() => {
        const fetchCurrentLocation = async () => {
            const location = await getCurrentLocation();
            console.log('Current location:', location);
            setCurrentLocation(location as Location | undefined);

        };

        fetchCurrentLocation();
    }, []); 

    const checkCurrentLocation = () => {
        if (currentLocation) {
            router.push('/dashboard');
        } else {
            router.push('/select-business');
        }
    };
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-12 px-2 gap-2">
                    <div className="flex items-center gap-2">
                        <div className="hidden lg:block text-right">
                            <p className="text-sm font-medium leading-none">{fullName}</p>
                            <p className="text-xs text-muted-foreground">
                                {user?.email}
                            </p>
                        </div>

                        <UserAvatar
                            src={user?.avatar}
                            alt={fullName}
                            fallback={initials}
                            className="h-8 w-8"
                        />
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
               
                        <DropdownMenuItem asChild>
                            <a onClick={checkCurrentLocation} className="flex items-center cursor-pointer">
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                <span>Dashboard</span>
                            </a>
                        </DropdownMenuItem>
                

                <DropdownMenuItem asChild>
                    <a href="/profile" className="flex items-center cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>My Profile</span>
                    </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    {/* <a href="/renew-subscription" className="flex items-center cursor-pointer">
                        <CreditCard className="mr-2 h-4 w-4" />
                        <span>Renew Subscription</span>
                    </a> */}
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                    <a href="/settings" className="flex items-center cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Account Settings</span>
                    </a>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    onClick={() => signOut()}
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log Out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default UserDropdown;
