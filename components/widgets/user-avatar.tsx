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
            "rounded-xl border-2 border-background bg-background",
            "ring-2 ring-offset-2 ring-offset-background ring-primary/10",
            "transition-all duration-200 ease-in-out hover:scale-105",
            className
        )}>
            <AvatarImage
                src={src || "/images/logo.png"}
                alt={alt || "Settlo"}
                className="rounded-xl object-cover"
            />
            <AvatarFallback className="rounded-xl font-medium">
                {fallback}
            </AvatarFallback>
        </Avatar>
    );
};

export default UserAvatar;
