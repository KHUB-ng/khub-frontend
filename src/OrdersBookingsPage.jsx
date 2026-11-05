import React, { useMemo, useState } from 'react';
import styles from './OrdersBookingsPage.module.css';

const records = [
 {id:'KH-10482',type:'Shopping',status:'Preparing · Paid',title:'Lounge chair + wireless headphones',provider:'Studio Nook / Sound House',detail:'2 items · ₦207,000 total',date:'Placed 11 Oct · Expected 13–15 Oct · Lekki, Lagos',kind:'Shopping',action:'View order detail'},
 {id:'KH-DL-8821',type:'Delivery',status:'◷ Pickup scheduled',title:'Brand samples for Bisi',provider:'Today 12:00–12:30 pickup · ₦3,000 · Lekki → VI',detail:'',date:'Pickup scheduled today',kind:'Delivery',action:'View delivery'},
 {id:'KH-SV-2041',type:'Services',status:'✓ Booking confirmed',title:'Ada Studio · Standard identity',provider:'Discovery call · 13 Oct, 10:00 WAT · ₦78,750 paid',detail:'',date:'13 Oct · 10:00 WAT',kind:'Services',action:'Open booking'},
 {id:'KH-RE-1089',type:'Rentals',status:'✓ Completed',title:'Projector · Weekend rental',provider:'03–04 Oct · ₦25,000 paid · Deposit returned',detail:'',date:'Completed 04 Oct',kind:'Rentals',action:'View receipt / review'},
 {id:'KH-RD-5520',type:'Rides',status:'● In progress',title:'Lekki → Victoria Island',provider:'Chinedu Okeke · Economy · ₦5,200 estimated · ETA 11:50',detail:'',date:'Active trip',kind:'Rides',action:'Track active trip'}
];
const tabs = ['All (5)','Shopping (1)','Services (1)','Rides (1)','Delivery (1)','Rentals (1)'];
export default function OrdersBookingsPage({onBack=()=>{}, onOpenOrder=()=>{}, onSupport=()=>{}, onNavigate=()=>{}}) {
 const [tab,setTab]=useState('All (5)'); const [query,setQuery]=useState(''); const [status,setStatus]=useState('All statuses'); const [dateRange,setDateRange]=useState('October 2026'); const [notice,setNotice]=useState('');
 const filtered=useMemo(()=>records.filter(r=> (tab==='All (5)' || r.type===tab.split(' (')[0]) && (`${r.id} ${r.title} ${r.provider} ${r.type}`).toLowerCase().includes(query.toLowerCase()) && (status==='All statuses'||r.status.toLowerCase().includes(status.toLowerCase())) && (dateRange!=='October 2026'||true)),[tab,query,status,dateRange]);
 const action=(r)=>{if(r.type==='Shopping') onOpenOrder(); else if(r.type==='Services') setNotice('Booking '+r.id+' selected. Booking details will open here when connected.'); else setNotice(`${r.action}: ${r.id}. Latest activity is shown in this workspace.`)};
 return <main className={styles.page}>
  <div className={styles.topBackRow}>
   <button type="button" className={styles.topBack} onClick={onBack} aria-label="Go back to the previous page">
    <span aria-hidden="true">←</span> Back
   </button>
  </div>
  <header className={styles.heading}><h1>All your plans, in one place.</h1><p>09 Personal hub / Orders and bookings</p><span>Shopping, services, rides and deliveries · Track what’s active and what’s complete.</span></header>
  <nav className={styles.tabs} aria-label="Activity categories">{tabs.map(t=><button key={t} className={tab===t?styles.activeTab:''} onClick={()=>setTab(t)}>{t}</button>)}</nav>
  <div className={styles.filters}><label>Search reference or provider<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search your activity" /></label><label>Status<select value={status} onChange={e=>setStatus(e.target.value)}><option>All statuses</option><option>Preparing</option><option>Paid</option><option>confirmed</option><option>Completed</option><option>progress</option><option>scheduled</option></select></label><label>Date range<select value={dateRange} onChange={e=>setDateRange(e.target.value)}><option>October 2026</option><option>September 2026</option><option>All dates</option></select></label></div>
  <div className={styles.layout}><div className={styles.mainCol}>{filtered.filter(r=>r.type!=='Delivery'&&r.type!=='Rentals').map(r=><section className={styles.card} key={r.id}><h2>{r.type} · {r.id}</h2><p className={styles.status}>{r.status}</p><h3>{r.title}</h3><p>{r.provider}{r.detail?` · ${r.detail}`:''}</p><p>{r.date}</p><div className={styles.actions}><button className={styles.primary} onClick={()=>action(r)}>{r.type==='Shopping'?'View order detail':r.type==='Services'?'Open booking':'Track active trip'}</button>{r.type==='Shopping'?<button className={styles.link} onClick={onSupport}>Contact support</button>:r.type==='Services'?<button className={styles.link} onClick={()=>setNotice('Provider messaging for '+r.id+' selected.')}>Message provider</button>:null}</div></section>)}{!filtered.some(r=>['Shopping','Services','Rides'].includes(r.type))&&<section className={styles.card}><h2>No matching activity</h2><p>Try another category, status, or search term.</p></section>}</div>
  <aside className={styles.sideCol}>{filtered.filter(r=>r.type==='Delivery'||r.type==='Rentals').map(r=><section className={styles.card} key={r.id}><h2>{r.type==='Rentals'?'Rental':'Delivery'} · {r.id}</h2><p className={styles.status}>{r.status}</p><h3>{r.title}</h3><p>{r.provider}</p><button className={styles.link} onClick={()=>action(r)}>{r.action}</button></section>)}<section className={styles.tip}><strong>State example · No rental bookings</strong><p>You haven’t made a rental booking in this date range. Reset your date filter to see older bookings.</p><button className={styles.link} onClick={()=>{setDateRange('All dates');setTab('All (5)');}}>Reset date filter</button></section><section className={styles.tip}><strong>Loading example · Checking updates</strong><p>Refreshing seller dispatch and provider availability. Existing records stay visible; no duplicate booking is created.</p></section></aside></div>
  {notice&&<div className={styles.notice} role="status">{notice}<button onClick={()=>setNotice('')}>Dismiss</button></div>}
  <button className={styles.back} onClick={onBack}>← Back to dashboard</button>
 </main>
}
