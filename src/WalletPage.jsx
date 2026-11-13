import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './WalletPage.module.css';
import { walletApi } from './lib/wallet.js';
import { Eye, EyeOff } from 'lucide-react';

const money = value => `₦${(Number(value || 0) / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const naira = value => `₦${Number(value || 0).toLocaleString('en-NG')}`;
const dateLabel = value => value ? new Date(value).toLocaleString('en-NG') : '—';

export default function WalletPage({ user = {}, onBack = () => {}, onNavigate = () => {} }) {
  const [filter, setFilter] = useState('All transactions');
  const [balanceVisible, setBalanceVisible] = useState(() => {
    try { return window.localStorage.getItem('khub.wallet.balanceVisible') !== 'false'; }
    catch { return true; }
  });
  const [wallet, setWallet] = useState(null);
  const [entries, setEntries] = useState([]);
  const [banks, setBanks] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [amount, setAmount] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [topUpAmount, setTopUpAmount] = useState('5000');
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [summary, ledger, withdrawalRows] = await Promise.all([
        walletApi.summary(),
        walletApi.entries(),
        walletApi.withdrawals(),
      ]);
      setWallet(summary);
      setEntries(Array.isArray(ledger) ? ledger : ledger?.items || []);
      setWithdrawals(Array.isArray(withdrawalRows) ? withdrawalRows : withdrawalRows?.items || []);
      try {
        const bankRows = await walletApi.banks();
        setBanks(Array.isArray(bankRows) ? bankRows : []);
      } catch { setBanks([]); }
    } catch (err) {
      setError(err?.message || 'Wallet information could not be loaded.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    let active = true;
    const verifyReturn = async () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('payment_return') === 'flutterwave') {
        const txRef = params.get('tx_ref');
        window.history.replaceState({}, document.title, window.location.pathname);
        if (txRef) {
          try {
            const result = await walletApi.fundingStatusByReference(txRef);
            if (active) setNotice(result.status === 'succeeded'
              ? 'Flutterwave payment verified by KHUB. Your wallet balance has been refreshed.'
              : 'Flutterwave returned to KHUB. The payment is not yet confirmed; your wallet remains unchanged until server-side verification succeeds.');
          } catch (err) {
            if (active) setError(err?.message || 'KHUB could not verify the Flutterwave return. Refresh your wallet shortly.');
          }
        } else if (active) {
          setNotice('Returned from Flutterwave without a transaction reference. No payment has been assumed; refresh your wallet after verification.');
        }
      }
      if (active) await load();
    };
    verifyReturn();
    return () => { active = false; };
  }, [load]);

  useEffect(() => {
    try { window.localStorage.setItem('khub.wallet.balanceVisible', String(balanceVisible)); } catch { /* Storage may be disabled; visibility still works for this session. */ }
  }, [balanceVisible]);

  const visible = useMemo(() => entries.filter(item => {
    if (filter === 'All transactions') return true;
    if (filter === 'Money in') return item.side === 'credit';
    if (filter === 'Money out') return item.side === 'debit';
    return false;
  }), [entries, filter]);

  const fundWallet = async () => {
    if (!/^\d+(\.\d{1,2})?$/.test(topUpAmount) || Number(topUpAmount) <= 0) {
      setError('Enter a valid funding amount in naira.');
      return;
    }
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await walletApi.fund(topUpAmount);
      if (!result?.link) throw new Error('Flutterwave did not return a hosted checkout link.');
      window.location.assign(result.link);
    } catch (err) { setError(err?.message || 'Wallet funding could not be started.'); setBusy(false); }
  };

  const requestWithdrawal = async () => {
    if (!bankCode || !/^\d{10}$/.test(accountNumber)) {
      setError('Choose a bank and enter a valid 10-digit account number.');
      return;
    }
    if (!/^\d+$/.test(amount) || Number(amount) < 1) {
      setError('Enter a valid whole-naira withdrawal amount.');
      return;
    }
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await walletApi.withdraw({ bank_code: bankCode, account_number: accountNumber, amount });
      setNotice(`Withdrawal request ${result.reference} was submitted. Status: ${result.status}.`);
      setAmount(''); setAccountNumber('');
      await load();
    } catch (err) { setError(err?.message || 'Withdrawal could not be submitted. KYC verification may be required.'); }
    finally { setBusy(false); }
  };

  const downloadStatement = () => {
    const rows = [['Date','Type','Side','Amount (kobo)','Balance after (kobo)','Narration'], ...visible.map(item => [
      item.created_at, item.entry_type, item.side, item.amount_kobo, item.balance_after_kobo, item.narration || ''
    ])];
    const csv = rows.map(row => row.map(value => '"' + String(value ?? '').replaceAll('"','""') + '"').join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a'); link.href = url; link.download = 'khub-wallet-statement.csv'; link.click(); URL.revokeObjectURL(url);
  };

  return <div className={styles.page}>
    <div style={{ marginBottom: 18 }}><button type="button" onClick={onBack} aria-label="Go back to the previous page" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid #dce8df', background: '#fff', color: '#176b43', borderRadius: 999, padding: '10px 16px', fontWeight: 700, cursor: 'pointer' }}>← Back</button></div>
    <header className={styles.header}><h1>Your money, clearly accounted for.</h1><p>09 Personal hub / Wallet<br/>{user.name || 'KHUB account'} · NGN wallet · Live backend balance</p></header>
    {loading && <p>Loading wallet…</p>}
    {error && <p className={styles.statusMessage} role="alert">{error}</p>}
    {notice && <p className={styles.statusMessage} role="status">{notice}</p>}
    <div className={styles.balanceGrid}>
      <section className={`${styles.card} ${styles.available}`}><h2>Available to use</h2><div className={styles.balanceLine}><strong className={styles.balance} aria-live="polite">{balanceVisible ? (wallet?.balance_display || money(wallet?.balance_kobo)) : '₦ ••••••••'}</strong><button type="button" className={styles.visibilityToggle} onClick={() => setBalanceVisible(value => !value)} aria-label={balanceVisible ? 'Hide wallet balance' : 'Show wallet balance'} aria-pressed={!balanceVisible}>{balanceVisible ? <EyeOff size={19}/> : <Eye size={19}/>}<span>{balanceVisible ? 'Hide balance' : 'Show balance'}</span></button></div><p>Spendable KHUB wallet balance from the backend ledger.</p><div className={styles.actions}><button className={styles.primary} onClick={()=>{setTopUpOpen(true);setError('');}}>Fund wallet with Flutterwave</button><button className={styles.link} onClick={()=>document.getElementById('withdrawal-details')?.scrollIntoView({behavior:'smooth',block:'center'})}>Withdraw</button></div></section>
      <section className={styles.card}><h2>Withdrawal requests</h2><strong className={styles.pendingAmount}>{withdrawals.length}</strong><p>Requests recorded by the backend.</p>{withdrawals.slice(0,3).map(row=><p key={row.pid}>{row.reference} · {row.status} · {money(row.amount_kobo)}</p>)}</section>
    </div>
    <div className={styles.lowerGrid}>
      <section className={styles.historyColumn}>
        <nav className={styles.tabs} aria-label="Transaction filters">{['All transactions','Money in','Money out'].map(item=><button key={item} className={filter===item?styles.activeTab:''} onClick={()=>setFilter(item)}>{item}</button>)}</nav>
        <section className={`${styles.card} ${styles.history}`}><h2>Transaction history</h2>
          {visible.map(item=><article className={styles.transaction} key={item.id}><p>{item.narration || item.entry_type}</p><p>{dateLabel(item.created_at)} · {item.entry_type} · {item.side} · {money(item.amount_kobo)}</p><small>Balance after: {money(item.balance_after_kobo)}</small></article>)}
          {!loading && visible.length===0 && <p>No ledger entries were returned for this filter.</p>}
          <button className={styles.link} onClick={downloadStatement} disabled={!visible.length}>Download statement</button>
        </section>
      </section>
      <aside className={styles.sideStack}>
        <section className={`${styles.card} ${styles.withdrawal}`} id="withdrawal-details">
          <h2>Request a withdrawal</h2>
          <label className={styles.readout}><span>Bank</span><select value={bankCode} onChange={e=>setBankCode(e.target.value)}><option value="">Select a bank</option>{banks.map(bank=><option key={bank.code} value={bank.code}>{bank.name}</option>)}</select></label>
          <label className={styles.readout}><span>10-digit account number</span><input inputMode="numeric" maxLength={10} value={accountNumber} onChange={e=>setAccountNumber(e.target.value.replace(/\D/g,''))} placeholder="0123456789"/></label>
          <label className={styles.readout}><span>Amount (whole naira)</span><input inputMode="numeric" value={amount} onChange={e=>setAmount(e.target.value.replace(/\D/g,''))} placeholder="10000"/><small>{amount ? naira(amount) : 'Enter an amount'}</small></label>
          <p>Withdrawals require verified KYC. The backend validates the balance, bank account, limits and Flutterwave transfer result.</p>
          <button className={styles.primary} onClick={requestWithdrawal} disabled={busy}>{busy?'Submitting…':'Submit withdrawal request'}</button>
        </section>
        <section className={styles.noticeCard}><p>Payment security</p><p>Wallet funding redirects to Flutterwave hosted checkout. KHUB credits your wallet only after server-side transaction verification.</p><button className={styles.link} onClick={load}>Refresh balance and ledger</button></section>
      </aside>
    </div>
    {topUpOpen && <div className={styles.modalBackdrop} role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setTopUpOpen(false);}}><section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="topup-title"><button className={styles.modalClose} onClick={()=>setTopUpOpen(false)} aria-label="Close top-up">×</button><h2 id="topup-title">Fund your KHUB wallet</h2><p>Enter the amount in naira. Payment will be completed on Flutterwave.</p><label>Amount (₦)<input inputMode="decimal" value={topUpAmount} onChange={e=>setTopUpAmount(e.target.value.replace(/[^0-9.]/g,''))}/></label><button className={styles.primary} disabled={busy} onClick={fundWallet}>{busy?'Opening Flutterwave…':'Continue to Flutterwave'}</button></section></div>}
    <button className={styles.back} onClick={onBack}>Back to dashboard</button>
  </div>;
}
