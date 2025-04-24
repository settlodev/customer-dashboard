import ResetPasswordEmailTemplate from "@/components/emails/reset-password";
import {Resend} from "resend";
import VerifyEmailTemplate from "@/components/emails/verify-email";
import InviteStaffEmailTemplate from "@/components/emails/invite-staff";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(token: string, email: string) {
    try {
        const {data,error} = await resend.emails.send({
            from:"Settlo Technologies <no-reply@settlo.co.tz>",
            to: email,
            subject: "Settlo Technologies Password Reset",
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
            from: "Settlo Technologies <onboarding@settlo.co.tz>",
            to: email,
            subject: "Settlo Technologies Email verification",
            react: VerifyEmailTemplate({token, name}),
        })
        if(error) {
            return Response.json({error}, {status: 500});
        }

        return Response.json({data}, {status: 200});
    } catch (error) {
        return Response.json({error}, {status: 500});

    }
}

export async function inviteStaffToBusiness(token: string, email: string) {
    try {
        const {data,error} = await resend.emails.send({
            from:"Settlo Technologies <no-reply@settlo.co.tz>",
            to: email,
            subject: "Settlo Technologies Invitation",
            react: InviteStaffEmailTemplate({token}),
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
