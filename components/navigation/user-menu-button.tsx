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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {Settings, User, LogOut, ChevronDown, LayoutDashboard} from "lucide-react";
import UserAvatar from "@/components/widgets/user-avatar";
import { ExtendedUser } from "@/types/types";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Location } from "@/types/location/type";
import { getAuthToken } from "@/lib/auth-utils";
import { getCurrentWarehouse } from "@/lib/actions/warehouse/current-warehouse-action";
import { Warehouses } from "@/types/warehouse/warehouse/type";

interface UserDropdownProps {
    user: ExtendedUser;
}

export const UserDropdown = ({ user }: UserDropdownProps) =>  {
    const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
    const initials = fullName.split(' ').map(n => n[0]).join('');
    const router = useRouter();

    const [currentLocation, setCurrentLocation] = useState<Location | undefined>(undefined);
    const [currentWarehouse, setCurrentWarehouse] = useState<Warehouses | undefined>(undefined);
    const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const [location, warehouse] = await Promise.all([
                getCurrentLocation(),
                getCurrentWarehouse()
            ]);
            setCurrentLocation(location as Location | undefined);
            setCurrentWarehouse(warehouse as Warehouses | undefined);
        };
        fetchData();
    }, []);

    const checkCurrentLocation = async () => {
        try {
            // Check if auth token exists
            const authToken = await getAuthToken();
            
            if (!authToken) {
                setShowSessionExpiredModal(true);
                return;
            }

            if (currentWarehouse) {
                router.push('/warehouse');
            } else if (currentLocation) {
                router.push('/dashboard');
            } else {
                router.push('/select-business');
            }
        } catch (error) {
            console.error('Error checking auth token:', error);
            // If there's an error checking the token, show session expired modal
            setShowSessionExpiredModal(true);
        }
    };

    const handleSessionExpiredConfirm = async () => {
        setShowSessionExpiredModal(false);
        await signOut();
    };

    return (
        <>
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

                    {currentLocation && currentLocation.subscriptionStatus && currentLocation.subscriptionStatus !== 'EXPIRED' && (
                        <>
                            <DropdownMenuItem asChild>
                                <a href="/profile" className="flex items-center cursor-pointer">
                                    <User className="mr-2 h-4 w-4" />
                                    <span>My Profile</span>
                                </a>
                            </DropdownMenuItem>

                            <DropdownMenuItem asChild>
                                <a href="/settings" className="flex items-center cursor-pointer">
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>Account Settings</span>
                                </a>
                            </DropdownMenuItem>
                        </>
                    )}

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

            {/* Session Expired Modal */}
            <Dialog open={showSessionExpiredModal} onOpenChange={setShowSessionExpiredModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <LogOut className="h-5 w-5 text-amber-500" />
                            Session Expired
                        </DialogTitle>
                        <DialogDescription className="text-base">
                            Currently your session has expired, please click the refresh button and log in again.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="sm:justify-center">
                        <Button 
                            onClick={handleSessionExpiredConfirm}
                            className="w-full sm:w-auto"
                        >
                            Refresh
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default UserDropdown;