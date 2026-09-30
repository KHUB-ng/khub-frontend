import React, { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { wallet as walletApi, toNairaString, ApiError, koboToNaira } from "@/api";
import type { FundIntent, LedgerEntry, Wallet, WithdrawalResponse } from "@/api";
import WithdrawalDialog from "../components/WithdrawalDialog";
import { Wallet as WalletIcon, ArrowUp, ArrowDown, Send, Download, QrCode } from "lucide-react";
import { toast } from "sonner";

const POLL_MS = 5_000;
const POLL_TRIES = 24;

const errMsg = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback;

/**
 * Wallet against the REST backend:
 * - `GET /api/wallet` → `{pid, balance_kobo, balance_display}`
 * - Ledger `GET /api/wallet/entries` (keyset `?after=&limit=`, newest first)
 * - Funding replaces the old card flow: `POST /api/wallet/fund` (naira string) →
 *   `{pid, tx_ref, link, amount_kobo}`; open `link` (Flutterwave hosted
 *   checkout) via `window.open`, then poll `GET /api/wallet/fund/{pid}`
 *   while `status` is pending.
 * - Withdrawals via `POST /api/wallet/withdraw` (dialog), history via
 *   `GET /api/wallet/withdrawals`.
 * - P2P via `POST /api/wallet/transfer`.
 * Balance display uses `balance_display`; the wallet is re-polled every
 * 20s after any money action.
 */
export default function Wallet() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showFundModal, setShowFundModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [transferEmail, setTransferEmail] = useState("");
  const [funding, setFunding] = useState(false);
  const [transferring, setTransferring] = useState(false);

  const walletQuery = useQuery({
    queryKey: ["wallet"],
    queryFn: () => walletApi.get(),
    enabled: !!user,
    refetchInterval: 20_000,
  });

  const entriesQuery = useQuery({
    queryKey: ["wallet-entries"],
    queryFn: () => walletApi.entries({ limit: 20 }),
    enabled: !!user,
  });

  const withdrawalsQuery = useQuery({
    queryKey: ["wallet-withdrawals"],
    queryFn: () => walletApi.withdrawals(),
    enabled: !!user,
  });

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["wallet"] });
    queryClient.invalidateQueries({ queryKey: ["wallet-entries"] });
    queryClient.invalidateQueries({ queryKey: ["wallet-withdrawals"] });
  }, [queryClient]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const w: Wallet | undefined = walletQuery.data;
  const transactions: LedgerEntry[] = entriesQuery.data ?? [];
  const withdrawals: WithdrawalResponse[] = withdrawalsQuery.data ?? [];
  const loading = walletQuery.isLoading && !w;

  const pollFundIntent = async (pid: string) => {
    for (let i = 0; i < POLL_TRIES; i += 1) {
      await new Promise((r) => setTimeout(r, POLL_MS));
      try {
        const intent: FundIntent = await walletApi.getFundIntent(pid);
        const status = String((intent as unknown as { status?: string }).status ?? "").toLowerCase();
        if (status && status !== "pending") {
          if (status === "paid" || status === "success" || status === "successful" || status === "completed") {
            toast.success("Wallet funded!");
          } else {
            toast.info(`Funding ${status}.`);
          }
          refresh();
          return;
        }
      } catch {
        /* keep polling through transient errors */
      }
    }
    toast.info("Still confirming with the provider — your balance will update shortly.");
    refresh();
  };

  const fundWallet = async () => {
    const naira = toNairaString(amount);
    if (!naira) {
      toast.error("Enter a valid amount (minimum ₦100)");
      return;
    }
    if (Number(naira) < 100) {
      toast.error("Minimum funding amount is ₦100");
      return;
    }
    if (!window.confirm(`Fund your wallet with ₦${Number(naira).toLocaleString()}?`)) return;
    setFunding(true);
    try {
      const intent = await walletApi.fund(naira);
      window.open(intent.link, "_blank", "noopener,noreferrer");
      toast.info("Complete payment in the checkout tab — confirming automatically.");
      setShowFundModal(false);
      setAmount("");
      void pollFundIntent(intent.pid);
    } catch (err) {
      if (err instanceof ApiError && err.isUnconfigured) {
        toast.error("Card funding is unavailable right now — please try again later.");
      } else {
        toast.error(errMsg(err, "Funding failed"));
      }
    } finally {
      setFunding(false);
    }
  };

  const transfer = async () => {
    const naira = toNairaString(amount);
    if (!naira || !transferEmail.trim()) {
      toast.error("Enter a recipient email and a valid amount");
      return;
    }
    if (!window.confirm(`Send ₦${Number(naira).toLocaleString()} to ${transferEmail.trim()}?`)) return;
    setTransferring(true);
    try {
      await walletApi.transfer(transferEmail.trim(), naira);
      toast.success("Transfer sent!");
      setShowTransferModal(false);
      setAmount("");
      setTransferEmail("");
      refresh();
    } catch (err) {
      toast.error(errMsg(err, "Transfer failed"));
    } finally {
      setTransferring(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container-custom py-8 pb-24">
      {/* Wallet Balance Card */}
      <div className="bg-gradient-to-br from-primary to-secondary rounded-2xl p-6 text-white mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <WalletIcon className="w-6 h-6" />
            <span className="font-semibold">Total Balance</span>
          </div>
          <button className="bg-white/20 px-3 py-1 rounded-lg text-sm">
            <QrCode className="w-4 h-4 inline" /> QR
          </button>
        </div>
        <div className="mb-6">
          <div className="text-4xl font-bold">{w?.balance_display ?? koboToNaira(0)}</div>
          <div className="text-sm opacity-90">Available Balance</div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowFundModal(true)}
            className="flex-1 bg-white text-primary py-2 rounded-xl font-semibold flex items-center justify-center gap-2"
          >
            <ArrowDown className="w-5 h-5" />
            Fund Wallet
          </button>
          <div className="flex-1 flex">
            <WithdrawalDialog
              walletBalance={w?.balance_kobo ?? 0}
              walletDisplay={w?.balance_display}
              walletId={w?.pid ?? ""}
              onSuccess={refresh}
            />
          </div>
          <button
            onClick={() => setShowTransferModal(true)}
            className="flex-1 bg-white/20 border border-white text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2"
          >
            <ArrowUp className="w-5 h-5" />
            Send
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <button onClick={() => setShowTransferModal(true)} className="card p-4 text-center hover:shadow-lg transition">
          <Send className="w-6 h-6 text-primary mx-auto mb-2" />
          <span className="text-sm">Transfer</span>
        </button>
        <button onClick={() => setShowFundModal(true)} className="card p-4 text-center hover:shadow-lg transition">
          <ArrowDown className="w-6 h-6 text-primary mx-auto mb-2" />
          <span className="text-sm">Fund</span>
        </button>
      </div>

      {/* Transactions */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Recent Transactions</h2>
        </div>

        <div className="space-y-3">
          {transactions.length === 0 ? (
            <div className="card p-8 text-center text-gray-500">
              No transactions yet
            </div>
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className="card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    tx.side === "credit" ? "bg-green-100" : "bg-red-100"
                  }`}>
                    {tx.side === "credit" ? <ArrowDown className="w-5 h-5 text-green-600" /> :
                     <ArrowUp className="w-5 h-5 text-red-600" />}
                  </div>
                  <div>
                    <p className="font-semibold capitalize">{tx.entry_type.replace(/_/g, " ")}</p>
                    <p className="text-xs text-gray-500">
                      {tx.narration ?? new Date(tx.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${
                    tx.side === "credit" ? "text-green-600" : "text-red-600"
                  }`}>
                    {tx.side === "credit" ? "+" : "-"} {koboToNaira(tx.amount_kobo)}
                  </p>
                  <p className="text-xs text-gray-500">{koboToNaira(tx.balance_after_kobo)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Withdrawal history */}
      {withdrawals.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Withdrawals</h2>
          <div className="space-y-3">
            {withdrawals.map((wd, i) => (
              <div key={String(wd.pid ?? i)} className="card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-100">
                    <ArrowUp className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-semibold">Withdrawal</p>
                    <p className="text-xs text-gray-500 capitalize">{wd.status}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fund Wallet Modal */}
      {showFundModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Fund Wallet</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Amount (₦)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input-field"
                  placeholder="Enter amount"
                  min="100"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowFundModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={fundWallet}
                  disabled={funding}
                  className="flex-1 btn-primary"
                >
                  {funding ? "Processing..." : "Proceed to Pay"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Send Money</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Recipient email</label>
                <input
                  type="email"
                  value={transferEmail}
                  onChange={(e) => setTransferEmail(e.target.value)}
                  className="input-field"
                  placeholder="friend@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Amount (₦)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input-field"
                  placeholder="Enter amount"
                  min="1"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowTransferModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={transfer}
                  disabled={transferring}
                  className="flex-1 btn-primary"
                >
                  {transferring ? "Sending..." : "Send"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
