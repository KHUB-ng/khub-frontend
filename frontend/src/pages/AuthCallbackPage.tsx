import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { auth, setTokens } from "@/api";
import { toast } from "sonner";

/**
 * Magic-link redemption. The old Supabase session callback is gone: this page
 * reads `?token=` and redeems it against the REST backend, stores the returned
 * tokens, and lands on the dashboard.
 */
const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState("Completing sign-in...");

  useEffect(() => {
    const run = async () => {
      const token = searchParams.get("token") ?? "";
      if (!token) {
        toast.error("This sign-in link is invalid or expired.");
        navigate("/login", { replace: true });
        return;
      }
      try {
        // redeemMagicLink returns the LoginResponse but does NOT store tokens.
        const res = await auth.redeemMagicLink(token);
        setTokens(res.token, res.refresh_token);
        toast.success("Signed in successfully");
        navigate("/dashboard", { replace: true });
      } catch {
        setMessage("This sign-in link is invalid or expired.");
        toast.error("This sign-in link is invalid or expired.");
        navigate("/login", { replace: true });
      }
    };
    run();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
};

export default AuthCallbackPage;
