import React, { useEffect, useMemo, useState } from 'react';
import styles from './NotificationsPage.module.css';
import { api } from './lib/api.js';

const categories = ['All','Orders','Services','Jobs','Rides','Delivery','Wallet','Account'];
const categoryFor = kind => {
  const value = String(kind || '').toLowerCase();
  if (value.includes('order')) return 'Orders';
  if (value.includes('service')) return 'Services';
  if (value.includes('job') || value.includes('application')) return 'Jobs';
  if (value.includes('ride')) return 'Rides';
  if (value.includes('deliver')) return 'Delivery';
  if (value.includes('wallet') || value.includes('withdraw') || value.includes('payment')) return 'Wallet';
  return 'Account';
};
const day = value => value ? new Date(value).toLocaleDateString('en-NG',{weekday:'long',day:'numeric',month:'long',year:'numeric'}) : 'Earlier';

export default function NotificationsPage({ onBack = () => {}, onNavigate = () => {} }) {
  const [items,setItems]=useState([]);
  const [category,setCategory]=useState('All');
  const [unreadOnly,setUnreadOnly]=useState(false);
  const [unreadCount,setUnreadCount]=useState(0);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');

  const load = async () => {
    setLoading(true);setError('');
    try {
      const [rows,count] = await Promise.all([api.get('/notifications?limit=50'),api.get('/notifications/unread_count')]);
      const list=Array.isArray(rows)?rows:rows?.items||[];
      setItems(list.map(item=>({...item,category:categoryFor(item.kind),unread:!item.read_at})));
      setUnreadCount(Number(count?.unread_count||0));
    } catch(err){setError(err?.message||'Notifications could not be loaded.');}
    finally{setLoading(false);}
  };
  useEffect(()=>{load();},[]);

  const visible=useMemo(()=>items.filter(item=>(category==='All'||item.category===category)&&(!unreadOnly||item.unread)),[items,category,unreadOnly]);
  const grouped=useMemo(()=>visible.reduce((acc,item)=>{const key=day(item.created_at);(acc[key] ||= []).push(item);return acc;},{}),[visible]);
  const markAll=async()=>{try{await api.post('/notifications/read_all',{});await load();}catch(err){setError(err?.message||'Could not mark notifications as read.');}};
  const markRead=async pid=>{try{await api.post('/notifications/'+encodeURIComponent(pid)+'/read',{});setItems(prev=>prev.map(item=>item.pid===pid?{...item,unread:false,read_at:new Date().toISOString()}:item));setUnreadCount(n=>Math.max(0,n-1));}catch(err){setError(err?.message||'Could not mark notification as read.');}};
  const openItem=async item=>{
    if(item.unread) await markRead(item.pid);
    if(item.ref_table==='orders')onNavigate('orders');
    else if(item.ref_table==='rides')onNavigate('ride-tracking');
    else if(item.ref_table==='deliveries')onNavigate('delivery-details');
    else if(item.kind?.includes('chat'))onNavigate('messages');
    else onNavigate('orders-bookings');
  };

  return <main className={styles.page}>
    <div style={{marginBottom:18}}><button type="button" onClick={onBack} aria-label="Go back" style={{display:'inline-flex',alignItems:'center',gap:8,border:'1px solid #dce8df',background:'#fff',color:'#176b43',borderRadius:999,padding:'10px 16px',fontWeight:700,cursor:'pointer'}}>← Back</button></div>
    <header className={styles.heading}><h1>The updates that matter.</h1><p>Personal hub / Notifications</p><span>{unreadCount} unread notifications · Live updates from KHUB.</span></header>
    <nav className={styles.tabs} aria-label="Notification categories">{categories.map(name=><button key={name} className={category===name?styles.activeTab:''} onClick={()=>setCategory(name)}>{name}</button>)}</nav>
    <div className={styles.actions}><label className={styles.check}><input type="checkbox" checked={unreadOnly} onChange={e=>setUnreadOnly(e.target.checked)}/> Show unread only</label><button className={styles.link} onClick={markAll}>Mark all as read</button><button className={styles.link} onClick={load}>Refresh</button></div>
    {loading&&<section className={styles.card}>Loading notifications…</section>}
    {error&&<section className={styles.card} role="alert">{error}</section>}
    {!loading&&!error&&<div className={styles.layout}><div className={styles.feed}>
      {Object.entries(grouped).map(([dateLabel,rows])=><section className={styles.card} key={dateLabel}><h2>{dateLabel}</h2>{rows.map(item=><article className={styles.notification} key={item.pid}><p className={styles.status}>{item.unread?'● Unread':'✓ Read'} · {item.category}</p><h3>{item.title}</h3><p>{item.body||''}</p><small>{new Date(item.created_at).toLocaleString('en-NG')}</small><button className={styles.link} onClick={()=>openItem(item)}>Open update</button></article>)}</section>)}
      {visible.length===0&&<section className={styles.card}><h2>No notifications</h2><p>There are no notifications matching this filter.</p></section>}
    </div><aside className={styles.sidebar}><section className={styles.card}><h2>Notification controls</h2><p>Essential account, safety and transaction notifications are delivered by the backend.</p><p>Notification category preferences are not yet exposed by the current API.</p><button className={styles.primary} onClick={load}>Refresh notification feed</button></section><section className={styles.card}><h2>Security reminder</h2><p>KHUB never requests your password, card PIN or OTP through a notification or chat message.</p></section></aside></div>}
    <button className={styles.backLink} onClick={onBack}>← Back to dashboard</button>
  </main>;
}
