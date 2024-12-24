"use client";

import { Spinner } from "@nextui-org/spinner";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { logout, verifyToken } from "@/lib/actions/auth-actions";
import { FormResponse } from "@/types/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormError } from "@/components/widgets/form-error";
import { FormSuccess } from "@/components/widgets/form-success";
import { Spacer } from "@nextui-org/spacer";
import { getAuthToken, updateAuthToken } from "@/lib/auth-utils";

const VerificationPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const [verificationState, setVerificationState] = useState<{
        status: 'loading' | 'success' | 'error';
        message: string;
        attempted: boolean;
    }>({
        status: 'loading',
        message: '',
        attempted: false
    });

    useEffect(() => {

        logout();
        // If verification was already attempted, don't run again
        if (verificationState.attempted) {
            return;
        }

        // If no token, set error immediately
        if (!token) {
            setVerificationState({
                status: 'error',
                message: "Invalid token",
                attempted: true
            });
            return;
        }

        const verifyTokenAsync = async () => {
            try {
                const data: FormResponse = await verifyToken(token);

                console.log("verification data", data);

                if (data?.responseType === "error") {
                    setVerificationState({
                        status: 'error',
                        message: data?.message || "Verification failed",
                        attempted: true
                    });
                } else {
                    const authToken = await getAuthToken();

                    if (authToken !== null) {
                        authToken.emailVerified = new Date();
                        await updateAuthToken(authToken);
                    }

                    setVerificationState({
                        status: 'success',
                        message: data?.message || "Email verified successfully",
                        attempted: true
                    });

                    // Redirect after a short delay
                    setTimeout(() => {
                        router.push("/login");
                    }, 4000);
                }
            } catch (err) {
                console.error(err);
                setVerificationState({
                    status: 'error',
                    message: "An error occurred while verifying the token",
                    attempted: true
                });
            }
        };

        verifyTokenAsync();
    }, [token, router, verificationState.attempted]);

    return (
        <Card className="w-full mx-auto max-w-lg mt-10 lg:mt-0 md:mt-0">
            <CardHeader className="text-center pb-2">
                <CardTitle>Email verification</CardTitle>
                <CardDescription>
                    {verificationState.status === 'loading' && "Verifying your token..."}
                    {verificationState.status === 'success' && "Redirecting to login..."}
                    {verificationState.status === 'error' && "Verification failed"}
                </CardDescription>
            </CardHeader>
            <CardContent className="pb-4 px-8">
                {verificationState.status === 'loading' && (
                    <div className="flex items-center w-full justify-center min-h-[50px]">
                        <Spinner size="md" />
                    </div>
                )}
                <Spacer y={4} />
                {verificationState.status === 'error' && <FormError message={verificationState.message} />}
                {verificationState.status === 'success' && <FormSuccess message={verificationState.message} />}
            </CardContent>
        </Card>
    );
};

export default VerificationPage;
