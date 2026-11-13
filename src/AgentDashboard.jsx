import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Navigation, Wallet, PackageCheck, MapPin, LogOut } from 'lucide-react';
import styles from './DriverDashboard.module.css';
import { api, apiUrl, sessionTokens } from './lib/api.js';

const rows=value=>Array.isArray(value)?value:(value?.items||[]);
const money=kobo=>'₦'+(Number(kobo||0)/100).toLocaleString('en-NG',{maximumFractionDigits:2});
const label=point=>point?.label||'Location unavailable';

export default function AgentDashboard({user={},onNavigate=()=>{},onLogout=()=>onNavigate('account')}) {
  const [profile,setProfile]=useState(null);
  const [requests,setRequests]=useState([]);
  const [deliveries,setDeliveries]=useState([]);
  const [earnings,setEarnings]=useState(null);
  const [application,setApplication]=useState({vehicle_type:'motorcycle',vehicle_number:'',license_number:''});
  const [online,setOnline]=useState(false);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState('');
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [applying,setApplying]=useState(false);
  const socketRef=useRef(null);
  const watchRef=useRef(null);

  const load=useCallback(async()=>{
    setLoading(true);setError('');
    try{
      const me=await api.get('/agent/me');setProfile(me);
      if(me.status==='verified'){
        const [available,mine,earned]=await Promise.all([api.get('/agent/requests'),api.get('/agent/deliveries'),api.get('/agent/earnings')]);
        setRequests(rows(available));setDeliveries(rows(mine));setEarnings(earned);
      }else{setRequests([]);setDeliveries([]);setEarnings(null);}
    }catch(err){if(err?.status===404){setProfile(null);setRequests([]);setDeliveries([]);}else setError(err?.message||'Delivery-agent information could not be loaded.');}
    finally{setLoading(false);}
  },[]);
  useEffect(()=>{load();},[load]);

  const stop=()=>{
    if(watchRef.current!==null&&navigator.geolocation)navigator.geolocation.clearWatch(watchRef.current);
    watchRef.current=null;if(socketRef.current){socketRef.current.close();socketRef.current=null;}setOnline(false);
  };
  useEffect(()=>()=>{if(watchRef.current!==null&&navigator.geolocation)navigator.geolocation.clearWatch(watchRef.current);if(socketRef.current)socketRef.current.close();},[]);

  const goOnline=()=>{
    if(!navigator.geolocation){setError('Location sharing is unavailable in this browser.');return;}
    const token=sessionTokens.getAccessToken();if(!token){setError('Sign in again to continue.');return;}
    navigator.geolocation.getCurrentPosition(position=>{
      const socket=new WebSocket(apiUrl('/agent/socket').replace(/^http/,'ws')+'?token='+encodeURIComponent(token));
      socketRef.current=socket;
      socket.onopen=()=>{
        setOnline(true);socket.send(JSON.stringify({lat:position.coords.latitude,lng:position.coords.longitude}));
        watchRef.current=navigator.geolocation.watchPosition(next=>{if(socket.readyState===WebSocket.OPEN)socket.send(JSON.stringify({lat:next.coords.latitude,lng:next.coords.longitude}));},err=>setError(err?.message||'Location updates stopped.'),{enableHighAccuracy:true,maximumAge:5000,timeout:15000});
      };
      socket.onerror=()=>{setError('Delivery-agent location connection failed.');stop();};
      socket.onclose=()=>setOnline(false);
    },err=>setError(err?.message||'Location permission is required.'),{enableHighAccuracy:true,timeout:15000,maximumAge:0});
  };

  const apply=async event=>{
    event.preventDefault();setApplying(true);setError('');
    try{const result=await api.post('/agent/apply',application);setNotice('Delivery-agent application submitted. Status: '+(result.status||'pending'));await load();}
    catch(err){setError(err?.message||'Application failed. Verified KYC and the Logistics Agent role are required.');}
    finally{setApplying(false);}
  };
  const transition=async(row,action)=>{
    setBusy(row.pid);setError('');
    try{await api.post('/agent/deliveries/'+encodeURIComponent(row.pid)+'/'+action,{});setNotice('Delivery status updated by KHUB.');await load();}
    catch(err){setError(err?.message||'Delivery action failed.');}
    finally{setBusy('');}
  };
  const active=deliveries.find(row=>['accepted','picked_up','in_transit'].includes(row.status));
  return <div className={styles.shell}>
    <aside className={styles.sidebar}><button className={styles.navActive}>Delivery requests</button><button className={styles.navItem} onClick={()=>onNavigate('wallet')}>Earnings &amp; payouts</button><button className={styles.navItem} onClick={()=>onNavigate('messages')}>Messages</button><button className={styles.navItem} onClick={()=>onNavigate('notifications')}>Notifications</button><button className={styles.navItem} onClick={()=>onNavigate('settings')}>Profile &amp; documents</button></aside>
    <main className={styles.main}><button type="button" className={styles.dashboardLogout} onClick={onLogout}><LogOut size={16}/> Log out</button>
      <header className={styles.heading}><h1>Deliver with a clear view.</h1><p>08 Role workspaces / Delivery-agent dashboard</p><p>{user.name||'Delivery agent'} · Live delivery workspace</p></header>
      {loading&&<p>Loading delivery-agent data…</p>}{error&&<p className={styles.stateCard} role="alert">{error}</p>}{notice&&<p className={styles.stateCard} role="status">{notice}</p>}
      {!profile&&!loading&&<section className={styles.card}><h2>Apply as a delivery agent</h2><p>Requires the Logistics Agent role, verified email and completed KYC.</p><form onSubmit={apply}><label>Vehicle type<input value={application.vehicle_type} onChange={e=>setApplication(v=>({...v,vehicle_type:e.target.value}))} required/></label><label>Vehicle registration<input value={application.vehicle_number} onChange={e=>setApplication(v=>({...v,vehicle_number:e.target.value}))} required/></label><label>Licence number<input value={application.license_number} onChange={e=>setApplication(v=>({...v,license_number:e.target.value}))} required/></label><button className={styles.primary} disabled={applying}>{applying?'Submitting…':'Submit application'}</button></form></section>}
      <div className={styles.topGrid}><section className={styles.card+' '+styles.availability}><h2>Agent availability</h2><p>{online?'Online · Location sharing active':'Offline · Not accepting delivery requests'}</p><p>Profile status · {profile?.status||'Not registered'}</p>{online?<button className={styles.primary} onClick={stop}>Go offline</button>:<button className={styles.primary} disabled={profile?.status!=='verified'} onClick={goOnline}>Go online and share location</button>}<p className={styles.note}>Location is shared only while the live agent socket is connected.</p></section><section className={styles.card}><h2>Delivery earnings</h2><h3>{earnings?.lifetime_display||money(earnings?.lifetime_kobo)}</h3><p>Today · {money(earnings?.today_kobo)} · Completed deliveries · {earnings?.deliveries||0}</p><button className={styles.textLink} onClick={()=>onNavigate('wallet')}>Open wallet</button></section></div>
      <div className={styles.middleGrid}><div className={styles.leftStack}>{active&&<section className={styles.card}><h2>Active delivery · {active.pid}</h2><p>{label(active.pickup)} → {label(active.dropoff)}</p><p>Gross fee {active.fee_display} · Commission {money(active.commission_kobo)} · Agent net {money(active.agent_net_kobo)}</p><p>Status · {active.status}</p>{active.status==='accepted'&&<button className={styles.primary} disabled={busy===active.pid} onClick={()=>transition(active,'pickup')}>Confirm pickup</button>}{active.status==='picked_up'&&<button className={styles.primary} disabled={busy===active.pid} onClick={()=>transition(active,'transit')}>Mark in transit</button>}{active.status==='in_transit'&&<button className={styles.primary} disabled={busy===active.pid} onClick={()=>transition(active,'complete')}>Complete delivery</button>}</section>}
        <section className={styles.card}><h2>Available delivery requests</h2>{requests.map(row=><article className={styles.history} key={row.pid}><p>{label(row.pickup)} → {label(row.dropoff)}</p><p>{row.fee_display} · Agent net {money(row.agent_net_kobo)} · {row.status}</p><button className={styles.primary} disabled={!online||Boolean(active)||busy===row.pid} onClick={()=>transition(row,'accept')}>Accept delivery</button></article>)}{!loading&&!requests.length&&<p>No available delivery requests.</p>}</section>
        <section className={styles.card}><h2>Recent deliveries</h2>{deliveries.filter(row=>row.status==='completed').slice(0,5).map(row=><p key={row.pid}>{row.tracking_code||row.pid} · {row.fee_display} · Agent net {money(row.agent_net_kobo)}</p>)}{!deliveries.some(row=>row.status==='completed')&&<p>No completed deliveries yet.</p>}</section></div>
        <aside className={styles.rightStack}><section className={styles.card}><h2>Agent profile</h2><p>{profile?.vehicle_type||'Vehicle not recorded'} · {profile?.vehicle_number||'—'}</p><p>Licence · {profile?.license_number||'—'}</p><p>Status · {profile?.status||'—'}</p><button className={styles.textLink} onClick={()=>onNavigate('settings')}>Manage profile</button></section><section className={styles.card}><h2>Delivery safety</h2><p>Follow road rules and verify recipient details before completing a delivery.</p><button className={styles.textLink} onClick={()=>onNavigate('support')}>Get help</button></section></aside></div>
    </main>
  </div>;
}
