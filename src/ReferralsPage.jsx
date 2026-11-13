import React, { useEffect, useState } from 'react';
import styles from './ReferralsPage.module.css';
import { api } from './lib/api.js';

const money = kobo => '₦' + (Number(kobo || 0) / 100).toLocaleString('en-NG');
export default function ReferralsPage({ onBack=()=>{}, onWallet=()=>{} }) {
  const [data,setData]=useState(null);
  const [notice,setNotice]=useState('');
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(true);
  useEffect(()=>{let active=true;api.get('/referrals').then(value=>{if(active)setData(value);}).catch(err=>{if(active)setError(err?.message||'Referral information could not be loaded.');}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[]);
  const code=data?.code||'';
  const link=code?(window.location.origin+'/?ref='+encodeURIComponent(code)):'';
  const copyInvite=async()=>{
    try{await navigator.clipboard.writeText('Referral code: '+code+'\nInvite link: '+link);setNotice('Your KHUB referral code and link were copied.');}
    catch{setNotice('Your referral code is '+code+'. Copy it to share.');}
  };
  const shareInvite=async()=>{
    const message='Join me on KHUB. Use my referral code '+code+'.';
    try{if(navigator.share)await navigator.share({title:'Join KHUB',text:message,url:link});else{await navigator.clipboard.writeText(message+' '+link);setNotice('Invitation copied and ready to share.');}}
    catch(err){if(err?.name!=='AbortError')setNotice('Share your code '+code+' with your invitation link: '+link);}
  };
  const stats=data?.stats||{};
  return <div className={styles.page}>
    <div style={{marginBottom:18}}><button type="button" onClick={onBack} aria-label="Go back" style={{display:'inline-flex',alignItems:'center',gap:8,border:'1px solid #dce8df',background:'#fff',color:'#176b43',borderRadius:999,padding:'10px 16px',fontWeight:700,cursor:'pointer'}}>← Back</button></div>
    <header className={styles.header}><h1>Good things are better together.</h1><p>09 Personal hub / Referrals<br/>Invite people to KHUB and track rewards from the referral service.</p></header>
    {loading&&<p>Loading referral account…</p>}{error&&<p className={styles.notice} role="alert">{error}</p>}
    {data&&<><div className={styles.topGrid}>
      <section className={styles.card+' '+styles.inviteCard}><h2>Your invitation</h2><h3>Share your KHUB code.</h3><div className={styles.readout}><span>Referral code</span><strong>{code}</strong></div><div className={styles.readout}><span>Invitation link</span><strong>{link}</strong></div><div className={styles.actions}><button className={styles.primary} onClick={copyInvite}>Copy code / link</button><button className={styles.link} onClick={shareInvite}>Share invitation</button></div>{notice&&<p className={styles.notice} role="status">{notice}</p>}</section>
      <section className={styles.card}><h2>How rewards work</h2><p>Share your unique referral code with a new KHUB member.</p><p>Referral eligibility and reward timing are determined by the backend programme rules, including qualifying completed transactions and fraud checks.</p><p>Referee identities are intentionally not exposed in your referral history.</p><strong>Current reward: {data.reward_naira_display}</strong></section>
    </div>
    <section className={styles.metrics} aria-label="Referral summary"><article className={styles.card}><strong>{stats.total||0}</strong><span>Invited</span><small>Recorded referrals</small></article><article className={styles.card}><strong>{stats.rewarded||0}</strong><span>Rewarded</span><small>Backend-confirmed rewards</small></article><article className={styles.card}><strong>{stats.earned_display||money(stats.earned_kobo)}</strong><span>Rewards earned</span><small>Recorded by KHUB</small></article><article className={styles.card}><strong>{stats.pending||0}</strong><span>Pending</span><small>Awaiting eligibility checks</small></article></section>
    <div className={styles.bottomGrid}><section className={styles.card}><h2>Referral progress</h2>{(data.referrals||[]).map((item,index)=><article key={item.created_at+'-'+index} className={styles.referralRow}><p>Referral {index+1}</p><p>Status: {item.status} · Reward: {item.reward_kobo==null?'Pending':money(item.reward_kobo)} · Joined: {new Date(item.created_at).toLocaleDateString('en-NG')}</p></article>)}{!data.referrals?.length&&<p>No referrals have been recorded yet. Share your code to invite someone.</p>}</section>
      <aside className={styles.sideStack}><section className={styles.card}><h2>Reward status</h2><p>Pending rewards are not available to spend. Only rewards confirmed and credited by the backend are included in earned totals.</p><button className={styles.link} onClick={onWallet}>View wallet</button></section></aside></div></>}
    <button className={styles.back} onClick={onBack}>Back to dashboard</button>
  </div>;
}
