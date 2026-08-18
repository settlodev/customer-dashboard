import * as React from "react";
import {Body, Button, Container, Head, Heading, Html, Preview, Section , Text} from "@react-email/components";
interface EmailProps {
    token: string;
}
export default function ResetPasswordEmailTemplate({token}: EmailProps) {
    return (
       <Html>
        <Head/>
        <Preview>Reset Password</Preview>
        <Body style={main}>
        <Container style={container}>
        <Section style={coverSection}>
            <Section style={upperSection}>
                <Heading style={h1}>Reset Password</Heading>
                <Text style={mainText}>Hello</Text>
                <Text style={mainText}>
                    We received a request to reset your password. If you did not make this request, you can ignore this email.
                </Text>
                <Text style={mainText}>
                    To reset your password, please click the button below:
                </Text>
                <Section style={buttonContainer}>
                    <Button
                        href={`${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`}
                        style={button}
                    >
                        Reset Password
                    </Button>
                </Section>
                <Text style={validityText}>
                    For security purposes, this link will expire in 24 hours.
                </Text>
            </Section>
        </Section>
        </Container>
        </Body>
       </Html>
       );
}

const buttonContainer = {
    padding: "27px 0 27px",
};

const button = {
    backgroundColor: "#00DBA2",
    borderRadius: "3px",
    fontWeight: "600",
    color: "#fff",
    fontSize: "15px",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "block",
    padding: "11px 23px",
};

const main = {
    backgroundColor: "#fff",
    color: "#00DBA2",
    borderRadius: "3px",
};

const container = {
    padding: "20px",
    margin: "0 auto",
    backgroundColor: "#eee",
    borderRadius: "3px",
};

const h1 = {
    color: "#00DBA2",
    fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
    fontSize: "20px",
    fontWeight: "bold",
    marginBottom: "15px",
};

const text = {
    color: "#444",
    fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
    fontSize: "14px",
    margin: "24px 0",
};

const coverSection = { backgroundColor: "#FFFFFF" };

const upperSection = { padding: "25px 35px" };


const validityText = {
    ...text,
    margin: "0px",
    textAlign: "center" as const,
    fontSize: "12px",
    fontWeight: "bold",
};



const mainText = { ...text, marginBottom: "14px" };

