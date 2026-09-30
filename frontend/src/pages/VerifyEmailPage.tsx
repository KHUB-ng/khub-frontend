import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { auth, ApiError } from "@/api";

/**
 * GET /api/auth/verify/{token} — landing for the "verify your email" link.
 * The token arrives as a path segment or a ?token= query parameter, because
 * the exact link format the backend mails is configurable.
 */
export default function VerifyEmailPage() {
  const params = useParams<{ token: string }>();
  const [search] = useSearchParams();
  const token = params.token ?? search.get("token") ?? "";

  const [state, setState] = useState<"working" | "ok" | "invalid" | "error">("working");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [resent, setResent] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setState("invalid");
      return;
    }
    auth
      .verifyEmail(token)
      .then(() => {
        if (!cancelled) setState("ok");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) setState("invalid");
        else {
          setState("error");
          setMessage(err instanceof ApiError ? err.description : "Request failed");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="py-16">
      <div className="container-custom max-w-md">
        <div className="card p-8 text-center">
          <h1 className="text-2xl font-bold">Email verification</h1>

          {state === "working" && <p className="mt-4 text-sm text-gray-600">Verifying…</p>}

          {state === "ok" && (
            <>
              <p className="mt-4 text-sm text-gray-600">
                Your email is verified. You can sign in now.
              </p>
              <Link to="/login" className="btn-primary mt-6 inline-block">
                Sign in
              </Link>
            </>
          )}

          {state === "invalid" && (
            <>
              <p className="mt-4 text-sm text-gray-600">
                This verification link is invalid or has expired.
              </p>
              <div className="mt-6 space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your email"
                  className="input-field"
                />
                <button
                  type="button"
                  className="btn-secondary w-full"
                  onClick={() => {
                    void auth
                      .resendVerification(email.trim())
                      .then(() => setResent(true))
                      .catch(() => setResent(true));
                  }}
                  disabled={!email.trim() || resent}
                >
                  {resent ? "If that address is registered, a mail is on its way" : "Resend verification email"}
                </button>
              </div>
              <Link to="/login" className="mt-4 inline-block text-sm text-primary hover:underline">
                Back to sign in
              </Link>
            </>
          )}

          {state === "error" && (
            <>
              <p className="mt-4 text-sm text-red-600">{message}</p>
              <Link to="/login" className="mt-6 inline-block text-sm text-primary hover:underline">
                Back to sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
