import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, RefreshCw, Share2, LifeBuoy } from 'lucide-react';
import styles from './RideTrackingPage.module.css';
import { api } from './lib/api.js';
import LiveMap from './LiveMap.jsx';

const money=kobo=>'₦'+(Number(kobo||0)/100).toLocaleString('en-NG',{maximumFractionDigits:2});
const label=point=>point?.label||'Location not available';

export default function RideTrackingPage({user={},ridePid,onBack=()=>{},onNavigate=()=>{}}) {
  const [ride,setRide]=useState(null);
  const [liveLocation,setLiveLocation]=useState(null);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [rating,setRating]=useState('5');
  const [comment,setComment]=useState('');

  const load=useCallback(async()=>{
    setLoading(true);setError('');
    try{
      let selected;
      if(ridePid)selected=await api.get('/rides/'+encodeURIComponent(ridePid));
      else{
        const rows=await api.get('/rides/mine');
        const list=Array.isArray(rows)?rows:rows?.items||[];
        selected=list.find(item=>['requested','accepted','arriving','started','dispute_open'].includes(item.status))||list[0];
      }
      setRide(selected||null);
    }catch(err){setError(err?.message||'Ride tracking information could not be loaded.');}
    finally{setLoading(false);}
  },[ridePid]);
  useEffect(()=>{load();},[load]);

  useEffect(()=>{
    if(!ride?.pid || ['completed','cancelled','refunded'].includes(ride.status)) return undefined;
    let active=true;
    const poll=async()=>{try{const value=await api.get('/rides/'+encodeURIComponent(ride.pid)+'/location');if(active){setLiveLocation(value?.location||null);if(value?.status&&value.status!==ride.status)setRide(current=>current?{...current,status:value.status}:current);}}catch{/* Keep the last known location during brief network interruptions. */}};
    poll();
    const timer=window.setInterval(poll,5000);
    return()=>{active=false;window.clearInterval(timer);};
  },[ride?.pid,ride?.status]);

  const action=async(kind,payload={})=>{
    if(!ride?.pid)return;
    setBusy(true);setError('');setNotice('');
    try{const result=await api.post('/rides/'+encodeURIComponent(ride.pid)+'/'+kind,payload);setNotice('Your request was recorded by KHUB.');if(result?.pid)setRide(result);else await load();}
    catch(err){setError(err?.message||'This ride action could not be completed.');}
    finally{setBusy(false);}
  };
  const share=async()=>{
    if(!ride)return;
    const text='KHUB ride '+ride.pid+' · '+label(ride.pickup)+' to '+label(ride.dest)+' · Status: '+ride.status;
    try{if(navigator.share)await navigator.share({title:'KHUB trip details',text});else{await navigator.clipboard.writeText(text);setNotice('Trip reference and route copied.');}}
    catch(err){if(err?.name!=='AbortError')setNotice(text);}
  };

  return <main className={styles.page}>
    <header className={styles.heading}><h1>Ride status and trip details.</h1><p>06 Rides and logistics / Your trip</p><p>Authenticated ride record · {ride?.pid||'No active ride selected'}</p></header>
    {loading&&<p>Loading ride details…</p>}{error&&<div className={styles.notice} role="alert">{error}</div>}{notice&&<div className={styles.notice} role="status">{notice}</div>}
    {!loading&&ride&&<div className={styles.layout}>
      <div className={styles.leftColumn}>
        <section className={styles.card}><h2>Live driver map</h2><LiveMap label="Live driver location" latitude={liveLocation?.lat ?? ride.pickup?.lat} longitude={liveLocation?.lng ?? ride.pickup?.lng} query={!liveLocation&&!ride.pickup?.lat?label(ride.pickup):undefined}/><p>{liveLocation?.seen_at?`Last location update · ${new Date(liveLocation.seen_at).toLocaleTimeString('en-NG')}`:'Waiting for the driver to share a live location. Location updates refresh automatically.'}</p></section>
        <section className={styles.card+' '+styles.arrival}><h2>{ride.status==='completed'?'Trip completed':ride.status==='cancelled'?'Trip cancelled':'Your trip status'}</h2><p className={styles.status}><CheckCircle2 size={14}/> {ride.status}</p><h3>{label(ride.dest)}</h3><p>Pickup · {label(ride.pickup)}</p><p>Destination · {label(ride.dest)}</p><p>Distance · {(Number(ride.distance_m||0)/1000).toFixed(2)} km</p><p>Fare · {ride.fare_display||money(ride.fare_kobo)}</p><p>Platform commission · {money(ride.commission_kobo)} · Driver net · {money(ride.driver_net_kobo)}</p><p>Created · {ride.created_at?new Date(ride.created_at).toLocaleString('en-NG'):'—'}</p></section>
        <section className={styles.safety}><strong>Safety and support</strong><p>Use the ride reference when contacting support. KHUB support is not an emergency service.</p><button className={styles.link} onClick={share}><Share2 size={14}/> Share trip details</button></section>
      </div>
      <aside className={styles.rightColumn}>
        <section className={styles.card}><h2>Available actions</h2>{ride.status==='requested'&&<button className={styles.primary} disabled={busy} onClick={()=>action('cancel')}>Cancel ride request</button>}{['accepted','arriving','started'].includes(ride.status)&&<button className={styles.primary} disabled={busy} onClick={()=>action('dispute')}>Report a ride issue</button>}<button className={styles.link} onClick={load}><RefreshCw size={14}/> Refresh ride status</button><button className={styles.link} onClick={()=>onNavigate('messages')}>Open messages</button><button className={styles.link} onClick={()=>onNavigate('support')}><LifeBuoy size={14}/> Contact support</button></section>
        {ride.status==='completed'&&<section className={styles.card}><h2>Rate your ride</h2><label>Rating<select value={rating} onChange={e=>setRating(e.target.value)}><option value="5">5 · Excellent</option><option value="4">4 · Good</option><option value="3">3 · Average</option><option value="2">2 · Poor</option><option value="1">1 · Very poor</option></select></label><label>Comment<textarea rows="3" value={comment} onChange={e=>setComment(e.target.value)} placeholder="Optional feedback"/></label><button className={styles.primary} disabled={busy} onClick={()=>action('rate',{stars:Number(rating),comment})}>Submit rating</button></section>}
      </aside>
    </div>}
    {!loading&&!ride&&!error&&<section className={styles.card}><h2>No ride record found</h2><p>Your account has no ride available for tracking.</p><button className={styles.primary} onClick={()=>onNavigate('ride-booking')}>Request a ride</button></section>}
    <button className={styles.back} onClick={onBack}><ArrowLeft size={14}/> Back to orders &amp; bookings</button>
  </main>;
}
