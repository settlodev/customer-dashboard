"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { logout, verifyToken } from "@/lib/actions/auth-actions";
import { FormResponse } from "@/types/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormError } from "@/components/widgets/form-error";
import { FormSuccess } from "@/components/widgets/form-success";
import { getAuthToken, updateAuthToken } from "@/lib/auth-utils";
import { motion } from "framer-motion";
import {
  Mail,
  CheckCircle2,
  XCircle,
  Loader2,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const VerificationPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [verificationState, setVerificationState] = useState<{
    status: "loading" | "success" | "error";
    message: string;
    attempted: boolean;
  }>({
    status: "loading",
    message: "",
    attempted: false,
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
        status: "error",
        message: "Invalid or missing verification token",
        attempted: true,
      });
      return;
    }

    const verifyTokenAsync = async () => {
      try {
        const data: FormResponse = await verifyToken(token);

        if (data?.responseType === "error") {
          setVerificationState({
            status: "error",
            message: data?.message || "Verification failed",
            attempted: true,
          });
        } else {
          const authToken = await getAuthToken();

          if (authToken !== null) {
            authToken.emailVerified = new Date();
            await updateAuthToken(authToken);
          }

          setVerificationState({
            status: "success",
            message: data?.message || "Email verified successfully",
            attempted: true,
          });

          // Redirect after a short delay
          setTimeout(() => {
            router.push("/login");
          }, 3000);
        }
      } catch (err) {
        console.error(err);
        setVerificationState({
          status: "error",
          message:
            "An error occurred while verifying your email. Please try again.",
          attempted: true,
        });
      }
    };

    verifyTokenAsync();
  }, [token, router, verificationState.attempted]);

  const getStatusIcon = () => {
    switch (verificationState.status) {
      case "loading":
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 p-1"
          >
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-emerald-600" />
            </div>
          </motion.div>
        );
      case "success":
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-20 h-20 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 p-1"
          >
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
          </motion.div>
        );
      case "error":
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-20 h-20 rounded-full bg-gradient-to-r from-red-500 to-rose-600 p-1"
          >
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-0 pt-12">
            <motion.div
              className="flex justify-center mb-6"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              {getStatusIcon()}
            </motion.div>

            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {verificationState.status === "loading" && "Verifying Your Email"}
              {verificationState.status === "success" && "Email Verified!"}
              {verificationState.status === "error" && "Verification Failed"}
            </CardTitle>

            <CardDescription className="mt-2 text-gray-600">
              {verificationState.status === "loading" && (
                <span className="flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
                  Please wait while we verify your email address...
                </span>
              )}
              {verificationState.status === "success" && (
                <span className="flex items-center justify-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Your account is now active
                </span>
              )}
              {verificationState.status === "error" &&
                "We couldn't verify your email"}
            </CardDescription>
          </CardHeader>

          <CardContent className="pb-12 px-8 pt-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {verificationState.status === "loading" && (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="space-y-2">
                      <motion.div
                        className="h-2 w-48 bg-gray-200 rounded-full overflow-hidden"
                        initial={{ opacity: 0.5 }}
                        animate={{ opacity: 1 }}
                        transition={{
                          repeat: Infinity,
                          duration: 1.5,
                          ease: "easeInOut",
                        }}
                      >
                        <motion.div
                          className="h-full bg-gradient-to-r from-emerald-500 to-orange-600"
                          initial={{ x: "-100%" }}
                          animate={{ x: "100%" }}
                          transition={{
                            repeat: Infinity,
                            duration: 1.5,
                            ease: "easeInOut",
                          }}
                        />
                      </motion.div>
                      <p className="text-center text-sm text-gray-500">
                        Processing...
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {verificationState.status === "error" && (
                <div className="space-y-6">
                  <FormError message={verificationState.message} />

                  <div className="space-y-3">
                    <Button
                      onClick={() => router.push("/register")}
                      className="w-full bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-medium py-6 rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-red-500/25"
                    >
                      <span className="flex items-center gap-2">
                        Back to Registration
                        <ArrowRight className="w-5 h-5" />
                      </span>
                    </Button>

                    <p className="text-center text-sm text-gray-600">
                      Or contact support if you continue to experience issues
                    </p>
                  </div>
                </div>
              )}

              {verificationState.status === "success" && (
                <div className="space-y-6">
                  <FormSuccess message={verificationState.message} />

                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span>You can now log in with your credentials</span>
                    </div>

                    <motion.div
                      className="flex justify-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1 }}
                    >
                      <div className="text-center space-y-2">
                        <p className="text-sm text-gray-500">
                          Redirecting to login in . . .
                        </p>
                      </div>
                    </motion.div>
                  </div>
                </div>
              )}
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default VerificationPage;
