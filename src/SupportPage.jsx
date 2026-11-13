import React, { useMemo, useState } from 'react';
import styles from './SupportPage.module.css';
import { ArrowUpRight, MessageCircle, Wallet, PackageCheck, ShieldCheck } from 'lucide-react';

const help=[ 
  {title:'Wallet funding and withdrawals',text:'Wallet funding starts on Flutterwave hosted checkout. KHUB credits funds only after server-side verification. Withdrawals require verified KYC and backend approval.',action:'Open wallet',route:'wallet',icon:Wallet},
  {title:'Orders and escrow',text:'Buyer funds are held in escrow. Confirm receipt only after the order is fulfilled. Eligible refunds from escrow return to the KHUB wallet.',action:'View orders',route:'orders-bookings',icon:PackageCheck},
  {title:'Services and rentals',text:'Until automated booking calendars are available, agree on service scope, dates and rental availability through authenticated KHUB messages before ordering.',action:'Open messages',route:'messages',icon:MessageCircle},
  {title:'Account and identity',text:'Keep your profile current. Identity document uploads and administrative review are withheld until private KYC document storage and authorised access are complete.',action:'Open account settings',route:'settings',icon:ShieldCheck},
];
export default function SupportPage({user={},onBack=()=>{},onNavigate=()=>{}}) {
  const [search,setSearch]=useState('');
  const visible=useMemo(()=>help.filter(item=>(item.title+' '+item.text).toLowerCase().includes(search.toLowerCase())),[search]);
  return <div className={styles.page}><main className={styles.main}>
    <div style={{marginBottom:18}}><button type="button" onClick={onBack} aria-label="Go back" style={{display:'inline-flex',alignItems:'center',gap:8,border:'1px solid #dce8df',background:'#fff',color:'#176b43',borderRadius:999,padding:'10px 16px',fontWeight:700,cursor:'pointer'}}>← Back</button></div>
    <header className={styles.heading}><h1>KHUB help and account guidance.</h1><p>Personal hub / Help center</p><p>{user.name||'KHUB member'} · Guidance based on current backend capabilities.</p></header>
    <label className={styles.search}><span>Search help topics</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Wallet, escrow, services, identity…"/></label>
    <section className={styles.helpGrid}>{visible.map(item=>{const Icon=item.icon;return <article className={styles.card} key={item.title}><h2><Icon size={18}/> {item.title}</h2><p>{item.text}</p><button className={styles.link} onClick={()=>onNavigate(item.route)}>{item.action} <ArrowUpRight size={14}/></button></article>;})}</section>
    {visible.length===0&&<section className={styles.card}><p>No help topic matches that search.</p></section>}
    <div className={styles.columns}>
      <section className={styles.card}><h2>Contact through KHUB</h2><p>The backend does not yet provide a support-ticket creation or ticket-history API. This page will not generate fake ticket references or claim a support request was submitted.</p><p>For an existing conversation, use the authenticated KHUB inbox. Include the exact order, ride or delivery reference when asking for help.</p><button className={styles.primary} onClick={()=>onNavigate('messages')}>Open KHUB messages</button></section>
      <aside className={styles.right}><section className={styles.noticeGreen}><p>Immediate safety concern?</p><p>For an emergency in Nigeria, call 112. KHUB support is not an emergency responder.</p></section><section className={styles.noticeGreen}><p>Security reminder</p><p>Never share passwords, OTPs, card PINs or bank login details in chat. A browser return from Flutterwave is not proof of payment; check your wallet ledger.</p></section></aside>
    </div>
    <button className={styles.back} onClick={onBack}>← Back to dashboard</button>
  </main></div>;
}
