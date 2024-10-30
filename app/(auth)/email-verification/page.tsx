"use client"
import {useSearchParams} from "next/navigation";
import {useEffect, useRef} from "react";
import {verifyEmailToken} from "@/lib/actions/auth-actions";
import {Loader2Icon} from "lucide-react";

function VerificationPage() {
    const params = useSearchParams();
    const initialized = useRef(false);

    useEffect(()=>{
        async function verifyToken() {
            if (!initialized.current) {
                initialized.current = true

                const token = params.get('token');
                console.log("token is:", token);
                if (token) {
                    const response = await verifyEmailToken(token);
                    console.log("my response:", response);
                    if(response){
                        window.location.href = "/business-registration"
                    }else{
                        window.location.href = "/user-verification?error=1"
                    }
                }
            }
        }

        verifyToken();
    },[params]);

    return <p className="py-10 flex items-center justify-center">
        <Loader2Icon className="animate-spin" />
    </p>
}

export default VerificationPage;
