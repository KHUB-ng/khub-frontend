import React, { useMemo, useState } from 'react';
import styles from './NotificationsPage.module.css';

const initialItems = [
  { id: 1, date: 'Today · 11 October 2026', category: 'Orders', unread: true, title: 'Your order is being prepared', detail: 'KH-10482 · Studio Nook has started packing your chair. Expected 13–15 Oct. · 10:58 WAT', action: 'View order' },
  { id: 2, date: 'Today · 11 October 2026', category: 'Services', unread: true, title: 'Ada is ready for your call', detail: 'KH-SV-2041 · Discovery call Tuesday 13 Oct at 10:00 WAT. · 10:50 WAT', action: 'View booking' },
  { id: 3, date: 'Today · 11 October 2026', category: 'Jobs', unread: true, title: 'Application received', detail: 'Cedar Digital · Product designer · KH-AP-9012. Review expected within 7 business days. · 11:20 WAT', action: 'View application' },
  { id: 4, date: 'Yesterday · 10 October 2026', category: 'Wallet', unread: false, title: 'Referral reward available', detail: '₦1,000 credited after Bisi’s order qualified. KH-RF-119. · 16:05 WAT' },
  { id: 5, date: 'Yesterday · 10 October 2026', category: 'Account', unread: false, title: 'Your account is secure', detail: 'Successful sign-in from Lagos. If this wasn’t you, review active sessions. · 09:14 WAT' },
  { id: 6, date: 'Earlier · 09 October 2026', category: 'Wallet', unread: false, title: 'Refund is pending', detail: 'KH-RF-221 · ₦10,000 awaiting bank settlement. Pending funds are not available to spend.' },
];
const categories = ['All', 'Orders', 'Services', 'Jobs', 'Wallet', 'Account'];
export default function NotificationsPage({ onBack = () => {}, onNavigate = () => {} }) {
  const [items, setItems] = useState(initialItems);
  const [category, setCategory] = useState('All');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [transactionAlerts, setTransactionAlerts] = useState(true);
  const [promotions, setPromotions] = useState(false);
  const [saved, setSaved] = useState(false);
  const unread = items.filter(n => n.unread).length;
  const visible = useMemo(() => items.filter(n => (category === 'All' || n.category === category) && (!unreadOnly || n.unread)), [items, category, unreadOnly]);
  const grouped = useMemo(() => visible.reduce((acc, n) => { (acc[n.date] ||= []).push(n); return acc; }, {}), [visible]);
  const markAll = () => setItems(prev => prev.map(n => ({ ...n, unread: false })));
  const openItem = (id) => setItems(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
  return <main className={styles.page}>
    <div style={{ marginBottom: 18 }}><button type="button" onClick={onBack} aria-label="Go back to the previous page" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid #dce8df', background: '#fff', color: '#176b43', borderRadius: 999, padding: '10px 16px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(20,60,35,.06)' }}><span aria-hidden="true">←</span> Back</button></div>
    <header className={styles.heading}><h1>The updates that matter.</h1><p>Q9 Personal hub / Notifications</p><span>{unread} unread updates · Ordered by date · Account and task alerts stay separate from promotions.</span></header>
    <nav className={styles.tabs} aria-label="Notification categories">{categories.map(c => <button key={c} className={category === c ? styles.activeTab : ''} onClick={() => setCategory(c)}>{c}</button>)}</nav>
    <div className={styles.actions}><button className={styles.link} onClick={markAll}>Mark all as read</button><button className={styles.link} onClick={() => { document.getElementById('notification-controls')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}>Manage preferences</button></div>
    <div className={styles.layout}>
      <div className={styles.feed}>{Object.keys(grouped).length ? Object.entries(grouped).map(([date, list]) => <section className={styles.card} key={date}><h2>{date}</h2>{list.map(n => <article className={styles.notification} key={n.id}><p className={styles.status}>{n.unread ? <><b>●</b> Unread</> : '✓ Read'} · {n.title}</p><p>{n.detail}</p>{n.action && <button className={styles.link} onClick={() => { openItem(n.id); if (n.category === 'Orders') onNavigate('orders'); }}>{n.action}</button>}</article>)}</section>) : <section className={styles.card}><h2>No notifications here</h2><p>There are no notifications matching this category and filter.</p><button className={styles.link} onClick={() => { setCategory('All'); setUnreadOnly(false); }}>Show all notifications</button></section>}</div>
      <aside className={styles.sidebar}>
        <section className={styles.card} id="notification-controls"><h2>Notification controls</h2><p>{unread} unread · Symbols + words</p><label className={styles.check}><input type="checkbox" checked={unreadOnly} onChange={e => setUnreadOnly(e.target.checked)} /> Show unread only · Currently {unreadOnly ? 'on' : 'off'}</label><label className={styles.check}><input type="checkbox" checked={transactionAlerts} onChange={e => setTransactionAlerts(e.target.checked)} /> Transaction and safety alerts</label><label className={styles.check}><input type="checkbox" checked={promotions} onChange={e => setPromotions(e.target.checked)} /> Promotional updates</label><button className={styles.primary} onClick={() => setSaved(true)}>Save category preferences</button>{saved && <p className={styles.success} role="status">Preferences saved in this preview.</p>}</section>
        <section className={styles.card}><h2>Quiet, not disconnected</h2><p>Account security and essential order updates stay enabled. Optional promotions can be turned off in settings.</p><p>No notification asks for your card PIN, password or OTP. Always check the task reference inside KHUB.</p></section>
      </aside>
    </div>
    <button className={styles.backLink} onClick={onBack}>← Back to dashboard</button>
  </main>;
}
