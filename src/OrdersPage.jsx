import React, { useEffect, useState } from 'react';
import styles from './OrdersPage.module.css';
import { api } from './lib/api.js';

const money=kobo=>'₦'+(Number(kobo||0)/100).toLocaleString('en-NG',{maximumFractionDigits:2});
const date=value=>value?new Date(value).toLocaleString('en-NG'):'—';
const rows=value=>Array.isArray(value)?value:(value?.items||[]);

export default function OrdersPage({user={},onBack=()=>{},onSupport=()=>{}}) {
  const [orders,setOrders]=useState([]);
  const [selectedId,setSelectedId]=useState('');
  const [selected,setSelected]=useState(null);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [stars,setStars]=useState('5');
  const [comment,setComment]=useState('');

  const load=async()=>{
    setLoading(true);setError('');
    try{
      const payload=await api.get('/orders');
      const mine=rows(payload?.bought).filter(order=>order.buyer_pid===user.pid);
      setOrders(mine);
      const target=mine.find(order=>order.pid===selectedId)||mine[0]||null;
      setSelectedId(target?.pid||'');
      setSelected(target);
    }catch(err){setError(err?.message||'Your orders could not be loaded.');}
    finally{setLoading(false);}
  };
  useEffect(()=>{load();},[user.pid]);
  useEffect(()=>{
    if(!selectedId)return;
    let active=true;
    api.get('/orders/'+encodeURIComponent(selectedId)).then(order=>{if(active)setSelected(order);}).catch(err=>{if(active)setError(err?.message||'Order details could not be loaded.');});
    return()=>{active=false;};
  },[selectedId]);

  const action=async(kind,payload={})=>{
    if(!selected)return;
    setBusy(true);setError('');setNotice('');
    try{
      await api.post('/orders/'+encodeURIComponent(selected.pid)+'/'+kind,payload);
      setNotice(kind==='confirm'?'Order receipt confirmed. Escrow release has been processed by KHUB.':'Your request was recorded by KHUB.');
      await load();
    }catch(err){setError(err?.message||'Order action could not be completed.');}
    finally{setBusy(false);}
  };
  const downloadReceipt=()=>{
    if(!selected)return;
    const text=['KHUB ORDER RECEIPT','Order reference: '+selected.pid,'Listing: '+selected.listing_title,'Status: '+selected.status,'Quantity: '+selected.quantity,'Gross amount: '+(selected.amount_display||money(selected.amount_kobo)),'Platform commission: '+money(selected.commission_kobo),'Seller net: '+money(selected.seller_net_kobo),'Created: '+date(selected.created_at)].join('\n');
    const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download='KHUB-'+selected.pid+'-receipt.txt';a.click();URL.revokeObjectURL(url);
  };

  return <main className={styles.page}>
    <div style={{marginBottom:18}}><button type="button" onClick={onBack} aria-label="Go back" style={{display:'inline-flex',alignItems:'center',gap:8,border:'1px solid #dce8df',background:'#fff',color:'#176b43',borderRadius:999,padding:'10px 16px',fontWeight:700,cursor:'pointer'}}>← Back</button></div>
    <header className={styles.heading}><h1>Your orders, accurately tracked.</h1><p>Personal hub / Order detail</p><span>Order status and financial amounts are retrieved from KHUB.</span></header>
    {loading&&<p>Loading orders…</p>}{error&&<p className={styles.warning} role="alert">{error}</p>}{notice&&<p className={styles.notice} role="status">{notice}</p>}
    {!loading&&orders.length>0&&<section className={styles.purchaseList} aria-label="Your orders">{orders.map(order=><button key={order.pid} className={styles.purchase+(selectedId===order.pid?' '+styles.selected:'')} onClick={()=>setSelectedId(order.pid)}><span><strong>{order.listing_title}</strong><small>{order.pid} · {date(order.created_at)}</small></span><span><b>{order.amount_display||money(order.amount_kobo)}</b><small>{order.status}</small></span></button>)}</section>}
    {!loading&&selected&&<div className={styles.layout}><div className={styles.mainCol}>
      <section className={styles.card}><h2>Order details</h2><p className={styles.status}>{selected.status}</p><h3>{selected.listing_title}</h3><p>Listing type · {selected.listing_vertical} · Quantity · {selected.quantity}</p><p>Order reference · {selected.pid}</p><p>Created · {date(selected.created_at)}</p><p>Seller reference · {selected.seller_pid}</p></section>
      <section className={styles.card}><h2>Escrow and completion</h2><p>KHUB wallet debit is held in escrow. Seller funds are released only through the backend order-completion workflow.</p>{selected.status==='delivered'&&<button className={styles.primary} disabled={busy} onClick={()=>action('confirm')}>Confirm receipt and release escrow</button>}{['paid_escrow','delivered'].includes(selected.status)&&<button className={styles.textLink} disabled={busy} onClick={()=>action('dispute',{reason:'Order issue reported by buyer'})}>Report an issue / open dispute</button>}{selected.status==='paid_escrow'&&<button className={styles.textLink} disabled={busy} onClick={()=>action('cancel')}>Request cancellation</button>}</section>
      {selected.status==='completed'&&<section className={styles.card}><h2>Review your order</h2><label>Rating<select value={stars} onChange={e=>setStars(e.target.value)}><option value="5">5 · Excellent</option><option value="4">4 · Good</option><option value="3">3 · Average</option><option value="2">2 · Poor</option><option value="1">1 · Very poor</option></select></label><label>Comment<textarea rows="3" value={comment} onChange={e=>setComment(e.target.value)} placeholder="Optional feedback"/></label><button className={styles.primary} disabled={busy} onClick={()=>action('review',{rating:Number(stars),comment})}>Submit review</button></section>}
    </div><aside className={styles.sideCol}>
      <section className={styles.card}><h2>Cost breakdown</h2><p>Gross amount · {selected.amount_display||money(selected.amount_kobo)}</p><p>Platform commission snapshot · {money(selected.commission_kobo)}</p><p>Seller net on completion · {money(selected.seller_net_kobo)}</p><hr/><h3>Total paid from wallet · {selected.amount_display||money(selected.amount_kobo)}</h3><button className={styles.textLink} onClick={downloadReceipt}>Download order receipt</button></section>
      <section className={styles.card}><h2>Need help?</h2><button className={styles.primary} onClick={onSupport}>Get order support</button></section>
    </aside></div>}
    {!loading&&orders.length===0&&!error&&<section className={styles.card}><h2>No purchases yet</h2><p>Your completed and active buyer orders will appear here.</p></section>}
  </main>;
}
