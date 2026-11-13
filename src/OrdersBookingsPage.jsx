import React, { useEffect, useMemo, useState } from 'react';
import styles from './OrdersBookingsPage.module.css';
import { api } from './lib/api.js';

const money = kobo => '₦' + (Number(kobo || 0) / 100).toLocaleString('en-NG', { maximumFractionDigits: 2 });
const date = value => value ? new Date(value).toLocaleString('en-NG') : '—';
const label = point => point?.label || point?.address || 'Location not provided';

export default function OrdersBookingsPage({ onBack=()=>{}, onOpenOrder=()=>{}, onSupport=()=>{}, onNavigate=()=>{} }) {
  const [records, setRecords] = useState([]);
  const [tab, setTab] = useState('All');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All statuses');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.allSettled([api.get('/orders'), api.get('/rides/mine'), api.get('/deliveries/mine')])
      .then(results => {
        if (!active) return;
        const [ordersResult, ridesResult, deliveriesResult] = results;
        const rows = [];
        if (ordersResult.status === 'fulfilled') {
          const orders = Array.isArray(ordersResult.value) ? ordersResult.value : ordersResult.value?.items || [];
          orders.forEach(order => rows.push({
            id: order.pid, pid: order.pid,
            type: ({ product: 'Shopping', service: 'Services', rental: 'Rentals', job: 'Jobs' })[order.listing_vertical] || 'Orders',
            status: order.status, title: order.listing_title, provider: 'KHUB order',
            amount: order.amount_display || money(order.amount_kobo),
            detail: order.quantity + ' item(s) · Commission ' + money(order.commission_kobo),
            date: date(order.created_at), action: 'View order',
          }));
        }
        if (ridesResult.status === 'fulfilled') {
          const rides = Array.isArray(ridesResult.value) ? ridesResult.value : ridesResult.value?.items || [];
          rides.forEach(ride => rows.push({
            id: ride.pid, pid: ride.pid, type: 'Rides', status: ride.status,
            title: label(ride.pickup) + ' → ' + label(ride.dest),
            provider: ride.driver_pid ? 'Assigned driver' : 'Awaiting driver',
            amount: ride.fare_display || money(ride.fare_kobo),
            detail: 'Driver net ' + money(ride.driver_net_kobo) + ' · Platform fee ' + money(ride.commission_kobo),
            date: date(ride.created_at), action: 'Track ride',
          }));
        }
        if (deliveriesResult.status === 'fulfilled') {
          const deliveries = Array.isArray(deliveriesResult.value) ? deliveriesResult.value : deliveriesResult.value?.items || [];
          deliveries.forEach(delivery => rows.push({
            id: delivery.pid, pid: delivery.pid, type: 'Delivery', status: delivery.status,
            title: label(delivery.pickup) + ' → ' + label(delivery.dropoff),
            provider: delivery.tracking_code || 'Delivery request',
            amount: delivery.fee_display || money(delivery.fee_kobo),
            detail: 'Agent net ' + money(delivery.agent_net_kobo) + ' · Platform fee ' + money(delivery.commission_kobo),
            date: date(delivery.created_at), action: 'Track delivery',
          }));
        }
        setRecords(rows.sort((a,b)=>new Date(b.date)-new Date(a.date)));
        setError(results.every(result => result.status === 'rejected') ? 'Your activity could not be loaded from the KHUB API.' : '');
      }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const categories = ['All','Shopping','Services','Rentals','Jobs','Rides','Delivery'];
  const counts = Object.fromEntries(categories.map(name=>[name,name==='All'?records.length:records.filter(row=>row.type===name).length]));
  const visible = useMemo(()=>records.filter(row=>(tab==='All'||row.type===tab)&&([row.id,row.title,row.provider,row.type].join(' ').toLowerCase().includes(query.toLowerCase()))&&(status==='All statuses'||row.status.toLowerCase().includes(status.toLowerCase()))),[records,tab,query,status]);
  const action = row => {
    if(['Shopping','Services','Rentals','Jobs'].includes(row.type)) onNavigate('orders');
    else if(row.type==='Rides') onNavigate('ride-tracking');
    else if(row.type==='Delivery') onNavigate('delivery-details');
  };

  return <main className={styles.page}>
    <div className={styles.topBackRow}><button type="button" className={styles.topBack} onClick={onBack}>← Back</button></div>
    <header className={styles.heading}><h1>All your plans, in one place.</h1><p>09 Personal hub / Orders and bookings</p><span>Live order, ride and delivery activity from your KHUB account.</span></header>
    <nav className={styles.tabs} aria-label="Activity categories">{categories.map(name=><button key={name} className={tab===name?styles.activeTab:''} onClick={()=>setTab(name)}>{name} ({counts[name]})</button>)}</nav>
    <div className={styles.filters}><label>Search reference or provider<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search your activity"/></label><label>Status<select value={status} onChange={e=>setStatus(e.target.value)}><option>All statuses</option><option>paid_escrow</option><option>completed</option><option>dispute_open</option><option>requested</option><option>in_transit</option><option>delivered</option><option>cancelled</option></select></label></div>
    {loading&&<section className={styles.card}>Loading your KHUB activity…</section>}
    {error&&<section className={styles.card} role="alert">{error}</section>}
    {!loading&&!error&&<div className={styles.layout}><div className={styles.mainCol}>
      {visible.map(row=><section className={styles.card} key={row.id}><h2>{row.type} · {row.id}</h2><p className={styles.status}>{row.status}</p><h3>{row.title}</h3><p>{row.provider} · {row.amount}</p><p>{row.detail} · {row.date}</p><div className={styles.actions}><button className={styles.primary} onClick={()=>action(row)}>{row.action}</button>{row.type==='Shopping'&&<button className={styles.link} onClick={onSupport}>Contact support</button>}</div></section>)}
      {visible.length===0&&<section className={styles.card}><h2>No matching activity</h2><p>Your KHUB account has no records matching this filter.</p></section>}
    </div><aside className={styles.sideCol}><section className={styles.tip}><strong>Escrow protection</strong><p>Orders and rides remain in escrow until their backend completion rules are met. Do not confirm completion if there is an unresolved issue.</p><button className={styles.link} onClick={()=>onNavigate('wallet')}>Open wallet</button></section><section className={styles.tip}><strong>Need help?</strong><p>Contact support with the exact order, ride or delivery reference.</p><button className={styles.link} onClick={onSupport}>Contact support</button></section></aside></div>}
    <button className={styles.back} onClick={onBack}>← Back to dashboard</button>
  </main>;
}
