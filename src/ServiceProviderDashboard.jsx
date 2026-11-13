import React, { useCallback, useEffect, useState } from 'react';
import { Circle, CalendarDays, BriefcaseBusiness, Clock3, Wallet, Image, Star, MessageCircle, LifeBuoy, Settings, Menu, X, Bell, LogOut, Megaphone } from 'lucide-react';
import styles from './ServiceProviderDashboard.module.css';
import { api } from './lib/api.js';
import AdRequestPanel from './AdRequestPanel.jsx';

const rows=value=>Array.isArray(value)?value:(value?.items||[]);
const money=kobo=>'₦'+(Number(kobo||0)/100).toLocaleString('en-NG',{maximumFractionDigits:2});
const menuItems=[{label:'Overview',icon:Circle},{label:'Bookings',icon:CalendarDays},{label:'Projects',icon:BriefcaseBusiness},{label:'Availability',icon:Clock3},{label:'Service packages',icon:BriefcaseBusiness},{label:'Promotions',icon:Megaphone},{label:'Portfolio',icon:Image},{label:'Reviews',icon:Star},{label:'Storefront',icon:Image},{label:'Notifications',icon:Bell},{label:'Earnings & payouts',icon:Wallet},{label:'Messages',icon:MessageCircle},{label:'Support',icon:LifeBuoy},{label:'Settings',icon:Settings}];

export default function ServiceProviderDashboard({user={},onNavigate=()=>{},onLogout=()=>onNavigate('account')}) {
  const [active,setActive]=useState('Overview');
  const [mobileNav,setMobileNav]=useState(false);
  const [listings,setListings]=useState([]);
  const [orders,setOrders]=useState([]);
  const [wallet,setWallet]=useState(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const provider=user.businessName||user.studioName||user.name||'Service provider';

  const load=useCallback(async()=>{
    setLoading(true);setError('');
    try{
      const [listingRows,orderRows,walletSummary]=await Promise.all([api.get('/my/listings'),api.get('/orders'),api.get('/wallet/')]);
      setListings(rows(listingRows).filter(item=>item.vertical==='service'));
      setOrders(rows(orderRows?.sold).filter(item=>item.seller_pid===user.pid&&item.listing_vertical==='service'));
      setWallet(walletSummary);
    }catch(err){setError(err?.message||'Service-provider data could not be loaded.');}
    finally{setLoading(false);}
  },[user.pid]);
  useEffect(()=>{load();},[load]);

  const selectMenu=label=>{
    setActive(label);setMobileNav(false);setNotice('');
    if(label==='Settings')onNavigate('settings');
    else if(label==='Storefront')onNavigate('storefront');
    else if(label==='Messages')onNavigate('messages');
    else if(label==='Support')onNavigate('support');
    else if(label==='Notifications')onNavigate('notifications');
    else if(label==='Earnings & payouts')onNavigate('wallet');
    else if(label==='Bookings'||label==='Projects')onNavigate('orders-bookings');
    else if(label==='Service packages'||label==='Portfolio')onNavigate('seller-listing');
    else if(label==='Availability')setNotice('Time-slot availability is not yet exposed by the backend. Confirm requested dates and schedules with clients in KHUB messages.');
    else if(label==='Reviews')setNotice('Open an individual service listing to view its verified review endpoint.');
  };
  const activeOrders=orders.filter(item=>['paid_escrow','delivered','dispute_open'].includes(item.status));
  const revenue=orders.filter(item=>item.status==='completed').reduce((sum,item)=>sum+Number(item.seller_net_kobo||0),0);
  const awaiting=orders.filter(item=>item.status==='paid_escrow').length;

  return <div className={styles.shell}>
    <button className={styles.mobileMenu} onClick={()=>setMobileNav(!mobileNav)} aria-label="Toggle service-provider navigation">{mobileNav?<X size={20}/>:<Menu size={20}/>} Menu</button>
    <aside className={styles.sidebar} aria-label="Service provider navigation">{menuItems.map(({label,icon:Icon})=><button key={label} className={styles.navItem+(active===label?' '+styles.navActive:'')} onClick={()=>selectMenu(label)}><Icon size={13} strokeWidth={1.8}/><span>{label}</span></button>)}</aside>
    <main className={styles.main}>
      <button type="button" className={styles.dashboardLogout} onClick={onLogout}><LogOut size={16}/> Log out</button>
      <header className={styles.heading}><h1>A little structure. More good work.</h1><p>08 Role workspaces / Service-provider dashboard</p><p>{provider} · Live service workspace</p></header>
      {loading&&<p>Loading service-provider data…</p>}{error&&<p className={styles.payout} role="alert">{error}</p>}{notice&&<p className={styles.payout} role="status">{notice}</p>}
      <div className={styles.metrics}>
        <section className={styles.metric}><strong>{activeOrders.length}</strong><span>Active projects</span><small>Service orders in progress</small></section>
        <section className={styles.metric}><strong>{awaiting}</strong><span>Orders awaiting fulfilment</span><small>Paid into escrow</small></section>
        <section className={styles.metric}><strong>{money(revenue)}</strong><span>Settled earnings</span><small>Seller net after commission</small></section>
        <section className={styles.metric}><strong>{listings.length}</strong><span>Service listings</span><small>Published or draft listings</small></section>
      </div>
      <div className={styles.contentGrid}>
        <div className={styles.leftStack}>
          <section className={styles.card+' '+styles.week}><h2>Service listings</h2>{listings.map(item=><div className={styles.events} key={item.pid}><div><p>{item.title}</p><p>{item.category} · {item.location} · {item.status}</p><p>{item.price_display||'Contact provider'}</p></div></div>)}{!loading&&listings.length===0&&<p>You have not published a service listing yet.</p>}<button className={styles.primary} onClick={()=>onNavigate('seller-listing')}>Create service listing</button></section>
          <section className={styles.card+' '+styles.milestones}><h2>Active service orders</h2>{activeOrders.map(order=><div key={order.pid}><p>{order.listing_title} · {order.pid}</p><p>Status: {order.status} · Gross {order.amount_display} · Commission {money(order.commission_kobo)} · Seller net {money(order.seller_net_kobo)}</p><button className={styles.textLink} onClick={()=>onNavigate('orders-bookings')}>Open order activity</button></div>)}{!loading&&activeOrders.length===0&&<p>No active service orders.</p>}</section>
        </div>
        <aside className={styles.rightStack}>
          <section className={styles.card+' '+styles.availability}><h2>Scheduling</h2><p>KHUB currently uses authenticated chat for clients and providers to agree on service dates, time slots and scope.</p><button className={styles.primary} onClick={()=>onNavigate('messages')}>Open client messages</button></section>
          <section className={styles.card+' '+styles.earnings}><h2>Wallet balance</h2><h3>{wallet?.balance_display||money(wallet?.balance_kobo)}</h3><p>Withdrawals require verified KYC and are processed through the existing Flutterwave payout flow.</p><button className={styles.textLink} onClick={()=>onNavigate('wallet')}>View wallet and payouts</button></section>
        </aside>
      </div>
      {active==='Promotions'&&<AdRequestPanel verticals={['service']} placements={['services','home']}/>}
      <section className={styles.payout}><p>Live backend status<br/>Bookings, earnings and listings shown above come from the KHUB API. Availability calendars and automated time-slot reservations are not represented as active until their APIs are implemented.</p><button className={styles.textLink} onClick={load}>Refresh data</button></section>
    </main>
  </div>;
}
