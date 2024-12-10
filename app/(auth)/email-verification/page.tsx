"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2Icon } from "lucide-react";
import { verifyEmailToken, autoLoginUser } from "@/lib/actions/auth-actions";

const VerificationPage = () => {
    const [isValidating, setIsValidating] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const params = useSearchParams();

    useEffect(() => {
        const verifyToken = async () => {
            setError(null); 
            const token = params.get("token");

            if (!token) {
                handleError("Token is missing or invalid.");
                return;
            }

            try {
                console.log("Token is present:", token);
                const verificationSuccess = await verifyEmailToken(token);

                if (verificationSuccess) {
                    await handleAutoLogin();
                } else {
                    handleError("Verification failed. Please try again.");
                }
            } catch (err) {
                console.error("Verification error:", err);
                handleError("An error occurred during verification. Please try again.");
            }
        };

        verifyToken();
    }, [params]);

    const handleError = (message: string) => {
        setError(message);
        setIsValidating(false);
    };

    const handleAutoLogin = async () => {
        console.log("Email verified, attempting auto-login...");
        const autoLoginMessage = await autoLoginUser();
        console.log("Auto-login message:", autoLoginMessage);

        window.location.href = autoLoginMessage === "Successful activated token" ? "/dashboard" : "/login";
        setIsValidating(false);
    };

    if (isValidating) {
        return (
            <div className="py-10 flex items-center justify-center">
                <Loader2Icon className="animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-10 flex flex-col items-center justify-center text-center">
                <h2 className="text-xl font-bold text-red-600">Verification Error</h2>
                <p className="mt-2 text-gray-700">{error}</p>
            </div>
        );
    }

    return null; 
};

export default VerificationPage;