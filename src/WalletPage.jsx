import React, { useMemo, useState } from 'react';
import styles from './WalletPage.module.css';

const transactions = [
  { title: 'Wallet top-up', date: '11 Oct', ref: 'KH-TU-778', amount: '+₦50,000', status: '✓ Available', type: 'Money in' },
  { title: 'Service · Ada Standard', date: '11 Oct', ref: 'KH-SV-2041', amount: '−₦78,750', status: '✓ Paid', type: 'Money out' },
  { title: 'Referral reward', date: '10 Oct', ref: 'KH-RF-119', amount: '+₦1,000', status: '✓ Available', type: 'Money in' },
  { title: 'Order refund', date: '09 Oct', ref: 'KH-RF-221', amount: '+₦10,000', status: '◷ Pending', type: 'Pending' },
  { title: 'Referral reward checks', date: '09 Oct', ref: 'KH-RF-120', amount: '+₦2,000', status: '◷ Pending', type: 'Pending' },
];

export default function WalletPage({ user = {}, onBack = () => {}, onNavigate = () => {} }) {
  const [filter, setFilter] = useState('All transactions');
  const [amount, setAmount] = useState('20000');
  const [notice, setNotice] = useState('');
  const [withdrawalReview, setWithdrawalReview] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('5000');
  const [statementReady, setStatementReady] = useState(false);
  const visibleTransactions = useMemo(() => filter === 'All transactions' ? transactions : transactions.filter((item) => item.type === filter), [filter]);
  const numericAmount = Number(amount) || 0;
  const formatNaira = (value) => `₦${value.toLocaleString('en-NG')}`;

  const downloadStatement = () => {
    const csv = ['Transaction,Date,Reference,Amount,Status', ...transactions.map((t) => `"${t.title}","${t.date}","${t.ref}","${t.amount}","${t.status}"`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = 'khub-wallet-statement.csv'; link.click(); URL.revokeObjectURL(url);
    setStatementReady(true);
  };

  return <div className={styles.page}>
    <div style={{ marginBottom: 18 }}><button type="button" onClick={onBack} aria-label="Go back to the previous page" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid #dce8df', background: '#fff', color: '#176b43', borderRadius: 999, padding: '10px 16px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(20,60,35,.06)' }}><span aria-hidden="true">←</span> Back</button></div>
    <header className={styles.header}>
      <h1>Your money, clearly accounted for.</h1>
      <p>09 Personal hub / Wallet<br/>{user.name || 'Tomi Adeyemi'} · NGN wallet · Balances updated 11 Oct 2026, 11:20 WAT</p>
    </header>

    <div className={styles.balanceGrid}>
      <section className={`${styles.card} ${styles.available}`}>
        <h2>Available to use</h2><strong className={styles.balance}>₦86,500</strong>
        <p>Ready for eligible KHUB payments or withdrawal.</p>
        <div className={styles.actions}><button className={styles.primary} onClick={() => { setTopUpOpen(true); setNotice(''); }}>Top up</button><button className={styles.link} onClick={() => document.getElementById('withdrawal-details')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>Withdraw</button></div>
      </section>
      <section className={styles.card}>
        <h2>Pending funds</h2><strong className={styles.pendingAmount}>₦12,000</strong><p>◷ Not available yet</p>
        <p>Refund KH-RF-221 · ₦10,000 awaiting settlement. Referral rewards · ₦2,000 awaiting qualification checks.</p>
        <p>Not included in the available balance. You won’t be charged to release pending funds.</p>
      </section>
    </div>

    <div className={styles.lowerGrid}>
      <section className={styles.historyColumn}>
        <nav className={styles.tabs} aria-label="Transaction filters">{['All transactions', 'Money in', 'Money out', 'Pending'].map((item) => <button key={item} className={filter === item ? styles.activeTab : ''} onClick={() => setFilter(item)}>{item}</button>)}</nav>
        <section className={`${styles.card} ${styles.history}`}>
          <h2>Transaction history</h2>
          {visibleTransactions.map((item) => <article className={styles.transaction} key={item.ref}><p>{item.title}</p><p>Date / reference: {item.date} · {item.ref}　/　Amount: {item.amount}　/　Status: {item.status}</p></article>)}
          {visibleTransactions.length === 0 && <p>No transactions in this category.</p>}
          <button className={styles.link} onClick={downloadStatement}>Download statement</button>
          {statementReady && <p className={styles.statusMessage} role="status">Your wallet statement has been downloaded.</p>}
          <p>Current balance includes earlier activity not displayed in this five-record view.</p>
        </section>
      </section>

      <aside className={styles.sideStack}>
        <section className={`${styles.card} ${styles.withdrawal}`} id="withdrawal-details">
          <h2>Withdrawal details</h2>
          <div className={styles.readout}><span>Bank account</span><strong>{user.name || 'Tomi Adeyemi'} · GTBank · •••• 1428</strong></div>
          <label className={styles.readout} htmlFor="withdrawal-amount"><span>Amount</span><input id="withdrawal-amount" inputMode="numeric" value={amount} onChange={(e) => { setAmount(e.target.value.replace(/[^0-9]/g, '')); setWithdrawalReview(false); }} aria-label="Withdrawal amount in naira"/><small>{numericAmount ? formatNaira(numericAmount) : 'Enter an amount'}</small></label>
          <p>Illustrative withdrawal fee ₦50 · You receive {formatNaira(Math.max(0, numericAmount - 50))} · Maximum available ₦86,500</p>
          <button className={styles.primary} onClick={() => { if (numericAmount < 1000) { setNotice('Enter at least ₦1,000 to review a withdrawal.'); setWithdrawalReview(false); } else if (numericAmount > 86500) { setNotice('Your withdrawal cannot exceed the available balance of ₦86,500.'); setWithdrawalReview(false); } else { setNotice(''); setWithdrawalReview(true); } }}>Review withdrawal</button>
          {withdrawalReview && <div className={styles.confirmation} role="status"><strong>Review your withdrawal</strong><p>Withdraw {formatNaira(numericAmount)} to your GTBank account. Estimated fee: ₦50. You receive {formatNaira(numericAmount - 50)}.</p><button className={styles.primary} onClick={() => { setNotice('Withdrawal request prepared for review. No money has been moved in this demo.'); setWithdrawalReview(false); }}>Confirm request</button></div>}
          {notice && <p className={styles.statusMessage} role="status">{notice}</p>}
          <p>Final fees and expected arrival shown before confirmation. Never share your PIN or OTP in chat.</p>
        </section>
        <section className={styles.noticeCard}><p>State example · Withdrawal processing</p><p>KH-WD-2281 · ₦20,000 is pending with your bank. No second withdrawal is needed. Expected update within 1 business day; retain this reference.</p><button className={styles.link} onClick={() => setNotice('KH-WD-2281 is pending with your bank. Expected update within 1 business day.')}>Check transfer status</button></section>
      </aside>
    </div>

    {topUpOpen && <div className={styles.modalBackdrop} role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setTopUpOpen(false); }}><section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="topup-title"><button className={styles.modalClose} onClick={() => setTopUpOpen(false)} aria-label="Close top-up">×</button><h2 id="topup-title">Top up your wallet</h2><p>Choose an amount to add to your KHUB wallet.</p><label>Amount (₦)<input inputMode="numeric" value={topUpAmount} onChange={(e) => setTopUpAmount(e.target.value.replace(/[^0-9]/g, ''))}/></label><p>Payment method: Bank transfer</p><button className={styles.primary} onClick={() => { setNotice(`Top-up of ${formatNaira(Number(topUpAmount) || 0)} is ready for bank transfer. This demo does not initiate payment.`); setTopUpOpen(false); }}>Continue to payment</button><small>Illustrative interface only. No payment will be initiated.</small></section></div>}
    <button className={styles.back} onClick={onBack}>Back to dashboard</button>
  </div>;
}
