import * as React from "react";
import {Button, Container, Head, Html} from "@react-email/components";
interface EmailProps {
    token: string;
}
export default function ResetPasswordEmailTemplate({token}: EmailProps) {
    return (
       <Html>
        <Head>Reset Password</Head>
        <Container>
        <div>
            <p>
                You requested a password reset. If you did not request a
                password reset, please ignore this email.
            </p>
            <p>
                If you did request a password reset, please click the button
                below to reset your password:
            </p>

            <Button href={`${process.env.NEXT_PUBLIC_APP_URL}/update-password?token=${token}`}>
                Reset Password Link
            </Button>
        </div>
        </Container>
       </Html>
       );
}
