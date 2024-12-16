"use client";

import { Spinner } from "@nextui-org/spinner";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { verifyToken } from "@/lib/actions/auth-actions";
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
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState<string>("");
    const verificationAttempted = useRef(false);
    const isMounted = useRef(false);

    useEffect(() => {
        if (isMounted.current) {
            return;
        }
        isMounted.current = true;

        const verifyTokenAsync = async () => {
            if (verificationAttempted.current || !token) {
                setStatus('error');
                setMessage(!token ? "Invalid token" : "Verification already attempted");
                return;
            }

            verificationAttempted.current = true;

            try {
                const data: FormResponse = await verifyToken(token);

                // Only proceed if the component is still mounted
                if (isMounted.current) {
                    if (data?.responseType === "error") {
                        setStatus('error');
                        setMessage(data?.message || "Verification failed");
                    } else {
                        setStatus('success');
                        setMessage(data?.message || "Email verified successfully");

                        const authToken = await getAuthToken();

                        if (authToken !== null) {
                            authToken.emailVerified = new Date();
                            await updateAuthToken(authToken);
                        }

                        new Promise(resolve =>
                            setTimeout(resolve, 1500)
                        ).then(() => {
                            if (isMounted.current) {
                                router.push("/login");
                            }
                        });
                    }
                }
            } catch (err) {
                console.error(err);
                if (isMounted.current) {
                    setStatus('error');
                    setMessage("An error occurred while verifying the token");
                }
            }
        };

        verifyTokenAsync();

        return () => {
            isMounted.current = false;
        };
    }, [token, router]);

    return (
        <Card className="w-full mx-auto max-w-lg mt-10 lg:mt-0 md:mt-0">
            <CardHeader className="text-center pb-2">
                <CardTitle>Email verification</CardTitle>
                <CardDescription>
                    {status === 'loading' && "Verifying your token..."}
                    {status === 'success' && "Redirecting to login..."}
                    {status === 'error' && "Verification failed"}
                </CardDescription>
            </CardHeader>
            <CardContent className="pb-4 px-8">
                {status === 'loading' && (
                    <div className="flex items-center w-full justify-center min-h-[50px]">
                        <Spinner size="md" />
                    </div>
                )}
                <Spacer y={4} />
                {status === 'error' && <FormError message={message} />}
                {status === 'success' && <FormSuccess message={message} />}
            </CardContent>
        </Card>
    );
};

export default VerificationPage;
