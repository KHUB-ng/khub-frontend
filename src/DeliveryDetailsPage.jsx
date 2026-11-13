import React, { useEffect, useState } from 'react';
import { ArrowLeft, PackageCheck } from 'lucide-react';
import styles from './DeliveryDetailsPage.module.css';
import { api } from './lib/api.js';
import LiveMap from './LiveMap.jsx';

const rows=value=>Array.isArray(value)?value:(value?.items||[]);
const money=kobo=>'₦'+(Number(kobo||0)/100).toLocaleString('en-NG',{maximumFractionDigits:2});
const label=point=>point?.label||'Location not provided';

export default function DeliveryDetailsPage({onBack=()=>{},onNavigate=()=>{}}) {
  const [deliveries,setDeliveries]=useState([]);
  const [liveLocations,setLiveLocations]=useState({});
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  useEffect(()=>{let active=true;api.get('/deliveries/mine').then(value=>{if(active)setDeliveries(rows(value));}).catch(err=>{if(active)setError(err?.message||'Delivery records could not be loaded.');}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[]);
  useEffect(()=>{if(!deliveries.length)return undefined;let active=true;const poll=async()=>{const updates=await Promise.all(deliveries.filter(row=>!['delivered','cancelled','refunded'].includes(row.status)).map(async row=>{try{const value=await api.get('/deliveries/'+encodeURIComponent(row.pid)+'/location');return [row.pid,value?.location||null];}catch{return [row.pid,null];}}));if(active)setLiveLocations(old=>({...old,...Object.fromEntries(updates)}));};poll();const timer=window.setInterval(poll,5000);return()=>{active=false;window.clearInterval(timer);};},[deliveries]);
  return <main className={styles.page}>
    <div style={{marginBottom:18}}><button type="button" onClick={onBack} aria-label="Go back" style={{display:'inline-flex',alignItems:'center',gap:8,border:'1px solid #dce8df',background:'#fff',color:'#176b43',borderRadius:999,padding:'10px 16px',fontWeight:700,cursor:'pointer'}}><ArrowLeft size={14}/> Back</button></div>
    <header className={styles.heading}><h1>Delivery details and tracking.</h1><p>Live delivery records from your KHUB account.</p></header>
    {loading&&<p>Loading delivery records…</p>}{error&&<p className={styles.notice} role="alert">{error}</p>}
    {!loading&&!error&&deliveries.map(delivery=><section className={styles.card} key={delivery.pid}><div className={styles.status}><PackageCheck size={17}/> {delivery.status}</div><h2>{label(delivery.pickup)} → {label(delivery.dropoff)}</h2><p>Delivery reference · {delivery.pid}</p><p>Tracking code · {delivery.tracking_code||'Not available'}</p><p>Fee · {delivery.fee_display||money(delivery.fee_kobo)} · Platform commission {money(delivery.commission_kobo)} · Agent net {money(delivery.agent_net_kobo)}</p><p>Created · {delivery.created_at?new Date(delivery.created_at).toLocaleString('en-NG'):'—'}</p><h3>Delivery route</h3><LiveMap label="Delivery route map" origin={delivery.pickup} destination={delivery.dropoff}/><h3>Live rider location</h3>{liveLocations[delivery.pid]?<><LiveMap label="Live delivery rider location" latitude={liveLocations[delivery.pid].lat} longitude={liveLocations[delivery.pid].lng}/><p>Last update · {liveLocations[delivery.pid].seen_at?new Date(liveLocations[delivery.pid].seen_at).toLocaleTimeString('en-NG'):'Just now'}</p></>:<p>Live rider coordinates will appear here after an agent accepts and shares location. This view refreshes automatically.</p>}</section>)}
    {!loading&&!error&&deliveries.length===0&&<section className={styles.card}><h2>No delivery requests yet</h2><p>Request a delivery from the rides and logistics page.</p><button className={styles.primary} onClick={()=>onNavigate('ride-booking')}>Request delivery</button></section>}
    <button className={styles.back} onClick={onBack}>Back to activity</button>
  </main>;
}
