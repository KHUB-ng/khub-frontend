import { useEffect, useState } from "react";
import { ArrowUpRight, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { wallet as walletApi, toWholeNaira, ApiError } from "@/api";
import type { Bank } from "@/api";
import { toast } from "sonner";

interface WithdrawalDialogProps {
  /** Ready display string from `GET /api/wallet` (e.g. "₦12,500.00"). */
  walletDisplay?: string;
  /** Kobo balance from `GET /api/wallet` — kept for the legacy numeric prop. */
  walletBalance: number;
  walletId: string;
  onSuccess?: () => void;
}

/**
 * Withdrawal against `POST /api/wallet/withdraw` — whole naira only, bank
 * chosen from `GET /api/wallet/banks`, KYC-verified accounts only (403 →
 * "complete KYC"). History comes from `GET /api/wallet/withdrawals` on the
 * parent page. Kept props so existing callers compile.
 */
const WithdrawalDialog = ({ walletBalance, walletDisplay, onSuccess }: WithdrawalDialogProps) => {
  const { user } = useAuth();
  const kycVerified = (user as unknown as { verification_status?: string })?.verification_status === "verified";
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [loading, setLoading] = useState(false);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    walletApi
      .banks()
      .then((rows) => {
        if (!cancelled) setBanks(rows);
      })
      .catch(() => {
        if (!cancelled) setBanks([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const selectedBank = banks.find((b) => b.code === bankCode);

  const resetForm = () => {
    setStep("form");
    setBankCode("");
    setAccountNumber("");
    setAccountName("");
    setAmount("");
  };

  const handleProceed = () => {
    const whole = toWholeNaira(amount);
    if (!bankCode || !accountNumber || !accountName || !whole) {
      toast.error("Please fill all fields correctly (whole naira only, no kobo)");
      return;
    }
    if (accountNumber.length !== 10) {
      toast.error("Account number must be 10 digits");
      return;
    }
    if (Number(whole) * 100 > walletBalance) {
      toast.error("Insufficient balance");
      return;
    }
    setStep("confirm");
  };

  const handleWithdraw = async () => {
    const whole = toWholeNaira(amount);
    if (!whole || !bankCode) return;
    if (!window.confirm(`Withdraw ₦${Number(whole).toLocaleString()} to ${selectedBank?.name ?? bankCode} ${accountNumber}?`)) return;
    setLoading(true);
    try {
      await walletApi.withdraw({
        bank_code: bankCode,
        account_number: accountNumber,
        amount: whole,
      });
      toast.success(`₦${Number(whole).toLocaleString()} withdrawal is being processed`);
      resetForm();
      setOpen(false);
      onSuccess?.();
    } catch (err) {
      if (err instanceof ApiError && err.isForbidden) {
        toast.error("Withdrawals need a verified account — please complete KYC first.");
      } else {
        toast.error(err instanceof Error ? err.message : "Withdrawal failed");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!kycVerified) {
    return (
      <Button variant="outline" className="flex-1 border-border text-foreground opacity-50" disabled title="Complete KYC to withdraw">
        <ArrowUpRight className="w-4 h-4 mr-1" /> Withdraw
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex-1 border-border text-foreground">
          <ArrowUpRight className="w-4 h-4 mr-1" /> Withdraw
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{step === "form" ? "Withdraw Funds" : "Confirm Withdrawal"}</DialogTitle>
        </DialogHeader>

        {step === "form" ? (
          <div className="space-y-4">
            <div>
              <Label>Amount (₦, whole naira)</Label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={1}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Available: {walletDisplay ?? `₦${(walletBalance / 100).toLocaleString()}`}
              </p>
            </div>
            <div>
              <Label>Bank</Label>
              <Select value={bankCode} onValueChange={setBankCode}>
                <SelectTrigger><SelectValue placeholder={banks.length ? "Select bank" : "Loading banks…"} /></SelectTrigger>
                <SelectContent>
                  {banks.map((b) => (
                    <SelectItem key={b.code} value={b.code}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Account Number</Label>
              <Input
                type="text"
                placeholder="0123456789"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                maxLength={10}
              />
            </div>
            <div>
              <Label>Account Name</Label>
              <Input
                placeholder="Account holder name"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
              />
            </div>
            <Button onClick={handleProceed} className="w-full gradient-purple text-primary-foreground">
              Proceed
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert className="border-warning/30 bg-warning/5">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <AlertDescription className="text-sm">
                Please confirm this withdrawal is correct. This action cannot be undone.
              </AlertDescription>
            </Alert>
            <div className="space-y-2 p-4 rounded-lg border border-border bg-accent/30">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold text-foreground">₦{Number(toWholeNaira(amount) ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Bank</span>
                <span className="text-foreground">{selectedBank?.name ?? bankCode}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Account</span>
                <span className="text-foreground">{accountNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Name</span>
                <span className="text-foreground">{accountName}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("form")} className="flex-1">Back</Button>
              <Button onClick={handleWithdraw} disabled={loading} className="flex-1 gradient-purple text-primary-foreground">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Withdrawal"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WithdrawalDialog;
