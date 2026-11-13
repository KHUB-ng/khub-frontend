import React, { useEffect, useMemo, useState } from 'react';
import { CircleUserRound, PackageCheck, BriefcaseBusiness, Wallet, MessageCircle, Gift, LifeBuoy, Settings, Bell, LayoutDashboard, ChevronRight, ArrowUpRight, ShoppingCart, LogOut } from 'lucide-react';
import styles from './CustomerDashboard.module.css';
import { api } from './lib/api.js';

const navItems=[['Overview','dashboard',LayoutDashboard],['My Cart','cart',ShoppingCart],['Orders & bookings','orders',PackageCheck],['Applications','applications',BriefcaseBusiness],['Saved items','saved',Gift],['Wallet','wallet',Wallet],['Messages','messages',MessageCircle],['Referrals','referrals',Gift],['Notifications','notifications',Bell],['Profile','profile',CircleUserRound],['Support','support',LifeBuoy],['Settings','settings',Settings]];
const rows=value=>Array.isArray(value)?value:(value?.items||[]);
const date=value=>value?new Date(value).toLocaleDateString('en-NG'):'—';

export default function CustomerDashboard({user={},onNavigate=()=>{},cartCount=0,onLogout=()=>onNavigate('account')}) {
  const [active,setActive]=useState('dashboard');
  const [data,setData]=useState({orders:[],applications:[],rides:[],deliveries:[],wallet:null,unreadMessages:0,unreadNotifications:0});
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const firstName=(user.name||'there').trim().split(/\s+/)[0]||'there';

  useEffect(()=>{
    let activeRequest=true;
    Promise.allSettled([
      api.get('/orders'),api.get('/my/applications'),api.get('/rides/mine'),
      api.get('/deliveries/mine'),api.get('/wallet/'),api.get('/conversations'),
      api.get('/notifications/unread_count'),
    ]).then(results=>{
      if(!activeRequest)return;
      const value=index=>results[index].status==='fulfilled'?results[index].value:null;
      const orders=rows(value(0)).filter(item=>item.buyer_pid===user.pid);
      const conversations=rows(value(5));
      setData({
        orders,applications:rows(value(1)),rides:rows(value(2)),deliveries:rows(value(3)),wallet:value(4),
        unreadMessages:conversations.reduce((sum,item)=>sum+Number(item.unread_count||0),0),
        unreadNotifications:Number(value(6)?.unread_count||0),
      });
      if(results.every(item=>item.status==='rejected'))setError('Your dashboard could not retrieve account data from KHUB.');
    }).finally(()=>{if(activeRequest)setLoading(false);});
    return()=>{activeRequest=false;};
  },[user.pid]);

  const activeOrders=data.orders.filter(item=>['paid_escrow','delivered','dispute_open'].includes(item.status));
  const serviceOrders=data.orders.filter(item=>item.listing_vertical==='service');
  const activities=useMemo(()=>{
    const items=[
      ...data.orders.map(item=>({id:item.pid,title:item.listing_title,kind:item.listing_vertical==='service'?'Service order':'Marketplace order',status:item.status,amount:item.amount_display,date:item.created_at,action:'orders-bookings'})),
      ...data.rides.map(item=>({id:item.pid,title:'Ride · '+(item.status||''),kind:'Ride',status:item.status,amount:item.fare_display,date:item.created_at,action:'ride-tracking'})),
      ...data.deliveries.map(item=>({id:item.pid,title:'Delivery · '+(item.tracking_code||''),kind:'Delivery',status:item.status,amount:item.fee_display,date:item.created_at,action:'delivery-details'})),
      ...data.applications.map(item=>({id:item.pid,title:item.listing_title||'Job application',kind:'Job application',status:item.status,amount:'',date:item.created_at,action:'job-application'})),
    ];
    return items.sort((a,b)=>new Date(b.date||0)-new Date(a.date||0)).slice(0,6);
  },[data]);

  const go=id=>{
    if(id==='cart')onNavigate('cart');
    else if(id==='wallet')onNavigate('wallet');
    else if(id==='settings'||id==='profile')onNavigate('settings');
    else if(id==='messages')onNavigate('messages');
    else if(id==='support')onNavigate('support');
    else if(id==='notifications')onNavigate('notifications');
    else if(id==='orders')onNavigate('orders-bookings');
    else if(id==='referrals')onNavigate('referrals');
    else if(id==='applications')onNavigate('job-listings');
    else if(id==='saved')onNavigate('discover');
    else setActive(id);
  };

  return <div className={styles.dashboard}>
    <aside className={styles.sidebar} aria-label="Customer dashboard navigation">{navItems.map(([label,id,Icon])=><button key={id} className={styles.sideLink+(active===id?' '+styles.sideActive:'')} onClick={()=>go(id)} aria-current={active===id?'page':undefined}><Icon size={16}/><span>{label}{id==='cart'&&cartCount>0&&<span className={styles.cartBadge} aria-label={cartCount+' items in cart'}>{cartCount}</span>}</span></button>)}</aside>
    <main className={styles.content}>
      <button type="button" className={styles.dashboardLogout} onClick={onLogout}><LogOut size={16}/> Log out</button>
      <div className={styles.welcome}><h1>Welcome back, {firstName}.</h1><p>08 Role workspaces / User dashboard</p><span>Your KHUB account activity · {loading?'Refreshing live data…':'Live backend data'}</span></div>
      {error&&<p className={styles.panel} role="alert">{error}</p>}
      <section className={styles.metrics} aria-label="Account summary">
        <article><strong>{activeOrders.length}</strong><span>Active orders</span><small>Orders currently in escrow or dispute</small></article>
        <article><strong>{serviceOrders.length}</strong><span>Service orders</span><small>Service listings purchased through KHUB</small></article>
        <article><strong>{data.applications.length}</strong><span>Applications</span><small>Your submitted job applications</small></article>
        <article><strong>{data.wallet?.balance_display||'—'}</strong><span>Wallet available</span><small>Spendable backend wallet balance</small></article>
      </section>
      <div className={styles.columns}>
        <div className={styles.mainColumn}>
          <section className={styles.panel}><h2>Recent activity</h2>
            {activities.map(item=><article key={item.id}><h3>{item.title}</h3><p>{item.kind} · {item.status} · {item.amount||'—'} · {date(item.date)}</p><button className={styles.textLink} onClick={()=>onNavigate(item.action)}>Open activity</button></article>)}
            {!loading&&activities.length===0&&<p>No orders, rides, deliveries or applications have been recorded yet.</p>}
            <button className={styles.primary} onClick={()=>onNavigate('orders-bookings')}>View all activity</button>
          </section>
          <section className={styles.panel}><h2>Keep exploring</h2><p>Browse current listings, apply for jobs or find local services.</p><button className={styles.textLink} onClick={()=>onNavigate('shop')}>Shop listings</button><button className={styles.textLink} onClick={()=>onNavigate('services')}>Find services</button><button className={styles.textLink} onClick={()=>onNavigate('job-listings')}>Explore jobs</button></section>
        </div>
        <aside className={styles.rightColumn}>
          <section className={styles.panel+' '+styles.walletPanel}><h2>Your wallet</h2><h3>{data.wallet?.balance_display||'—'}</h3><p>Funding is processed through Flutterwave. Wallet payments and escrow are handled by KHUB.</p><button className={styles.primary} onClick={()=>onNavigate('wallet')}>Open wallet</button><button className={styles.textLink} onClick={()=>onNavigate('wallet')}>View transactions</button></section>
          <section className={styles.panel}><h2>Your inbox</h2><p>{data.unreadMessages} unread messages</p><p>{data.unreadNotifications} unread notifications</p><button className={styles.textLink} onClick={()=>onNavigate('messages')}>Open messages</button><button className={styles.textLink} onClick={()=>onNavigate('notifications')}>Open notifications <ArrowUpRight size={15}/></button></section>
          <section className={styles.panel}><h2>Account settings</h2><p>Keep your contact details and verification information up to date.</p><button className={styles.textLink} onClick={()=>onNavigate('settings')}>Edit profile <ChevronRight size={15}/></button></section>
        </aside>
      </div>
    </main>
  </div>;
}
