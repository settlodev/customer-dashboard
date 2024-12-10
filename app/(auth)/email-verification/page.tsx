"use client"
import {useSearchParams} from "next/navigation";
import {useEffect, useRef} from "react";
import {Loader2Icon} from "lucide-react";
import {verifyEmailToken, autoLoginUser} from "@/lib/actions/auth-actions";

function VerificationPage() {
    const params = useSearchParams();
    const initialized = useRef(false);

    useEffect(() => {
        async function verifyToken() {
            if (!initialized.current) {
                initialized.current = true;

                const token = params.get('token');

                if (token) {
                    console.log("Token is present:", token);

                    try {
                        const verificationSuccess = await verifyEmailToken(token);
                        console.log("Verification success :", verificationSuccess);

                        if (verificationSuccess) {
                            console.log("Email verified, attempting auto-login... ");
                            const autoLoginMessage = await autoLoginUser();
                            console.log("Auto-login message:", autoLoginMessage );

                            if (autoLoginMessage === "Successful activated token") {
                                window.location.href = "/dashboard"; // Redirect to the dashboard
                            } else {
                                window.location.href = "/login"; // Redirect to login if auto-login fails
                            }
                        } else {
                            window.location.href = "/user-verification?error=1"; // Redirect with error
                        }
                    } catch (error) {
                        console.error("Verification error:", error);
                        window.location.href = "/user-verification?error=1"; // Redirect with error
                    }
                }
            }
        }

        verifyToken().then(() => {
            console.log("Token verified.");
        });
    }, [params]);

    return (
        <p className="py-10 flex items-center justify-center">
            <Loader2Icon className="animate-spin" />
        </p>
    );
}

export default VerificationPage;
