// Global typings for Google reCAPTCHA Enterprise.
// The script is injected from `app/layout.tsx` and exposes a single
// global object `grecaptcha.enterprise` once it has finished loading.

declare global {
  interface GrecaptchaEnterprise {
    ready(callback: () => void): void;
    execute(siteKey: string, options: { action: string }): Promise<string>;
  }

  interface Grecaptcha {
    enterprise: GrecaptchaEnterprise;
  }

  interface Window {
    grecaptcha?: Grecaptcha;
  }
}

export {};
