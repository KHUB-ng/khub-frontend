import React, { useState } from 'react';
import { Circle, MapPin, Clock3, ShieldCheck, CarFront, Settings, LifeBuoy, FileText, History, BriefcaseBusiness, Wallet, Menu, X, CheckCircle2, Phone, Navigation, Bell, LogOut } from 'lucide-react';
import styles from './DriverDashboard.module.css';

const menuItems = [
  { label: 'Today', icon: Circle }, { label: 'Ride requests', icon: Navigation }, { label: 'Active job', icon: BriefcaseBusiness },
  { label: 'Trip history', icon: History }, { label: 'Delivery jobs', icon: FileText }, { label: 'Earnings', icon: Wallet }, { label: 'Messages', icon: BriefcaseBusiness }, { label: 'Notifications', icon: Bell },
  { label: 'Vehicle & documents', icon: CarFront }, { label: 'Safety', icon: ShieldCheck }, { label: 'Support', icon: LifeBuoy }, { label: 'Settings', icon: Settings },
];

export default function DriverDashboard({ user = {}, onNavigate = () => {}, onLogout = () => onNavigate('account') }) {
  const [online, setOnline] = useState(true);
  const [busy, setBusy] = useState(true);
  const [arrived, setArrived] = useState(false);
  const [active, setActive] = useState('Today');
  const [mobileNav, setMobileNav] = useState(false);
  const firstName = (user.name || 'Chinedu Okeke').trim().split(/\s+/)[0];
  const driverName = user.name || 'Chinedu Okeke';
  const status = online ? (busy ? 'Online · Busy on trip' : 'Online · Available for requests') : 'Offline · Not accepting requests';

  const selectMenu = (label) => {
    setActive(label);
    setMobileNav(false);
    if (label === 'Settings') onNavigate('settings');
    if (label === 'Messages') onNavigate('messages');
    if (label === 'Support') onNavigate('support');
    if (label === 'Notifications') onNavigate('notifications');
    if (label === 'Ride requests' || label === 'Delivery jobs') onNavigate('ride-booking');
    if (label === 'Active job') onNavigate('ride-tracking');
    if (label === 'Trip history') onNavigate('orders-bookings');
    if (label === 'Earnings') onNavigate('wallet');
    if (label === 'Vehicle & documents') onNavigate('settings');
    if (label === 'Safety') onNavigate('support');
  };

  return <div className={styles.shell}>
    <button className={styles.mobileMenu} onClick={() => setMobileNav(!mobileNav)} aria-label="Toggle driver navigation">{mobileNav ? <X size={20}/> : <Menu size={20}/>} Menu</button>
    <aside className={`${styles.sidebar} ${mobileNav ? styles.sidebarOpen : ''}`} aria-label="Driver navigation">
      {menuItems.map(({label, icon: Icon}) => <button key={label} className={`${styles.navItem} ${active === label ? styles.navActive : ''}`} onClick={() => selectMenu(label)}><Icon size={13} strokeWidth={1.8}/><span>{label}</span></button>)}
    </aside>
    <main className={styles.main}>
      <button type="button" className={styles.dashboardLogout} onClick={onLogout}><LogOut size={16}/> Log out</button>
      <header className={styles.heading}><h1>Drive with a clear view.</h1><p>08 Role workspaces / Driver dashboard</p><p>{driverName} · Lagos · Toyota Corolla / KJA 482 GT</p></header>
      <div className={styles.topGrid}>
        <section className={`${styles.card} ${styles.availability}`}><h2>Your availability</h2><p className={styles.status}><span className={online ? styles.dot : styles.dotOff}/> {status}</p><p>{busy && online ? 'New ride requests paused until this trip ends.' : online ? 'You are visible to nearby riders and can receive new requests.' : 'You are offline and will not receive new requests.'}</p><div className={styles.actions}><button className={styles.primary} onClick={() => { setOnline(!online); if (!online) setBusy(false); }}>{online ? (busy ? 'Go offline after this trip' : 'Go offline') : 'Go online'}</button><button className={styles.textLink} onClick={() => setActive('Service area')}>View service area</button></div><p className={styles.note}>{online ? 'Offline state: no new requests; an active job stays visible and must be completed safely.' : 'You’re offline. No requests will be sent. Vehicle checks passed; go online when ready.'}</p></section>
        <section className={styles.card}><h2>Today’s earnings</h2><h3>₦24,600 net</h3><p>6 completed trips · 3h 42m online · Gross ₦30,750 less 20% fee ₦6,150</p><p className={styles.valid}><CheckCircle2 size={12}/> Documents valid · Next check 02 Dec</p></section>
      </div>
      <div className={styles.middleGrid}>
        <div className={styles.leftStack}>
          <section className={styles.mapCard} aria-label="Illustrative route map"><div className={styles.mapLabels}><strong>Lekki · Admiralty Way</strong><span>8.2 km · 24 min</span><strong>Victoria Island · Ozumba</strong></div><svg className={styles.route} viewBox="0 0 700 330" preserveAspectRatio="none" aria-hidden="true"><path d="M35 54 V116 H240 V174 H470 V228" fill="none" stroke="#123f32" strokeWidth="5" strokeLinejoin="miter"/><circle cx="35" cy="54" r="7" fill="#123f32" stroke="#fff" strokeWidth="3"/><circle cx="470" cy="228" r="7" fill="#123f32" stroke="#fff" strokeWidth="3"/><circle cx="240" cy="174" r="20" fill="#123f32"/><text x="240" y="178" fill="#fff" textAnchor="middle" fontSize="10">C O</text></svg></section>
          <p className={styles.caption}>Illustrative route, not a live map · Lagos</p>
          <section className={styles.card + ' ' + styles.activeRide}><h2>Active ride · KH-RD-5520</h2><p className={styles.status}><span className={styles.dot}/> {arrived ? 'Arrival confirmed' : 'Passenger onboard'}</p><h3>Tomi Adeyemi · Economy</h3><p>Pickup: 12 Admiralty Way, Lekki Phase 1</p><p>Drop-off: 18 Ozumba Mbadiwe Ave, Victoria Island</p><p>ETA 11:50 WAT · Rider estimate ₦5,200 · Net estimate ₦3,760 (₦4,700 fare less 20% fee)</p><div className={styles.actions}><button className={styles.primary} onClick={() => setArrived(true)} disabled={arrived}>{arrived ? 'Arrival confirmed' : 'Confirm arrival'}</button><button className={styles.textLink} onClick={() => window.alert('Demo: rider contact options would appear here.')}><Phone size={13}/> Contact rider</button></div></section>
        </div>
        <aside className={styles.rightStack}>
          <section className={styles.card}><h2>Request queue</h2><p><Clock3 size={12} className={styles.inlineIcon}/> {online && !busy ? 'Waiting for new requests' : 'No new requests while busy'}</p><p>Example next request preview · Not assigned</p><h3>Lekki → Ikoyi</h3><p>Pickup 1.4 km away · Estimated fare ₦6,400 · 27 min</p><button className={styles.textLink} onClick={() => setActive('Ride requests')}>Review when available</button></section>
          <section className={styles.card}><h2>Safety on every trip</h2><p>Pull over before using controls. Confirm rider identity at pickup and keep trip communication on KHUB.</p><button className={styles.textLink} onClick={() => setActive('Safety')}>Safety / emergency help</button></section>
          <section className={styles.stateCard}><p>State example · {online ? (busy ? 'Busy' : 'Online') : 'Offline'}<br/>{online ? 'Stay focused on your current trip. Requests and availability update here.' : 'You’re offline. No requests will be sent. Vehicle checks passed; go online when ready.'}</p><button className={styles.textLink} onClick={() => {setOnline(!online); if (!online) setBusy(false);}}>{online ? 'Go offline' : 'Go online'}</button></section>
        </aside>
      </div>
      <section className={`${styles.card} ${styles.history}`}><h2>Recent completed trips</h2><div><p>KH-RD-5518 · 10:24</p><p>Route: Yaba → Surulere <span>/</span> Gross fare: ₦4,800 <span>/</span> Net earnings: ₦3,840</p></div><div><p>KH-RD-5514 · 09:10</p><p>Route: Ikoyi → Lekki <span>/</span> Gross fare: ₦6,900 <span>/</span> Net earnings: ₦5,520</p></div><div><p>KH-RD-5510 · 08:12</p><p>Route: VI → Ikoyi <span>/</span> Gross fare: ₦5,200 <span>/</span> Net earnings: ₦4,160</p></div><p className={styles.historyNote}>Gross fare excludes buyer booking fees. Earnings remain pending until the trip is settled.</p></section>
    </main>
  </div>;
}
