import ResetPasswordEmailTemplate from "@/components/emails/reset-password";
import {Resend} from "resend";
import VerifyEmailTemplate from "@/components/emails/verify-email";

const resend = new Resend(process.env.RESEND_API_KEY);
export async function sendPasswordResetEmail(token: string) {
    console.log("Sending emai for password reset email", token);
    try {
        const {data,error} = await resend.emails.send({
            from: "Tech <onboarding@resend.dev>",
            to: "tech@settlo.co.tz",
            subject: "Reset Password Link",
            react: ResetPasswordEmailTemplate({token}),
        })
        if(error) {
            console.log("Error sending email", error);
            return Response.json({error}, {status: 500});
        }

        return Response.json({data}, {status: 200});
    } catch (error) {
        console.log("Error sending email", error);
        return Response.json({error}, {status: 500});

    }
}
export async function sendVerificationEmail(name:string, token: string, email: string) {
    try {
        const {data,error} = await resend.emails.send({
            from: "Tech <onboarding@resend.dev>",
            to: email,
            subject: "Complete Settlo Registration",
            react: VerifyEmailTemplate({token, name}),
        })
        if(error) {
            console.log("Error sending email", error);
            return Response.json({error}, {status: 500});
        }

        return Response.json({data}, {status: 200});
    } catch (error) {
        console.log("Error sending email", error);
        return Response.json({error}, {status: 500});

    }
}
