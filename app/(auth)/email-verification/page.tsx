"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { verifyEmailCode, verifyEmailToken, resendVerificationCode } from "@/lib/actions/auth-actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormError } from "@/components/widgets/form-error";
import { FormSuccess } from "@/components/widgets/form-success";
import { motion } from "framer-motion";
import {
  Mail,
  KeyRound,
  Loader2,
  ArrowRight,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const VerificationPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [codeSent, setCodeSent] = useState<boolean>(false);
  const [isResending, setIsResending] = useState(false);
  const [tokenHandled, setTokenHandled] = useState(false);

  // Handle ?token= from email verification links
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token || tokenHandled) return;
    setTokenHandled(true);

    startTransition(async () => {
      try {
        const data = await verifyEmailToken(token);

        if (data.responseType === "error") {
          setError(data.message);
          return;
        }

        setSuccess(data.message);
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } catch (err: any) {
        setError(err?.message || "Verification failed. Please try again.");
      }
    });
  }, [token, tokenHandled, router]);

  const handleVerify = useCallback(() => {
    if (verificationCode.length !== 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    setError("");
    setSuccess("");

    startTransition(async () => {
      try {
        const data = await verifyEmailCode(verificationCode);

        if (data.responseType === "error") {
          setError(data.message);
          return;
        }

        if (data.responseType === "success") {
          setSuccess(data.message);

          if (data.data && (data.data as any).requiresLogin) {
            setTimeout(() => {
              router.push("/login");
            }, 2000);
            return;
          }

          setTimeout(() => {
            router.push("/business-registration");
          }, 1500);
        }
      } catch (err: any) {
        setError(err?.message || "Verification failed. Please try again.");
      }
    });
  }, [verificationCode, router]);

  const handleResend = useCallback(async () => {
    setError("");
    setCodeSent(false);
    setIsResending(true);

    try {
      const resp = await resendVerificationCode();

      if (resp.responseType === "error") {
        setError(resp.message);
      } else {
        setCodeSent(true);
      }
    } catch {
      setError("Failed to resend code. Please try again.");
    } finally {
      setIsResending(false);
    }
  }, []);

  // Show loading state while processing token from email link
  if (token && !error && !success) {
    return (
      <div className="flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
            <CardContent className="py-16 flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-gray-600">Verifying your email...</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4 pt-12">
            <motion.div
              className="flex justify-center mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 15,
                delay: 0.2,
              }}
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-primary to-orange-600 p-1">
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                  <KeyRound className="w-10 h-10 text-primary" />
                </div>
              </div>
            </motion.div>

            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Verify Your Email
            </CardTitle>

            <CardDescription className="mt-2 text-gray-600">
              <span className="flex items-center justify-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                Enter the 6-digit code sent to your email
              </span>
            </CardDescription>
          </CardHeader>

          <CardContent className="pb-12 px-8 pt-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-6"
            >
              {error && <FormError message={error} />}
              {success && <FormSuccess message={success} />}

              <div className="flex flex-col items-center space-y-6">
                <InputOTP
                  maxLength={6}
                  value={verificationCode}
                  onChange={(value) => setVerificationCode(value)}
                  disabled={isPending}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>

                <Button
                  onClick={handleVerify}
                  disabled={isPending || verificationCode.length !== 6}
                  className="w-full h-12 bg-gradient-to-r from-primary to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-primary/25"
                >
                  {isPending ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Verifying...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Verify Email
                      <ArrowRight className="w-5 h-5" />
                    </span>
                  )}
                </Button>
              </div>

              <div className="text-center space-y-2">
                {codeSent ? (
                  <FormSuccess message="Code sent! Check your inbox." />
                ) : (
                  <p className="text-sm text-gray-500">
                    Didn&#39;t receive the code?{" "}
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={isResending}
                      className="text-primary hover:underline font-medium disabled:opacity-50"
                    >
                      {isResending ? "Sending..." : "Resend code"}
                    </button>
                  </p>
                )}
              </div>
            </motion.div>
          </CardContent>
        </Card>

        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-xs text-gray-500 flex items-center justify-center gap-2">
            <Shield className="w-3 h-3" />
            Verification codes expire after 15 minutes for security
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default VerificationPage;
