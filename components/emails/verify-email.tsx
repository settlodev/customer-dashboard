import * as React from "react";
import {Button, Container, Head, Html} from "@react-email/components";
interface EmailProps {
    token: string|null|undefined;
    name: string;
}
export default function VerifyEmailTemplate({token, name}: EmailProps) {
    return (
       <Html>
        <Head>Verify Email</Head>
        <Container>
        <div>
            <p>
                Hi {name},<br/>
                Thank you for signing up with Settlo!<br/>
                To complete your registration, please verify your email address by clicking the button below:<br/>
                <Button href={`${process.env.NEXT_PUBLIC_LOCAL_URL}/email-verification?token=${token}`}>
                    Verify Email Address
                </Button>
            </p>
            <p>
                If the button doesn’t work, you can also copy and paste the following link into your browser:<br/>
                {process.env.NEXT_PUBLIC_LOCAL_URL}/email-verification?token={token}<br/>

                For security purposes, this link will expire in 24 hours. If you did not create an
                account with us, please disregard this email.<br/>

                If you have any questions, feel free to reach out to our support team at [support email].<br/>

                Thank you,<br/>
                The Settlo Team<br/>
                support@settlo.co.tz | +255759229777<br/>
            </p>
        </div>
        </Container>
       </Html>
       );
}
