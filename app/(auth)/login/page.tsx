import LoginForm from "@/app/(auth)/login/login_form";
import {getAuthenticatedUser} from "@/lib/actions/auth/login";

export default async function LoginPage() {
    const userData = await getAuthenticatedUser();
    return <LoginForm userData={userData}/>
}
