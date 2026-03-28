"use client";

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
import {
  Settings,
  User,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  Loader2,
} from "lucide-react";
import UserAvatar from "@/components/widgets/user-avatar";
import { ExtendedUser } from "@/types/types";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Location } from "@/types/location/type";
import { getAuthToken } from "@/lib/auth-utils";
import { logout } from "@/lib/actions/auth-actions";
import { getCurrentWarehouse } from "@/lib/actions/warehouse/current-warehouse-action";
import { Warehouses } from "@/types/warehouse/warehouse/type";

interface UserDropdownProps {
  user: ExtendedUser;
}

export const UserDropdown = ({ user }: UserDropdownProps) => {
  const fullName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("");
  const router = useRouter();


    const [currentLocation, setCurrentLocation] = useState<Location | undefined>(undefined);
    const [currentWarehouse, setCurrentWarehouse] = useState<Warehouses | undefined>(undefined);
    const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

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
        // If no auth token, show session expired modal
        setShowSessionExpiredModal(true);
        return;
      }

      // If auth token exists, proceed with location check
      if (currentWarehouse) {
        router.push('/warehouse');
    } else if (currentLocation) {
        router.push('/dashboard');
    } else {
        router.push('/select-business');
    }
    } catch (error) {
      console.error("Error checking auth token:", error);
      // If there's an error checking the token, show session expired modal
      setShowSessionExpiredModal(true);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } catch {
      // logout redirects — if it somehow fails, force navigate
      window.location.href = "/login";
    }
  };

  const handleSessionExpiredConfirm = async () => {
    setShowSessionExpiredModal(false);
    await handleLogout();
  };

  return (
    <>
      {/* Full-screen logout overlay */}
      {loggingOut && (
        <div className="fixed inset-0 z-[9999] bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Logging out...
          </p>
        </div>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-full rounded-l-lg rounded-r-[0.7rem] px-3 gap-2 hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none">
            <div className="flex items-center gap-2">
              <div className="hidden lg:block text-right">
                <p className="text-sm font-medium leading-none">{fullName}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>

              {user?.avatar ? (
                <UserAvatar
                  src={user.avatar}
                  alt={fullName}
                  fallback={initials}
                  className="h-8 w-8"
                />
              ) : (
                <div className="h-8 w-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </div>
              )}
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" sideOffset={0} className="w-64 rounded-t-none rounded-b-xl p-1.5 border border-t-0">
          <div className="px-3 py-2.5 mb-1">
            <p className="text-sm font-semibold leading-none">{fullName}</p>
            <p className="text-xs text-muted-foreground mt-1">{user?.email}</p>
          </div>

          {user?.emailVerified &&
            user?.isBusinessRegistrationComplete &&
            user?.isLocationRegistrationComplete && (
              <>
                <DropdownMenuSeparator />

                <DropdownMenuItem asChild className="rounded-lg py-2 px-3 cursor-pointer">
                  <a onClick={checkCurrentLocation} className="flex items-center gap-3">
                    <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Dashboard</span>
                  </a>
                </DropdownMenuItem>

                {currentLocation &&
                  currentLocation.active && (
                    <>
                      <DropdownMenuItem asChild className="rounded-lg py-2 px-3 cursor-pointer">
                        <a href="/profile" className="flex items-center gap-3">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">My Profile</span>
                        </a>
                      </DropdownMenuItem>

                      <DropdownMenuItem asChild className="rounded-lg py-2 px-3 cursor-pointer">
                        <a href="/settings" className="flex items-center gap-3">
                          <Settings className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Account Settings</span>
                        </a>
                      </DropdownMenuItem>
                    </>
                  )}
              </>
            )}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-lg py-2 px-3 text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              <span className="text-sm">{loggingOut ? "Logging out..." : "Log Out"}</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Session Expired Modal */}
      <Dialog
        open={showSessionExpiredModal}
        onOpenChange={setShowSessionExpiredModal}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5 text-amber-500" />
              Session Expired
            </DialogTitle>
            <DialogDescription className="text-base">
              Currently your session has expired, please click the refresh
              button and log in again.
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
