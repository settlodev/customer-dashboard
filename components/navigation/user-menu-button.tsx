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
import { useEffect, useState, useCallback, useRef } from "react";
import { Location } from "@/types/location/type";
import { getAuthToken } from "@/lib/auth-utils";
import { getCurrentWarehouse } from "@/lib/actions/warehouse/current-warehouse-action";
import { Warehouses } from "@/types/warehouse/warehouse/type";
import { logout } from "@/lib/actions/auth-actions";

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

  const [currentLocation, setCurrentLocation] = useState<Location | undefined>(
    undefined,
  );
  const [currentWarehouse, setCurrentWarehouse] = useState<
    Warehouses | undefined
  >(undefined);
  const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fetch location and warehouse data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [location, warehouse] = await Promise.all([
          getCurrentLocation(),
          getCurrentWarehouse(),
        ]);

        if (isMountedRef.current) {
          setCurrentLocation(location as Location | undefined);
          setCurrentWarehouse(warehouse as Warehouses | undefined);
        }
      } catch (err) {
        console.error("Failed to fetch location/warehouse:", err);
        if (isMountedRef.current) {
          setError("Failed to load workspace data");
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    fetchData();
  }, []);

  const handleLogout = useCallback(async () => {
    // Prevent multiple logout attempts
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);
      await logout();

      // Only navigate if component is still mounted
      if (isMountedRef.current) {
        // Use router.push for client-side navigation with full refresh
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("Logout error:", error);
      if (isMountedRef.current) {
        setIsLoggingOut(false);
        // Optionally show error toast here
      }
    }
  }, [isLoggingOut]);

  const handleDashboardNavigation = useCallback(async () => {
    // Don't navigate if already logging out
    if (isLoggingOut) return;

    try {
      // Verify auth token exists
      const authToken = await getAuthToken();
      if (!authToken) {
        if (isMountedRef.current) {
          setShowSessionExpiredModal(true);
        }
        return;
      }

      // Navigate based on available data
      if (currentWarehouse) {
        router.push("/warehouse");
      } else if (currentLocation) {
        router.push("/dashboard");
      } else {
        router.push("/select-business");
      }
    } catch (error) {
      console.error("Error checking auth token:", error);
      if (isMountedRef.current) {
        setShowSessionExpiredModal(true);
      }
    }
  }, [currentLocation, currentWarehouse, isLoggingOut, router]);

  const handleSessionExpiredConfirm = useCallback(async () => {
    if (isMountedRef.current) {
      setShowSessionExpiredModal(false);
    }
    await handleLogout();
  }, [handleLogout]);

  // Don't render dropdown if user is not provided
  if (!user) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-full rounded-l-lg rounded-r-[0.7rem] px-3 gap-2 hover:bg-gray-50 dark:hover:bg-gray-800"
            disabled={isLoggingOut || isLoading}
          >
            <div className="flex items-center gap-2">
              <div className="hidden lg:block text-right">
                <p className="text-sm font-medium leading-none">
                  {fullName || "User"}
                </p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <UserAvatar
                src={user?.avatar}
                alt={fullName || "User avatar"}
                fallback={initials || "U"}
                className="h-8 w-8"
              />
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          sideOffset={0}
          className="w-64 rounded-t-none rounded-b-xl p-1.5 border border-t-0"
        >
          <div className="px-3 py-2.5 mb-1">
            <p className="text-sm font-semibold leading-none">
              {fullName || "User"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{user?.email}</p>
          </div>

          <DropdownMenuSeparator />

          {/* Dashboard Navigation - Fixed syntax */}
          <DropdownMenuItem
            onClick={handleDashboardNavigation}
            className="rounded-lg py-2 px-3 cursor-pointer"
            disabled={isLoggingOut || isLoading}
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Dashboard</span>
            </div>
          </DropdownMenuItem>

          {/* Conditional menu items based on subscription status */}
          {currentLocation &&
            currentLocation.subscriptionStatus &&
            currentLocation.subscriptionStatus !== "EXPIRED" && (
              <>
                <DropdownMenuItem
                  onClick={() => router.push("/profile")}
                  className="rounded-lg py-2 px-3 cursor-pointer"
                  disabled={isLoggingOut}
                >
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">My Profile</span>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => router.push("/settings")}
                  className="rounded-lg py-2 px-3 cursor-pointer"
                  disabled={isLoggingOut}
                >
                  <div className="flex items-center gap-3">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Account Settings</span>
                  </div>
                </DropdownMenuItem>
              </>
            )}

          <DropdownMenuSeparator />

          {/* Logout Button */}
          <DropdownMenuItem
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="rounded-lg py-2 px-3 text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              {isLoggingOut ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              <span className="text-sm">
                {isLoggingOut ? "Logging out..." : "Log Out"}
              </span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Session Expired Modal */}
      <Dialog
        open={showSessionExpiredModal}
        onOpenChange={(open) => {
          if (!open && isMountedRef.current) {
            setShowSessionExpiredModal(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5 text-amber-500" />
              Session Expired
            </DialogTitle>
            <DialogDescription className="text-base">
              Your session has expired. Please click the refresh button below to
              log in again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button
              onClick={handleSessionExpiredConfirm}
              className="w-full sm:w-auto"
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging out...
                </>
              ) : (
                "Refresh"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Optional: Error Toast/Alert */}
      {error && (
        <div className="fixed bottom-4 right-4 z-50">
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
            role="alert"
          >
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
            <button
              onClick={() => setError(null)}
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
            >
              <span className="sr-only">Dismiss</span>
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default UserDropdown;
