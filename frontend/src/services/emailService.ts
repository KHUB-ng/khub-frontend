import { auth } from "@/api";

export interface EmailOTP {
  email: string;
  otp_code: string;
  purpose: "verification" | "password_reset" | "login" | "2fa";
}

/**
 * Transactional email against the REST backend.
 *
 * The backend sends all transactional email itself (Brevo SMTP) — there is
 * no client-side send path and no OTP table. `sendOTP` / `resendOTP` ask the
 * backend to (re)send its verification mail; `verifyOTP` cannot be fulfilled
 * because verification is a token link (`GET /api/auth/verify/{token}`), not
 * a code, so it resolves `false` and the OTP screen must be rewired to that
 * flow (see report — `EmailVerification.tsx` is outside this swap's files).
 */
class EmailService {
  private static instance: EmailService;

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async sendOTP(email: string, _purpose: EmailOTP["purpose"]): Promise<void> {
    await auth.resendVerification(email);
  }

  async verifyOTP(_email: string, _otp: string, _purpose: EmailOTP["purpose"]): Promise<boolean> {
    return false;
  }

  async resendOTP(email: string, _purpose: EmailOTP["purpose"]): Promise<void> {
    await auth.resendVerification(email);
  }
}

export const emailService = EmailService.getInstance();
