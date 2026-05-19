import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
    className?: string;
    src?: string | null;
    alt?: string;
    fallback: string;
}

const UserAvatar = ({ className, src, alt, fallback }: UserAvatarProps) => {
    return (
        <Avatar className={cn(
            "rounded-lg bg-gray-100 dark:bg-gray-700",
            className
        )}>
            <AvatarImage
                src={src || "/images/logo_badge.png"}
                alt={alt || "Settlo"}
                className="rounded-lg object-cover"
            />
            <AvatarFallback className="rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                {fallback}
            </AvatarFallback>
        </Avatar>
    );
};

export default UserAvatar;
