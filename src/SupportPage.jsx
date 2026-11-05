import React, { useMemo, useState } from 'react';
import styles from './SupportPage.module.css';

const helpGroups = [
  { title: 'Orders & delivery', topic: 'Order / delivery', items: 'Track an order · Request cancellation · Item not as described · Missing delivery', action: 'Browse order help' },
  { title: 'Payments & wallet', topic: 'Payment / wallet', items: 'Pending transfers · Withdrawal delays · Refund timelines · Payment safety', action: 'Browse payment help' },
  { title: 'Account & safety', topic: 'Account / safety', items: 'Verification · Sign-in trouble · Report a user · Privacy requests', action: 'Browse account help' },
];
const answers = [
  { q: 'When will my refund arrive?', a: 'Wallet refunds appear after settlement; bank refunds depend on your bank. Pending is not spendable.' },
  { q: 'Can I change my delivery address?', a: 'Request a change before dispatch. Seller / courier approval may be needed.' },
  { q: 'What if my provider misses a deadline?', a: 'Message the provider on your booking. Escalate with the agreed scope and evidence if unresolved.' },
];
export default function SupportPage({ user = {}, onBack = () => {} }) {
  const [search, setSearch] = useState('');
  const [topic, setTopic] = useState('Order / delivery');
  const [reference, setReference] = useState('KH-10482');
  const [subject, setSubject] = useState('Confirm my delivery window');
  const [message, setMessage] = useState('My order is preparing. Please confirm whether both items will arrive together between 13 and 15 October.');
  const [email, setEmail] = useState(user.email || 'tomi.adeyemi@example.com');
  const [consent, setConsent] = useState(true);
  const [file, setFile] = useState(null);
  const [notice, setNotice] = useState('');
  const [ticketOpen, setTicketOpen] = useState(false);
  const visibleAnswers = useMemo(() => answers.filter(x => `${x.q} ${x.a}`.toLowerCase().includes(search.toLowerCase())), [search]);
  const chooseGroup = (group) => { setTopic(group.topic); setSearch(group.title); };
  const submit = (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim() || !email.trim() || !consent) { setNotice('Complete the required fields and confirm consent before submitting.'); return; }
    if (file && !['image/jpeg','image/png','application/pdf'].includes(file.type)) { setNotice('Attachment rejected. Add a JPG, PNG or PDF file.'); return; }
    if (file && file.size > 10 * 1024 * 1024) { setNotice('Attachment is larger than 10 MB. Choose a smaller file.'); return; }
    setNotice('KH-SP-448 is received. A confirmation is sent to your email. Replies stay in this ticket; don’t create a duplicate.');
    setTicketOpen(true);
  };
  return <div className={styles.page}>
    <main className={styles.main}>
      <div style={{ marginBottom: 18 }}><button type="button" onClick={onBack} aria-label="Go back to the previous page" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid #dce8df', background: '#fff', color: '#176b43', borderRadius: 999, padding: '10px 16px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(20,60,35,.06)' }}><span aria-hidden="true">←</span> Back</button></div>
      <header className={styles.heading}><h1>A little help goes a long way.</h1><p>09 Personal hub / Support center</p><p>Find an answer or tell us what happened. We’ll keep your task context together.</p></header>
      <label className={styles.search}><span>Search help</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Payments, delivery, bookings, account..." aria-label="Search help" /></label>
      <section className={styles.helpGrid}>{helpGroups.map(g=><article className={styles.card} key={g.title}><h2>{g.title}</h2><p>{g.items}</p><button className={styles.link} onClick={()=>chooseGroup(g)}>{g.action}</button></article>)}</section>
      <div className={styles.columns}>
        <form className={`${styles.card} ${styles.form}`} onSubmit={submit}>
          <h2>Tell us what happened</h2>
          <div className={styles.twoCol}><label className={styles.field}>Topic *<select value={topic} onChange={e=>setTopic(e.target.value)} required><option>Order / delivery</option><option>Payment / wallet</option><option>Account / safety</option><option>Service booking</option><option>Seller / provider</option><option>Driver / ride</option><option>Other</option></select></label><label className={styles.field}>Task reference<input value={reference} onChange={e=>setReference(e.target.value)} placeholder="e.g. KH-10482" /></label></div>
          <label className={styles.field}>Subject *<input value={subject} onChange={e=>setSubject(e.target.value)} required /></label>
          <label className={`${styles.field} ${styles.message}`}>Message *<textarea value={message} onChange={e=>setMessage(e.target.value)} required rows={3}/></label>
          <label className={styles.field}>Evidence (optional)<input type="file" accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" onChange={e=>{setFile(e.target.files?.[0] || null);setNotice('');}}/><small>{file ? `${file.name} · ${(file.size/1024/1024).toFixed(2)} MB` : 'No attachment · Add JPG / PNG / PDF up to 10 MB'}</small></label>
          <label className={styles.field}>Reply email *<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required /></label>
          <label className={styles.consent}><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/> I consent to support reviewing this task and the attached evidence.</label>
          <button className={styles.primary} type="submit">Submit support ticket</button>
          {notice && <p className={ticketOpen ? styles.success : styles.error} role="status">{notice}</p>}
          <p className={styles.footnote}>Typical response within 24 hours. Do not include passwords, full card numbers or OTPs.</p>
        </form>
        <aside className={styles.right}>
          <section className={`${styles.card} ${styles.answers}`}><h2>Helpful answers</h2>{(search ? visibleAnswers : answers).map(a=><div className={styles.answer} key={a.q}><p>{a.q}</p><p>{a.a}</p></div>)}{search && visibleAnswers.length===0 && <p>No matching answer yet. Submit a ticket and we’ll help.</p>}</section>
          <section className={`${styles.card} ${styles.ticket}`}><h2>Your open ticket</h2><p>KH-SP-441 · Refund status<br/>Opened 09 Oct · Awaiting bank settlement · Last reply 10 Oct<br/>◷ Support in progress</p><button className={styles.link} onClick={()=>{setTicketOpen(true);setNotice('Ticket KH-SP-441 opened. Replies should stay in this conversation.')}}>Open ticket conversation</button>{ticketOpen&&<p className={styles.ticketStatus}>{notice || 'Ticket conversation selected.'}</p>}</section>
          <section className={styles.noticeGreen}><p>Immediate safety concern?</p><p>For an emergency in Nigeria, call 112. KHUB support is not an emergency responder. Ride safety controls stay available in active tracking.</p></section>
          <section className={styles.noticeGreen}><p>State example · Ticket received</p><p>KH-SP-448 is received. A confirmation is sent to your email. Replies stay in this ticket; don’t create a duplicate.</p></section>
        </aside>
      </div>
      <button className={styles.back} onClick={onBack}>← Back to dashboard</button>
    </main>
  </div>;
}
