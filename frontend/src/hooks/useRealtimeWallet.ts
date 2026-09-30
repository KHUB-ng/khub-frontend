import { useCallback, useEffect, useState } from "react";
import { wallet } from "@/api";
import type { LedgerEntry, Wallet } from "@/api";

export interface WalletData {
  id: string;
  balance_kobo: number;
  balance_display: string;
  /** Legacy alias — prefer `balance_display`. */
  balance: number;
  held_amount: number;
}

/**
 * Wallet state against the REST backend (`GET /api/wallet`,
 * `GET /api/wallet/entries` keyset ledger).
 *
 * Supabase realtime channels do not exist. The wallet is re-polled every
 * 20s (and immediately after any money action via `refresh()`), which is
 * the documented replacement. Exported signature is unchanged so existing
 * consumers keep compiling.
 */
export const useRealtimeWallet = () => {
  const [walletState, setWalletState] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const toWalletData = (w: Wallet): WalletData => ({
    id: w.pid,
    balance_kobo: w.balance_kobo,
    balance_display: w.balance_display,
    balance: w.balance_kobo,
    held_amount: 0,
  });

  const fetchWallet = useCallback(async () => {
    try {
      const w = await wallet.get();
      setWalletState(toWalletData(w));
    } catch {
      /* leave last-known balance on screen */
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    try {
      const entries = await wallet.entries({ limit: 50 });
      setTransactions(entries);
    } catch {
      /* ledger is best-effort */
    }
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([fetchWallet(), fetchTransactions()]);
  }, [fetchWallet, fetchTransactions]);

  useEffect(() => {
    void fetchWallet();
    void fetchTransactions();
    const timer = window.setInterval(() => {
      void fetchWallet();
    }, 20_000);
    return () => window.clearInterval(timer);
  }, [fetchWallet, fetchTransactions]);

  const refetchTransactions = useCallback(async () => {
    await fetchTransactions();
  }, [fetchTransactions]);

  return { wallet: walletState, transactions, loading, refresh, refetchTransactions };
};
