import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Circle, Navigation, History, Wallet, MessageCircle, Bell, CarFront, ShieldCheck, LifeBuoy, Settings, Menu, X, LogOut, MapPin } from 'lucide-react';
import styles from './DriverDashboard.module.css';
import { api, apiUrl, sessionTokens } from './lib/api.js';

const rows=value=>Array.isArray(value)?value:(value?.items||[]);
const money=kobo=>'₦'+(Number(kobo||0)/100).toLocaleString('en-NG',{maximumFractionDigits:2});
const label=point=>point?.label||'Location unavailable';

export default function DriverDashboard({user={},onNavigate=()=>{},onLogout=()=>onNavigate('account')}) {
  const [profile,setProfile]=useState(null);
  const [requests,setRequests]=useState([]);
  const [rides,setRides]=useState([]);
  const [earnings,setEarnings]=useState(null);
  const [online,setOnline]=useState(false);
  const [socketState,setSocketState]=useState('offline');
  const [active,setActive]=useState('Today');
  const [mobileNav,setMobileNav]=useState(false);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState('');
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const socketRef=useRef(null);
  const watchRef=useRef(null);
  const latestLocation=useRef(null);

  const load=useCallback(async()=>{
    setLoading(true);setError('');
    try{
      const me=await api.get('/driver/me');
      setProfile(me);
      if(me.status==='verified'){
        const [available,myRides,earningData]=await Promise.all([api.get('/driver/requests'),api.get('/driver/rides'),api.get('/driver/earnings')]);
        setRequests(rows(available));setRides(rows(myRides));setEarnings(earningData);
      }else{
        setRequests([]);setRides([]);setEarnings(null);
      }
    }catch(err){setError(err?.message||'Driver data could not be loaded. Driver approval and KYC may be required.');}
    finally{setLoading(false);}
  },[]);
  useEffect(()=>{load();},[load]);

  const stopLocation=()=>{
    if(watchRef.current!==null&&navigator.geolocation)navigator.geolocation.clearWatch(watchRef.current);
    watchRef.current=null;
    if(socketRef.current){socketRef.current.close();socketRef.current=null;}
    setOnline(false);setSocketState('offline');
  };
  useEffect(()=>()=>stopLocation(),[]);

  const goOnline=()=>{
    setError('');setNotice('');
    if(!navigator.geolocation){setError('This browser does not support location sharing.');return;}
    const token=sessionTokens.getAccessToken();
    if(!token){setError('Your session has expired. Sign in again.');return;}
    navigator.geolocation.getCurrentPosition(position=>{
      latestLocation.current={lat:position.coords.latitude,lng:position.coords.longitude};
      const url=apiUrl('/driver/socket').replace(/^http/,'ws')+'?token='+encodeURIComponent(token);
      const socket=new WebSocket(url);socketRef.current=socket;setSocketState('connecting');
      socket.onopen=()=>{
        setOnline(true);setSocketState('online');setNotice('You are online. KHUB is sharing your location with the driver matching service.');
        if(latestLocation.current)socket.send(JSON.stringify(latestLocation.current));
        watchRef.current=navigator.geolocation.watchPosition(next=>{
          latestLocation.current={lat:next.coords.latitude,lng:next.coords.longitude};
          if(socket.readyState===WebSocket.OPEN)socket.send(JSON.stringify(latestLocation.current));
        },err=>{setError(err?.message||'Location updates stopped.');stopLocation();},{enableHighAccuracy:true,maximumAge:5000,timeout:15000});
      };
      socket.onerror=()=>{setError('The driver location connection failed.');stopLocation();};
      socket.onclose=()=>{setOnline(false);setSocketState('offline');};
    },err=>setError(err?.message||'Location permission is required to go online.'),{enableHighAccuracy:true,timeout:15000,maximumAge:0});
  };

  const transition=async(ride,action)=>{
    setBusy(ride.pid);setError('');setNotice('');
    try{await api.post('/driver/rides/'+encodeURIComponent(ride.pid)+'/'+action,{});setNotice('Ride status updated by KHUB.');await load();}
    catch(err){setError(err?.message||'Ride action could not be completed.');}
    finally{setBusy('');}
  };

  const activeRide=rides.find(ride=>['accepted','arriving','started'].includes(ride.status));
  const menu=[['Today',Circle],['Ride requests',Navigation],['Active job',Navigation],['Trip history',History],['Earnings',Wallet],['Messages',MessageCircle],['Notifications',Bell],['Vehicle & documents',CarFront],['Safety',ShieldCheck],['Support',LifeBuoy],['Settings',Settings]];
  const selectMenu=label=>{setActive(label);setMobileNav(false);if(label==='Settings'||label==='Vehicle & documents')onNavigate('settings');else if(label==='Messages')onNavigate('messages');else if(label==='Support'||label==='Safety')onNavigate('support');else if(label==='Notifications')onNavigate('notifications');else if(label==='Trip history')onNavigate('orders-bookings');else if(label==='Earnings')onNavigate('wallet');};

  return <div className={styles.shell}>
    <button className={styles.mobileMenu} onClick={()=>setMobileNav(v=>!v)} aria-label="Toggle driver navigation">{mobileNav?<X size={20}/>:<Menu size={20}/>} Menu</button>
    <aside className={styles.sidebar} aria-label="Driver navigation">{menu.map(([label,Icon])=><button key={label} className={styles.navItem+(active===label?' '+styles.navActive:'')} onClick={()=>selectMenu(label)}><Icon size={13}/><span>{label}</span></button>)}</aside>
    <main className={styles.main}>
      <button type="button" className={styles.dashboardLogout} onClick={onLogout}><LogOut size={16}/> Log out</button>
      <header className={styles.heading}><h1>Drive with a clear view.</h1><p>08 Role workspaces / Driver dashboard</p><p>{user.name||'Driver account'} · {profile?.vehicle_type||'Vehicle not recorded'} · {profile?.vehicle_number||'Vehicle details unavailable'}</p></header>
      {loading&&<p>Loading driver profile and trips…</p>}{error&&<p className={styles.stateCard} role="alert">{error}</p>}{notice&&<p className={styles.stateCard} role="status">{notice}</p>}
      <div className={styles.topGrid}>
        <section className={styles.card+' '+styles.availability}><h2>Driver availability</h2><p className={styles.status}><span className={online?styles.dot:styles.dotOff}/> {online?'Online · Location sharing active':'Offline · Not accepting requests'}</p><p>Profile status: {profile?.status||'Not verified'}. Live availability requires your explicit location-sharing permission.</p><div className={styles.actions}>{online?<button className={styles.primary} onClick={stopLocation}>Go offline</button>:<button className={styles.primary} onClick={goOnline} disabled={!profile||profile.status!=='verified'}>Go online and share location</button>}<button className={styles.textLink} onClick={load}>Refresh driver data</button></div><p className={styles.note}>Only share location while actively working. Going offline closes the live driver socket.</p></section>
        <section className={styles.card}><h2>Verified driver earnings</h2><h3>{earnings?.lifetime_display||money(earnings?.lifetime_kobo)}</h3><p>Today · {money(earnings?.today_kobo)}<br/>Last 7 days · {money(earnings?.last_7_days_kobo)}<br/>Settled trips · {earnings?.trips||0}</p><button className={styles.textLink} onClick={()=>onNavigate('wallet')}>Open wallet ledger</button></section>
      </div>
      <div className={styles.middleGrid}>
        <div className={styles.leftStack}>
          {activeRide&&<section className={styles.card+' '+styles.activeRide}><h2>Active ride · {activeRide.pid}</h2><p>{label(activeRide.pickup)} → {label(activeRide.dest)}</p><p>Gross fare {activeRide.fare_display} · Platform commission {money(activeRide.commission_kobo)} · Driver net {money(activeRide.driver_net_kobo)}</p><p>Status · {activeRide.status}</p><div className={styles.actions}>{activeRide.status==='accepted'&&<button className={styles.primary} disabled={busy===activeRide.pid} onClick={()=>transition(activeRide,'arriving')}>Mark arriving</button>}{activeRide.status==='arriving'&&<button className={styles.primary} disabled={busy===activeRide.pid} onClick={()=>transition(activeRide,'start')}>Start trip</button>}{activeRide.status==='started'&&<button className={styles.primary} disabled={busy===activeRide.pid} onClick={()=>transition(activeRide,'complete')}>Complete trip</button>}</div></section>}
          <section className={styles.card}><h2>Available ride requests</h2>{requests.map(ride=><div className={styles.history} key={ride.pid}><p>{label(ride.pickup)} → {label(ride.dest)}</p><p>{ride.fare_display} · Driver net {money(ride.driver_net_kobo)} · {ride.status}</p><button className={styles.primary} disabled={!online||busy===ride.pid||Boolean(activeRide)} onClick={()=>transition(ride,'accept')}>{busy===ride.pid?'Accepting…':'Accept ride'}</button></div>)}{!loading&&requests.length===0&&<p>No available ride requests are currently returned by KHUB.</p>}</section>
          <section className={styles.card}><h2>Recent completed rides</h2>{rides.filter(ride=>ride.status==='completed').slice(0,5).map(ride=><div key={ride.pid}><p>{label(ride.pickup)} → {label(ride.dest)}</p><p>{ride.created_at?new Date(ride.created_at).toLocaleString('en-NG'):''} · {ride.fare_display} · Driver net {money(ride.driver_net_kobo)}</p></div>)}{!rides.some(ride=>ride.status==='completed')&&<p>No completed rides are available.</p>}</section>
        </div>
        <aside className={styles.rightStack}>
          <section className={styles.card}><h2>Driver profile</h2><p>Status · {profile?.status||'Not available'}</p><p>Vehicle · {profile?.vehicle_type||'—'} · {profile?.vehicle_number||'—'}</p><p>Licence · {profile?.license_number||'—'}</p><p>Verification · {profile?.verified_at?new Date(profile.verified_at).toLocaleDateString('en-NG'):'Pending / not verified'}</p><button className={styles.textLink} onClick={()=>onNavigate('settings')}>Manage documents</button></section>
          <section className={styles.card}><h2>Safety</h2><p>Pull over before using controls. Follow local traffic laws and use KHUB trip records for support.</p><button className={styles.textLink} onClick={()=>onNavigate('support')}>Safety and support</button></section>
        </aside>
      </div>
    </main>
  </div>;
}
