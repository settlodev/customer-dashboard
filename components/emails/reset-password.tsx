interface EmailProps {
    token: string;
}
export default function ResetPasswordEmailTemplate() {
    return (
        <div>
            <p>
                You requested a password reset. If you did not request a
                password reset, please ignore this email.
            </p>
            <p>
                If you did request a password reset, please click the button
                below to reset your password:
            </p>
            <a
                // href={`${process.env.NEXT_PUBLIC_APP_URL}/reset-password/${token}`}
            >
                Reset Password
            </a>
        </div>
    );
}
