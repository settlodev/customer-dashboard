import {useSession} from "next-auth/react";
import {ExtendedUser} from "@/types/types";

export const useCurrentUser = () => {
    const session = useSession();

    return session.data?.user as ExtendedUser;
};
