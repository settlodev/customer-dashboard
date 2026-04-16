"use client";

import React, { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { oauthLogin } from "@/lib/actions/auth-actions";
import { FormResponse } from "@/types/types";
import { DEFAULT_LOGIN_REDIRECT_URL } from "@/routes";

interface SocialAuthButtonsProps {
  mode: "login" | "register";
  onError?: (message: string) => void;
  onNeedsVerification?: () => void;
  disabled?: boolean;
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
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

  const handleGoogleSuccess = (response: CredentialResponse) => {
    if (response.credential) {
      handleOAuthResponse("GOOGLE", response.credential);
    } else {
      onError?.("Google sign-in failed. No credential received.");
    }
  };

  const handleAppleSignIn = async () => {
    try {
      // Apple Sign In uses the Apple JS SDK which must be loaded externally.
      // The AppleID.auth.signIn() call returns an authorization object with
      // an id_token in authorization.id_token.
      const AppleID = (window as any).AppleID;
      if (!AppleID) {
        onError?.("Apple Sign-In is not available.");
        return;
      }

      const response = await AppleID.auth.signIn();
      if (response?.authorization?.id_token) {
        handleOAuthResponse("APPLE", response.authorization.id_token);
      } else {
        onError?.("Apple sign-in failed. No token received.");
      }
    } catch {
      // User cancelled or Apple JS SDK error
      onError?.("Apple sign-in was cancelled or failed. Please try again.");
    }
  };

  const isLoading = isPending || disabled;
  const label = mode === "login" ? "Sign in" : "Sign up";
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const appleClientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;

  return (
    <div className="space-y-3">
      {/* Google Sign-In — uses the One Tap / button credential flow which
          returns a JWT id_token (not an access_token). */}
      {googleClientId && (activeProvider === "GOOGLE" && isPending ? (
        <div className="w-full flex items-center justify-center py-2">
          <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
        </div>
      ) : (
        <div className="flex justify-center [&>div]:w-full">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() =>
              onError?.("Google sign-in was cancelled or failed. Please try again.")
            }
            text={mode === "login" ? "signin_with" : "signup_with"}
            shape="rectangular"
            width="400"
            theme="outline"
            size="large"
          />
        </div>
      ))}

      {/* Apple Sign-In — only shown if configured */}
      {appleClientId && (
        <button
          type="button"
          onClick={handleAppleSignIn}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 h-10 border border-gray-300 rounded-md bg-white text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {activeProvider === "APPLE" && isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <AppleIcon className="w-4 h-4" />
              <span>{label} with Apple</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
