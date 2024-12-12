"use client"

import { useSession, signOut } from "next-auth/react";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Settings, User, Briefcase, LogOut, ChevronDown } from "lucide-react";
import UserAvatar from "@/components/widgets/user-avatar";

const UserDropdown = () => {
    const { data: session } = useSession();
    const user = useCurrentUser();

    if (!user) {
        signOut();
        return null;
    }

    const fullName = `${session?.user?.firstName || ''} ${session?.user?.lastName || ''}`.trim();
    const initials = fullName.split(' ').map(n => n[0]).join('');

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-12 px-2 gap-2">
                    <div className="flex items-center gap-2">
                        <div className="hidden lg:block text-right">
                            <p className="text-sm font-medium leading-none">{fullName}</p>
                            <p className="text-xs text-muted-foreground">
                                {session?.user?.email}
                            </p>
                        </div>

                        <UserAvatar
                            src={session?.user?.avatar}
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
                    <a href="/profile" className="flex items-center cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>My Profile</span>
                    </a>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                    <a href="/business" className="flex items-center cursor-pointer">
                        <Briefcase className="mr-2 h-4 w-4" />
                        <span>My Businesses</span>
                    </a>
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
