import {
    Body,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Preview,
    Section,
    Text,
    Button,
} from "@react-email/components";
import * as React from "react";

interface VerifyEmailProps {
    name: string;
    token: string;
}

export default function VerifyEmailTemplate({ name, token }: VerifyEmailProps) {
    return (
        <Html>
            <Head />
            <Preview>Settlo: Email Verification</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Section style={coverSection}>
                        <Section style={upperSection}>
                            <Heading style={h1}>Verify your email address</Heading>
                            <Text style={mainText}>Hello {name},</Text>
                            <Text style={mainText}>
                                Thank you for signing up with Settlo!
                                <Text style={mainText}>
                                    To complete your registration, please verify your email address by clicking the button below:
                                </Text>
                            </Text>
                            <Section style={verificationSection}>
                                <Section style={buttonContainer}>
                                    <Button
                                        href={`${process.env.SERVICE_URL}/email-verification?token=${token}`}
                                        style={button}
                                    >
                                        Click here to verify email
                                    </Button>
                                </Section>
                                <Text style={validityText}>
                                    For security purposes, this link will expire in 24 hours. If you did not create an
                                    account with us, please disregard this email.
                                </Text>
                            </Section>
                        </Section>
                        <Hr />
                        <Section style={lowerSection}>
                            <Text style={cautionText}>
                                If you have any questions, feel free to reach out to our support team at support@settlo.co.tz
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
    backgroundColor: "#0569f2",
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
    color: "#0569f2",
    borderRadius: "3px",
};

const container = {
    padding: "20px",
    margin: "0 auto",
    backgroundColor: "#eee",
    borderRadius: "3px",
};

const h1 = {
    color: "#0569f2",
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

const lowerSection = { padding: "25px 35px" };

const validityText = {
    ...text,
    margin: "0px",
    textAlign: "center" as const,
    fontSize: "12px",
    fontWeight: "bold",
};

const verificationSection = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
};

const mainText = { ...text, marginBottom: "14px" };

const cautionText = { ...text, margin: "0px", fontSize: "12px" };
