import React, { useState } from 'react';
import { ArrowLeft, MapPin, Wallet, Navigation, CheckCircle2 } from 'lucide-react';
import styles from './RideBookingPage.module.css';
import { api } from './lib/api.js';

export default function RideBookingPage({user={},onNavigate=()=>{},onBack=()=>{}}) {
  const [mode,setMode]=useState('Ride');
  const [pickup,setPickup]=useState({label:'',lat:'',lng:''});
  const [destination,setDestination]=useState({label:'',lat:'',lng:''});
  const [sizeClass,setSizeClass]=useState('small');
  const [wallet,setWallet]=useState(null);
  const [estimate,setEstimate]=useState(null);
  const [result,setResult]=useState(null);
  const [loadingLocation,setLoadingLocation]=useState(false);
  const [estimating,setEstimating]=useState(false);
  const [requesting,setRequesting]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');

  const requestBody=()=>mode==='Ride'?{
    pickup:{lat:Number(pickup.lat),lng:Number(pickup.lng),label:pickup.label.trim()},
    dest:{lat:Number(destination.lat),lng:Number(destination.lng),label:destination.label.trim()},
  }:{
    pickup:{lat:Number(pickup.lat),lng:Number(pickup.lng),label:pickup.label.trim()},
    dropoff:{lat:Number(destination.lat),lng:Number(destination.lng),label:destination.label.trim()},
    size_class:sizeClass,
  };
  const valid=point=>point.label.trim()&&point.lat!==''&&point.lng!==''&&Number.isFinite(Number(point.lat))&&Number.isFinite(Number(point.lng))&&Number(point.lat)>=-90&&Number(point.lat)<=90&&Number(point.lng)>=-180&&Number(point.lng)<=180;

  const useCurrentLocation=()=>{
    setError('');setNotice('');
    if(!navigator.geolocation){setError('Geolocation is not supported by this browser.');return;}
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(position=>{
      setPickup({label:'Current location',lat:String(position.coords.latitude),lng:String(position.coords.longitude)});
      setLoadingLocation(false);
    },err=>{setError(err?.message||'Location permission was not granted.');setLoadingLocation(false);},{enableHighAccuracy:true,timeout:15000,maximumAge:0});
  };

  const getEstimate=async()=>{
    if(!valid(pickup)||!valid(destination)){setError('Enter a pickup and destination label with valid latitude and longitude coordinates.');return;}
    setEstimating(true);setError('');setNotice('');setResult(null);
    try{
      const body=requestBody();
      const path=mode==='Ride'?'/rides/estimate':'/deliveries/estimate';
      const quote=await api.post(path,body);
      setEstimate(quote);
      const summary=await api.get('/wallet/');
      setWallet(summary);
    }catch(err){setError(err?.message||'A live fare estimate could not be calculated.');setEstimate(null);}
    finally{setEstimating(false);}
  };

  const placeRequest=async()=>{
    if(!estimate){setError('Calculate a live backend estimate before requesting.');return;}
    setRequesting(true);setError('');setNotice('');
    try{
      const response=await api.post(mode==='Ride'?'/rides':'/deliveries',requestBody());
      setResult(response);
      setNotice('Your request was accepted by KHUB. The fare has been debited from your wallet into escrow.');
    }catch(err){
      setError(err?.message||'Your request could not be created.');
      if(/insufficient funds/i.test(err?.message||''))setNotice('Fund your KHUB wallet through Flutterwave, then return and request again.');
    }finally{setRequesting(false);}
  };

  const changePoint=(setter,key,value)=>setter(current=>({...current,[key]:value}));
  return <main className={styles.page}>
    <div style={{marginBottom:18}}><button type="button" onClick={onBack} aria-label="Go back" style={{display:'inline-flex',alignItems:'center',gap:8,border:'1px solid #dce8df',background:'#fff',color:'#176b43',borderRadius:999,padding:'10px 16px',fontWeight:700,cursor:'pointer'}}><ArrowLeft size={14}/> Back</button></div>
    <header className={styles.heading}><h1>Your city. A little closer.</h1><p>06 Rides and logistics / Live ride and delivery requests</p><p>Fares are calculated by the KHUB backend from pickup and destination coordinates.</p></header>
    <nav className={styles.tabs} aria-label="Ride or delivery type">{['Ride','Send a parcel'].map(item=><button key={item} className={mode===item?styles.activeTab:''} onClick={()=>{setMode(item);setEstimate(null);setResult(null);setError('');}}>{item}</button>)}</nav>
    <div className={styles.layout}>
      <div className={styles.leftColumn}>
        <section className={styles.card+' '+styles.destinationCard}><h2>{mode==='Ride'?'Where are we going?':'Where is your parcel going?'}</h2>
          <div className={styles.field}><span><MapPin size={13}/> Pickup label</span><input value={pickup.label} onChange={e=>changePoint(setPickup,'label',e.target.value)} placeholder="Pickup address or landmark"/></div>
          <div className={styles.twoFields}><label className={styles.field}><span>Pickup latitude</span><input type="number" min="-90" max="90" step="any" value={pickup.lat} onChange={e=>changePoint(setPickup,'lat',e.target.value)} placeholder="6.45"/></label><label className={styles.field}><span>Pickup longitude</span><input type="number" min="-180" max="180" step="any" value={pickup.lng} onChange={e=>changePoint(setPickup,'lng',e.target.value)} placeholder="3.39"/></label></div>
          <button className={styles.link} onClick={useCurrentLocation} disabled={loadingLocation}><Navigation size={14}/>{loadingLocation?'Getting location…':'Use my current location for pickup'}</button>
          <div className={styles.field}><span><MapPin size={13}/> {mode==='Ride'?'Destination label':'Drop-off label'}</span><input value={destination.label} onChange={e=>changePoint(setDestination,'label',e.target.value)} placeholder="Destination address or landmark"/></div>
          <div className={styles.twoFields}><label className={styles.field}><span>Destination latitude</span><input type="number" min="-90" max="90" step="any" value={destination.lat} onChange={e=>changePoint(setDestination,'lat',e.target.value)} placeholder="6.43"/></label><label className={styles.field}><span>Destination longitude</span><input type="number" min="-180" max="180" step="any" value={destination.lng} onChange={e=>changePoint(setDestination,'lng',e.target.value)} placeholder="3.42"/></label></div>
          {mode==='Send a parcel'&&<label className={styles.field}><span>Parcel size</span><select value={sizeClass} onChange={e=>{setSizeClass(e.target.value);setEstimate(null);}}><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option></select></label>}
          <p className={styles.caption}>KHUB currently requires coordinates. Address search and interactive map selection need a configured geocoding/map provider; no route or driver availability is invented here.</p>
          <button className={styles.primary} onClick={getEstimate} disabled={estimating}>{estimating?'Calculating…':'Calculate live estimate'}</button>
        </section>
      </div>
      <div className={styles.rightColumn}>
        <section className={styles.card+' '+styles.fareCard}><h2>{mode==='Ride'?'Ride fare estimate':'Delivery fee estimate'}</h2>
          {!estimate&&<p>Enter both locations and calculate an estimate to see the server price.</p>}
          {estimate&&<><h3>{mode==='Ride'?estimate.fare_display:estimate.fee_display}</h3><p>Distance · {(Number(estimate.distance_m||0)/1000).toFixed(2)} km</p><p>Platform commission · ₦{(Number(estimate.commission_kobo||0)/100).toLocaleString('en-NG',{maximumFractionDigits:2})}</p><p>{mode==='Ride'?'Driver':'Delivery agent'} net · ₦{(Number(mode==='Ride'?estimate.driver_net_kobo:estimate.agent_net_kobo||0)/100).toLocaleString('en-NG',{maximumFractionDigits:2})}</p><p>Available wallet balance · {wallet?.balance_display||'Refresh required'}</p></>}
          {!result?<button className={styles.primary} disabled={!estimate||requesting} onClick={placeRequest}>{requesting?'Submitting…':mode==='Ride'?'Request ride and pay from wallet':'Request delivery and pay from wallet'}</button>:<div className={styles.confirmBox}><p><CheckCircle2 size={16}/> Request accepted</p><p>Reference · {result.pid}</p><p>Status · {result.status}</p><button className={styles.primary} onClick={()=>onNavigate(mode==='Ride'?'ride-tracking':'orders-bookings')}>View request status</button></div>}
          <button className={styles.link} onClick={()=>onNavigate('wallet')}><Wallet size={14}/> Fund wallet with Flutterwave</button>
        </section>
        <section className={styles.tip}><strong>How payment works</strong><p>The backend recalculates the fare and debits the KHUB wallet into escrow when you request. Drivers and agents receive their net amount only after the backend completion workflow releases escrow.</p></section>
      </div>
    </div>
    {error&&<div className={styles.notice} role="alert">{error}</div>}{notice&&<div className={styles.notice} role="status">{notice}</div>}
    <button className={styles.back} onClick={onBack}><ArrowLeft size={14}/> Back to dashboard</button>
  </main>;
}
