import React, { useEffect, useState } from 'react';
import styles from './PersonalSettingsPage.module.css';
import { api } from './lib/api.js';

export default function PersonalSettingsPage({ user={}, onBack=()=>{}, onNavigate=()=>{} }) {
  const [profile,setProfile]=useState({name:user.name||'',phone:user.phone||'',address:'',location:''});
  const [kyc,setKyc]=useState(null);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');

  useEffect(()=>{
    let active=true;
    Promise.all([api.get('/user/profile'),api.get('/user/kyc')]).then(([value,kycValue])=>{
      if(!active)return;
      setProfile({name:value.name||'',phone:value.phone||'',address:value.address||'',location:value.location||''});
      setKyc(kycValue);
    }).catch(err=>{if(active)setError(err?.message||'Your profile could not be loaded.');})
      .finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[]);

  const update=(key,value)=>setProfile(current=>({...current,[key]:value}));
  const save=async event=>{
    event.preventDefault();setSaving(true);setError('');setNotice('');
    try{
      const result=await api.patch('/user/profile',profile);
      setProfile({name:result.name||'',phone:result.phone||'',address:result.address||'',location:result.location||''});
      setNotice('Your profile was saved by KHUB.');
    }catch(err){setError(err?.message||'Profile changes could not be saved.');}
    finally{setSaving(false);}
  };

  return <main className={styles.page}>
    <div style={{marginBottom:18}}><button type="button" onClick={onBack} aria-label="Go back" style={{display:'inline-flex',alignItems:'center',gap:8,border:'1px solid #dce8df',background:'#fff',color:'#176b43',borderRadius:999,padding:'10px 16px',fontWeight:700,cursor:'pointer'}}>← Back</button></div>
    <header className={styles.heading}><h1>Your profile, accurately represented.</h1><p>Personal hub / Profile and account settings</p><span>Manage the contact and location details stored by KHUB.</span></header>
    {loading&&<p>Loading profile…</p>}{error&&<p className={styles.validation} role="alert">{error}</p>}{notice&&<p className={styles.success} role="status">{notice}</p>}
    <div className={styles.layout}>
      <div className={styles.leftColumn}>
        <form className={styles.card} onSubmit={save}>
          <h2>Account profile</h2>
          <label className={styles.fullField}>Full name<input value={profile.name} onChange={e=>update('name',e.target.value)} minLength={2} required/></label>
          <label className={styles.fullField}>Phone number<input value={profile.phone} onChange={e=>update('phone',e.target.value)} maxLength={20} placeholder="Add a contact number"/></label>
          <label className={styles.fullField}>City or service area<input value={profile.location} onChange={e=>update('location',e.target.value)} placeholder="e.g. Lagos"/></label>
          <label className={styles.fullField}>Address<input value={profile.address} onChange={e=>update('address',e.target.value)} placeholder="Your private address"/></label>
          <button className={styles.primary} type="submit" disabled={saving||loading}>{saving?'Saving…':'Save profile'}</button>
        </form>
        <section className={styles.card}><h2>Private account details</h2><div className={styles.contactField}><span>Email address</span><strong>{user.email||'Retrieved from KHUB account'}</strong></div><div className={styles.contactField}><span>Account role</span><strong>{user.role||'Role not available'}</strong></div><p className={styles.note}>Email and role are managed by the authentication and permissions system. They cannot be changed through this profile form.</p></section>
      </div>
      <aside className={styles.rightColumn}>
        <section className={styles.card}><h2>Identity verification</h2><p>Current KYC status · <strong>{kyc?.status||'Not available'}</strong></p>{(kyc?.documents||[]).map(doc=><div className={styles.contactField} key={doc.doc_type}><span>{doc.doc_type}</span><strong>{doc.status} · {new Date(doc.submitted_at).toLocaleDateString('en-NG')}</strong></div>)}<p className={styles.explainer}>Identity-document upload and administrative review are temporarily withheld from this page until private KYC storage and authorised, short-lived document access are completed. This protects sensitive identity information.</p></section>
        <section className={styles.card}><h2>Role permissions</h2><p>Your current role is controlled by the KHUB backend. Selecting another role in the browser cannot grant permissions.</p><p>Seller, service provider, job poster and driver access require the relevant backend application and verification process.</p><button className={styles.textLink} onClick={()=>onNavigate('support')}>Ask about role verification</button></section>
      </aside>
    </div>
    <button className={styles.backLink} type="button" onClick={onBack}>← Back to dashboard</button>
  </main>;
}
