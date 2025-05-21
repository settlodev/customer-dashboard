import * as React from "react";
import {Body, Container, Head, Heading, Html, Preview, Section , Text} from "@react-email/components";
import { Location } from "@/types/location/type";

export default function DataRemovalEmailTemplate({location}: {location: Location}) {
    return (
       <Html>
        <Head/>
        <Preview>Request For Data Removal</Preview>
        <Body style={main}>
        <Container style={container}>
        <Section style={coverSection}>
            <Section style={upperSection}>
                <Heading style={h1}>Request For Data Removal</Heading>
                <Text style={mainText}>Hello</Text>
                <Text style={mainText}>
                    Anorld has requested to clear the data for {location.name} from the Settlo platform.
                </Text>
                <Text style={mainText}>
                The details for this request are as follows:
                location name: {location.name}
                location email: {location.email}
                location phone: {location.phone}
                location address: {location.address}
                </Text>
                
                <Text style={validityText}>
                ⏳ For security purposes, this link will expire in 24 hours. Please act quickly!
                </Text>
            </Section>
        </Section>
        </Container>
        </Body>
       </Html>
       );
}






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

