import React, { useState } from 'react';
import styles from './ReferralsPage.module.css';

const referrals = [
  { name: 'Bisi A.', milestone: 'Eligible order complete', reward: '₦1,000', status: '✓ Qualified / credited', qualified: true },
  { name: 'Kunle O.', milestone: 'Return window open', reward: '₦1,000', status: '◷ Pending', qualified: false },
  { name: 'Zainab M.', milestone: 'Checks in progress', reward: '₦1,000', status: '◷ Pending', qualified: false },
  { name: 'Emeka N.', milestone: 'Signed up · No order', reward: '₦0', status: '○ Not qualified', qualified: false },
];

export default function ReferralsPage({ onBack = () => {}, onWallet = () => {} }) {
  const [notice, setNotice] = useState('');
  const code = 'TOMI1428';
  const link = `khub.example/invite/${code}`;
  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(`${code}\n${link}`);
      setNotice('Referral code and link copied.');
    } catch {
      setNotice(`Your referral code is ${code}. Copy it to share with friends.`);
    }
  };
  const shareInvite = async () => {
    const text = `Join me on KHUB! Use my referral code ${code}: ${link}`;
    try {
      if (navigator.share) await navigator.share({ title: 'Join KHUB', text, url: link });
      else if (navigator.clipboard) { await navigator.clipboard.writeText(text); setNotice('Invitation copied and ready to share.'); }
      else setNotice(text);
    } catch (error) {
      if (error?.name !== 'AbortError') setNotice(text);
    }
  };

  return <div className={styles.page}>
    <div style={{ marginBottom: 18 }}><button type="button" onClick={onBack} aria-label="Go back to the previous page" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid #dce8df', background: '#fff', color: '#176b43', borderRadius: 999, padding: '10px 16px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(20,60,35,.06)' }}><span aria-hidden="true">←</span> Back</button></div>
    <header className={styles.header}>
      <h1>Good things are better together.</h1>
      <p>09 Personal hub / Referrals<br/>Invite your people to KHUB. Track each eligible reward without guesswork.</p>
    </header>

    <div className={styles.topGrid}>
      <section className={`${styles.card} ${styles.inviteCard}`}>
        <h2>Your invitation</h2>
        <h3>Share your local hub.</h3>
        <div className={styles.readout}><span>Referral code</span><strong>{code}</strong></div>
        <div className={styles.readout}><span>Illustrative referral link</span><strong>{link}</strong></div>
        <div className={styles.actions}><button className={styles.primary} onClick={copyInvite}>Copy code / link</button><button className={styles.link} onClick={shareInvite}>Share invitation</button></div>
        {notice && <p className={styles.notice} role="status">{notice}</p>}
      </section>
      <section className={styles.card}>
        <h2>How it works</h2>
        <p>1 · Invite a friend using your code.</p>
        <p>2 · They complete a first eligible order of ₦10,000 or more.</p>
        <p>3 · After the return / dispute window and checks, ₦1,000 is added to your available wallet.</p>
        <p>Illustrative programme · Terms below</p>
      </section>
    </div>

    <section className={styles.metrics} aria-label="Referral summary">
      <article className={styles.card}><strong>8</strong><span>Invited</span><small>Friends using your code</small></article>
      <article className={styles.card}><strong>3</strong><span>Qualified</span><small>Orders completed + checks</small></article>
      <article className={styles.card}><strong>₦3,000</strong><span>Rewards earned</span><small>Already available in wallet</small></article>
      <article className={styles.card}><strong>₦2,000</strong><span>Pending rewards</span><small>2 friends awaiting checks</small></article>
    </section>

    <div className={styles.bottomGrid}>
      <section className={styles.card}>
        <h2>Reward progress</h2>
        <div className={styles.progressList}>{referrals.map((item) => <article key={item.name} className={styles.referralRow}>
          <p>{item.name}</p>
          <p>Milestone: {item.milestone}　/　Reward: {item.reward}　/　Status: {item.status}</p>
        </article>)}</div>
        <p>Showing 4 of 8 invitations. Progress requires qualification, not just a signup.</p>
      </section>
      <aside className={styles.sideStack}>
        <section className={styles.card}>
          <h2>Clear, illustrative terms</h2>
          <p>₦1,000 per eligible new customer, maximum 10 rewards (₦10,000) per calendar month. Minimum first order ₦10,000; excludes cancelled, refunded or disputed transactions.</p>
          <p>No self-referrals, duplicate accounts or cash transfer purchases. Checks may take up to 7 business days after the return window closes.</p>
          <p>Rewards are not guaranteed until qualified. This is an example programme; production terms must be approved and dated before launch.</p>
          <button className={styles.link} onClick={onWallet}>View wallet rewards</button>
        </section>
        <section className={styles.noticeCard}>Progress this month · 3 / 10 qualified<br/>₦3,000 earned. You have room for 7 more qualified rewards this month; pending rewards are not spendable yet.</section>
      </aside>
    </div>
    <button className={styles.back} onClick={onBack}>Back to dashboard</button>
  </div>;
}
