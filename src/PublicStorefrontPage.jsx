import React, { useEffect, useState } from 'react';
import { ArrowLeft, Check, MessageCircle, Package } from 'lucide-react';
import styles from './PublicStorefrontPage.module.css';
import placeholder from './assets/service.jpg';
import { api } from './lib/api.js';

const rows=value=>Array.isArray(value)?value:(value?.items||[]);
const money=kobo=>'₦'+(Number(kobo||0)/100).toLocaleString('en-NG',{maximumFractionDigits:2});

export default function PublicStorefrontPage({user={},onNavigate=()=>{},onBack=()=>{}}) {
  const [profile,setProfile]=useState(user);
  const [listings,setListings]=useState([]);
  const [kyc,setKyc]=useState(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  useEffect(()=>{
    let active=true;
    Promise.all([api.get('/user/profile'),api.get('/my/listings'),api.get('/user/kyc')]).then(([p,l,k])=>{
      if(!active)return;
      setProfile(p);setListings(rows(l));setKyc(k);
    }).catch(err=>{if(active)setError(err?.message||'Your storefront data could not be loaded.');})
      .finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[]);
  const publicListings=listings.filter(item=>['active','live','published'].includes(String(item.status||'').toLowerCase()));
  const isSeller=String(profile.role||'').toLowerCase()==='seller';
  const storeName=profile.business_name||profile.name||'KHUB member';
  const owner=profile.name||'KHUB member';

  return <main className={styles.page}>
    <button className={styles.back} onClick={onBack}><ArrowLeft size={15}/> Back</button>
    <header className={styles.heading}><h1>{storeName}</h1><p>09 Personal hub / Storefront preview</p><span>{profile.location||'Location not provided'} · Live listings from your KHUB account</span></header>
    {loading&&<p>Loading your storefront…</p>}{error&&<p className={styles.notice} role="alert">{error}</p>}
    <div className={styles.topGrid}>
      <div className={styles.mainColumn}>
        <div className={styles.heroImage}><img src={placeholder} alt="KHUB storefront placeholder"/></div>
        <section className={styles.card+' '+styles.about}><h2>About {storeName}</h2><p className={styles.verified}><Check size={12}/> {owner} · KYC status: {kyc?.status||'Not verified'}</p><p>{profile.bio||'Add a business description in your profile to introduce your KHUB storefront.'}</p><p>{profile.location||'Location not provided'}</p><p className={styles.muted}>Identity verification is not a quality guarantee. KHUB does not display invented ratings, sales totals or testimonials.</p><button className={styles.link} onClick={()=>onNavigate('settings')}>Edit profile details</button></section>
      </div>
      <aside className={styles.sideColumn}>
        <section className={styles.card+' '+styles.workCard}><h2>Store overview</h2><h3><Package size={16}/> {publicListings.length} live listings</h3><p>{isSeller?'Seller storefront':'Service provider storefront'} · {profile.role||'Member'}</p><button className={styles.primary} onClick={()=>onNavigate('seller-listing')}>Create a listing</button><button className={styles.link} onClick={()=>onNavigate('messages')}><MessageCircle size={13}/> Open messages</button></section>
        <section className={styles.card+' '+styles.credentials}><h2>Account details</h2><p>{profile.email}</p><p>{profile.phone||'Phone not provided'}</p><p>KYC status · {kyc?.status||'Not available'}</p><button className={styles.link} onClick={()=>onNavigate('settings')}>Manage account</button></section>
      </aside>
    </div>
    <section className={styles.card+' '+styles.portfolio}><h2>Live listings</h2>{publicListings.length===0&&!loading&&<p>No published listings are available to display yet.</p>}<div className={styles.projects}>{publicListings.map(item=><article key={item.pid}><div className={styles.projectTile}><strong>{item.title}</strong><span>{item.category||item.vertical}</span></div><p>{item.location||'Location not provided'} · {item.price_display||money(item.price_kobo)}</p><p>{item.status}</p></article>)}</div></section>
    <section className={styles.card+' '+styles.services}><h2>Orders and enquiries</h2><p>Keep order records, service requests and buyer messages inside KHUB.</p><button className={styles.link} onClick={()=>onNavigate('orders-bookings')}>View order activity</button><button className={styles.link} onClick={()=>onNavigate('messages')}>Open conversations</button></section>
  </main>;
}
