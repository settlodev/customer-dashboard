"use client";

import React, { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import { oauthLogin } from "@/lib/actions/auth-actions";
import { FormResponse } from "@/types/types";
import { DEFAULT_LOGIN_REDIRECT_URL } from "@/routes";

interface SocialAuthButtonsProps {
  mode: "login" | "register";
  onError?: (message: string) => void;
  onNeedsVerification?: () => void;
  disabled?: boolean;
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function SocialAuthButtons({
  mode,
  onError,
  onNeedsVerification,
  disabled = false,
}: SocialAuthButtonsProps) {
  const [isPending, startTransition] = useTransition();
  const [activeProvider, setActiveProvider] = useState<string | null>(null);

  const handleOAuthResponse = (provider: "GOOGLE" | "APPLE", idToken: string) => {
    setActiveProvider(provider);
    startTransition(async () => {
      try {
        const data: FormResponse = await oauthLogin(provider, idToken);

        if (data.responseType === "needs_verification") {
          onNeedsVerification?.();
          window.location.href = "/user-verification";
          return;
        }

        if (data.responseType === "error") {
          onError?.(data.message);
          return;
        }

        if (data.responseType === "success") {
          window.location.href = DEFAULT_LOGIN_REDIRECT_URL;
        }
      } catch (err: any) {
        onError?.(err.message || "Social sign-in failed. Please try again.");
      } finally {
        setActiveProvider(null);
      }
    });
  };

  const googleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      handleOAuthResponse("GOOGLE", tokenResponse.access_token);
    },
    onError: () => {
      onError?.("Google sign-in was cancelled or failed. Please try again.");
    },
    flow: "implicit",
  });

  const isLoading = isPending || disabled;
  const label = mode === "login" ? "Sign in" : "Sign up";

  return (
    <button
      type="button"
      onClick={() => googleLogin()}
      disabled={isLoading}
      className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {activeProvider === "GOOGLE" && isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          <GoogleIcon className="w-4 h-4" />
          <span>{label} with Google</span>
        </>
      )}
    </button>
  );
}
