import React, { useCallback, useEffect, useState } from 'react';
import styles from './SellerDashboard.module.css';
import { api } from './lib/api.js';

const money = kobo => '₦' + (Number(kobo||0)/100).toLocaleString('en-NG',{maximumFractionDigits:2});
const rows = value => Array.isArray(value)?value:(value?.items||[]);

export default function SellerDashboard({ user, onNavigate, onLogout=()=>onNavigate?.('account') }) {
  const [listings,setListings]=useState([]);
  const [orders,setOrders]=useState([]);
  const [wallet,setWallet]=useState(null);
  const [tab,setTab]=useState('Overview');
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState('');
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const nav=['Overview','Inventory','Orders','Fulfilment','Storefront','Promotions','Revenue & payouts','Messages','Notifications','Verification','Support','Settings'];

  const load=useCallback(async()=>{
    setLoading(true);setError('');
    try{
      const [myListings,allOrders,walletSummary]=await Promise.all([api.get('/my/listings'),api.get('/orders'),api.get('/wallet/')]);
      setListings(rows(myListings));
      setOrders(rows(allOrders).filter(order=>order.seller_pid===user?.pid));
      setWallet(walletSummary);
    }catch(err){setError(err?.message||'Seller data could not be loaded.');}
    finally{setLoading(false);}
  },[user?.pid]);
  useEffect(()=>{load();},[load]);

  const handleNav=item=>{
    setTab(item);
    if(item==='Settings'||item==='Verification')onNavigate?.('settings');
    else if(item==='Storefront')onNavigate?.('storefront');
    else if(item==='Promotions')setNotice('Paid promotions are not available in the current backend API.');
    else if(item==='Support')onNavigate?.('support');
    else if(item==='Notifications')onNavigate?.('notifications');
    else if(item==='Messages')onNavigate?.('messages');
    else if(item==='Orders'||item==='Fulfilment')onNavigate?.('orders-bookings');
    else if(item==='Revenue & payouts')onNavigate?.('wallet');
    else if(item==='Inventory')onNavigate?.('seller-listing');
    else setNotice('');
  };

  const markDelivered=async order=>{
    if(!window.confirm('Confirm that this order has actually been dispatched or delivered according to your order terms?'))return;
    setBusy(order.pid);setError('');setNotice('');
    try{await api.post('/orders/'+encodeURIComponent(order.pid)+'/deliver',{});setNotice('Order delivery status updated by KHUB.');await load();}
    catch(err){setError(err?.message||'Order could not be marked as delivered.');}
    finally{setBusy('');}
  };

  const activeOrders=orders.filter(order=>['paid_escrow','delivered','dispute_open'].includes(order.status));
  const revenue=orders.filter(order=>order.status==='completed').reduce((sum,order)=>sum+Number(order.seller_net_kobo||0),0);
  const escrow=activeOrders.reduce((sum,order)=>sum+Number(order.seller_net_kobo||0),0);
  const liveListings=listings.filter(item=>['active','live','published'].includes(String(item.status||'').toLowerCase()));

  return <div className={styles.shell}>
    <aside className={styles.sidebar}>{nav.map((item,i)=><button key={item} onClick={()=>handleNav(item)} className={tab===item?styles.activeNav:styles.navItem}>{i===0?'◉ ':''}{item}</button>)}</aside>
    <main className={styles.main}>
      <button type="button" className={styles.dashboardLogout} onClick={onLogout}>↪ Log out</button>
      <header className={styles.heading}><h1>Make room for good business.</h1><p>08 Role workspaces / Seller dashboard<br/>{user?.name||'Seller account'} · Live seller workspace</p></header>
      {loading&&<p>Loading seller data…</p>}{error&&<p className={styles.alert} role="alert">{error}</p>}{notice&&<p className={styles.alert} role="status">{notice}</p>}
      <section className={styles.stats}>
        {[[money(revenue),'Settled seller net','Completed orders after commission'],[activeOrders.length,'Orders in progress','Paid or awaiting completion'],[liveListings.length,'Live listings','Published marketplace listings'],[money(escrow),'Seller net in escrow','Not available until completion']].map(([value,label,description])=><article className={styles.stat} key={label}><strong>{value}</strong><span>{label}</span><small>{description}</small></article>)}
      </section>
      <div className={styles.columns}><div className={styles.left}>
        <section className={styles.card}><h2>Seller wallet</h2><h3>{wallet?.balance_display||money(wallet?.balance_kobo)}</h3><p>Available wallet balance from the backend ledger. Withdrawals require verified KYC and approved payout requests.</p><button className={styles.inlineLink} onClick={()=>onNavigate?.('wallet')}>Open wallet and payouts</button></section>
        <section className={styles.card}><h2>Fulfilment queue</h2>{activeOrders.map(order=><div className={styles.order} key={order.pid}><p>{order.pid} · {order.listing_title} × {order.quantity}</p><p>Gross {order.amount_display||money(order.amount_kobo)} · Commission {money(order.commission_kobo)} · Seller net {money(order.seller_net_kobo)} · {order.status}</p>{order.status==='paid_escrow'&&<button className={styles.inlineLink} disabled={busy===order.pid} onClick={()=>markDelivered(order)}>{busy===order.pid?'Updating…':'Mark dispatched / delivered'}</button>}</div>)}{!loading&&activeOrders.length===0&&<p>No orders are awaiting fulfilment.</p>}</section>
      </div><aside className={styles.right}>
        <section className={styles.card}><h2>Inventory snapshot</h2>{listings.slice(0,6).map(item=><div className={styles.inventoryRow} key={item.pid}><p>{item.title}</p><p>{item.category||item.vertical} · {item.status} · {item.price_display||money(item.price_kobo)}</p></div>)}{!loading&&listings.length===0&&<p>You have not published a listing yet.</p>}<button className={styles.primary} onClick={()=>onNavigate?.('seller-listing')}>Create a listing</button></section>
        <section className={styles.card}><h2>Account verification</h2><p>Check your seller KYC status and upload any documents requested by KHUB.</p><button className={styles.inlineLink} onClick={()=>onNavigate?.('settings')}>Open verification settings</button></section>
      </aside></div>
      <section className={styles.alert}><p>Live seller data</p><p>Order totals, commission and seller net are returned by the backend. Inventory stock editing, paid promotions and advanced revenue charts are not shown as completed until their APIs are available.</p><button className={styles.inlineLink} onClick={load}>Refresh seller data</button></section>
    </main>
  </div>;
}
