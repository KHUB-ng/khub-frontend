import React, { useState } from 'react';
import { Circle, CalendarDays, BriefcaseBusiness, Clock3, Wallet, Image, Star, MessageCircle, LifeBuoy, Settings, Menu, X, CheckCircle2, Bell, LogOut } from 'lucide-react';
import styles from './ServiceProviderDashboard.module.css';

const menuItems = [
  { label: 'Overview', icon: Circle }, { label: 'Bookings', icon: CalendarDays }, { label: 'Projects', icon: BriefcaseBusiness },
  { label: 'Availability', icon: Clock3 }, { label: 'Service packages', icon: BriefcaseBusiness }, { label: 'Portfolio', icon: Image },
  { label: 'Reviews', icon: Star }, { label: 'Storefront', icon: Image }, { label: 'Notifications', icon: Bell }, { label: 'Earnings & payouts', icon: Wallet }, { label: 'Messages', icon: MessageCircle },
  { label: 'Support', icon: LifeBuoy }, { label: 'Settings', icon: Settings },
];

export default function ServiceProviderDashboard({ user = {}, onNavigate = () => {}, onLogout = () => onNavigate('account') }) {
  const [active, setActive] = useState('Overview');
  const [mobileNav, setMobileNav] = useState(false);
  const [accepting, setAccepting] = useState(true);
  const [day, setDay] = useState('Tue 13');
  const [blocked, setBlocked] = useState(false);
  const provider = user.businessName || user.studioName || 'Ada Studio';
  const selectMenu = (label) => {
    setActive(label); setMobileNav(false);
    if (label === 'Settings') onNavigate('settings');
    if (label === 'Storefront') { onNavigate('storefront'); return; }
    if (label === 'Messages') { onNavigate('messages'); return; }
    if (label === 'Support') { onNavigate('support'); return; }
    if (label === 'Notifications') { onNavigate('notifications'); return; }
    if (label === 'Earnings & payouts') { onNavigate('wallet'); return; }
    if (label === 'Bookings' || label === 'Projects') { onNavigate('orders-bookings'); return; }
    if (label === 'Service packages' || label === 'Portfolio') { onNavigate('seller-listing'); return; }
    if (label === 'Reviews') setActive('Reviews');
  };
  return <div className={styles.shell}>
    <button className={styles.mobileMenu} onClick={() => setMobileNav(!mobileNav)} aria-label="Toggle service-provider navigation">{mobileNav ? <X size={20}/> : <Menu size={20}/>} Menu</button>
    <aside className={`${styles.sidebar} ${mobileNav ? styles.sidebarOpen : ''}`} aria-label="Service provider navigation">
      {menuItems.map(({label, icon: Icon}) => <button key={label} className={`${styles.navItem} ${active === label ? styles.navActive : ''}`} onClick={() => selectMenu(label)}><Icon size={13} strokeWidth={1.8}/><span>{label}</span></button>)}
    </aside>
    <main className={styles.main}>
      <button type="button" className={styles.dashboardLogout} onClick={onLogout}><LogOut size={16}/> Log out</button>
      <header className={styles.heading}><h1>A little structure. More good work.</h1><p>08 Role workspaces / Service-provider dashboard</p><p>{provider} · Identity verified · Service-provider workspace</p></header>
      <div className={styles.metrics}>
        <section className={styles.metric}><strong>4</strong><span>Active projects</span><small>2 deliveries this week</small></section>
        <section className={styles.metric}><strong>3</strong><span>New bookings</span><small>1 brief needs review</small></section>
        <section className={styles.metric}><strong>₦285,000</strong><span>Earnings · Oct</span><small>Net after platform fees</small></section>
        <section className={styles.metric}><strong>98%</strong><span>Response rate</span><small>Usually within 2 hours</small></section>
      </div>
      <div className={styles.contentGrid}>
        <div className={styles.leftStack}>
          <section className={styles.card + ' ' + styles.week}><h2>Your week at a glance</h2><div className={styles.days}>{['Mon 12','Tue 13','Wed 14','Thu 15','Fri 16'].map(d=><button key={d} className={day===d?styles.dayActive:styles.day} onClick={()=>setDay(d)}>{d}</button>)}</div><div className={styles.events}>{day==='Tue 13' ? <><div><p>10:00 · ÌRÈ Wellness discovery</p><p>Tomi Adeyemi · KH-SV-2041 · Standard · 30-minute call</p><p><CheckCircle2 size={12}/> Confirmed</p></div><div><p>14:00 · NOOK packaging review</p><p>Femi Bakare · KH-SV-2028 · Launch · Revision 2</p><p><span className={styles.dot}/> In progress</p></div></> : <div><p>{day.split(' ')[0]} · Schedule overview</p><p>No other confirmed appointments are shown for this day.</p></div>}</div><button className={styles.textLink} onClick={()=>setActive('Bookings')}>Manage calendar</button></section>
          <section className={styles.card + ' ' + styles.milestones}><h2>Project milestones</h2><div><p>ÌRÈ Wellness · Tomi</p><p>Package / value: Standard · ₦75,000 <span>/</span> Next milestone: Brief review · 13 Oct <span>/</span> Action: Review brief</p></div><div><p>NOOK · Femi</p><p>Package / value: Launch · ₦120,000 <span>/</span> Next milestone: Revision 2 · 14 Oct <span>/</span> Action: Upload draft</p></div><div><p>ÒRÍ · Amaka</p><p>Package / value: Essential · ₦45,000 <span>/</span> Next milestone: Handover · 15 Oct <span>/</span> Action: Deliver files</p></div></section>
        </div>
        <aside className={styles.rightStack}>
          <section className={styles.card + ' ' + styles.availability}><h2>Availability</h2><p><CheckCircle2 size={12}/> {accepting && !blocked ? 'Accepting new bookings' : 'Not accepting new bookings'}</p><div className={styles.infoBox}>Working hours · WAT<br/>Mon–Fri · 09:00–17:00</div><div className={styles.infoBox}>Next available start<br/>13 October 2026</div><p className={styles.pause}><Circle size={12}/> {blocked ? 'Blocked time is active' : 'Pause new bookings · Currently off'}</p><button className={styles.primary} onClick={()=>{setAccepting(!accepting);setActive('Availability')}}>{accepting?'Edit availability':'Accept bookings'}</button><button className={styles.textLink} onClick={()=>{setBlocked(!blocked);setActive('Availability')}}>{blocked?'Remove blocked time':'Block time'}</button></section>
          <section className={styles.card + ' ' + styles.earnings}><h2>Earnings to settle</h2><h3>₦71,250 pending</h3><p>Standard package ₦75,000 less 5% provider fee ₦3,750. Buyer platform fee is separate. Release follows client acceptance.</p><button className={styles.textLink} onClick={()=>selectMenu('Earnings & payouts')}>View earnings ledger</button></section>
        </aside>
      </div>
      <section className={styles.payout}><p>State example · Payout pending<br/>Withdrawal KH-WD-2281 is processing with your bank. It is not available to withdraw again. Expected update within 1 business day; use the same reference when contacting support.</p><button className={styles.textLink} onClick={()=>window.alert('Demo payout status: KH-WD-2281 is processing.')}>Check payout status</button></section>
    </main>
  </div>;
}
