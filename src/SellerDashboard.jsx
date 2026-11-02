import React, { useState } from 'react';
import styles from './SellerDashboard.module.css';

const orders = [
  { id: 'KH-10482', item: 'Lounge chair ×1', amount: '₦145,000', target: '13 Oct', status: 'Preparing', action: 'Print packing slip' },
  { id: 'KH-10470', item: 'Side table ×2', amount: '₦96,000', target: 'Today', status: 'Ready', action: 'Confirm dispatch' },
  { id: 'KH-10466', item: 'Reading lamp ×1', amount: '₦32,000', target: 'Today', status: 'Address check', action: 'Contact buyer' },
];
const inventory = [
  { name: 'The Lekki lounge chair', sku: 'SN-CH-01', stock: 6, visibility: '✓ Live', price: '₦145,000', action: 'Edit / stock' },
  { name: 'Walnut side table', sku: 'SN-TB-02', stock: 1, visibility: '! Low stock', price: '₦48,000', action: 'Restock' },
  { name: 'Reading lamp', sku: 'SN-LP-03', stock: 2, visibility: 'Advertised', price: '₦32,000', action: 'Edit promotion' },
];
export default function SellerDashboard({ user, onNavigate, onLogout = () => onNavigate?.('account') }) {
 const [stock,setStock] = useState(inventory.map(x=>x.stock));
 const [notice,setNotice] = useState('');
 const [showStock,setShowStock] = useState(false);
 const [selected,setSelected] = useState(1);
 const [quantity,setQuantity] = useState('');
 const [tab,setTab] = useState('Overview');
 const nav=['Overview','Inventory','Orders','Fulfilment','Storefront','Promotions','Revenue & payouts','Messages','Notifications','Verification','Support','Settings'];
 const handleNav=(item)=>{setTab(item); if(item==='Settings' || item==='Verification') onNavigate?.('settings'); else if(item==='Storefront' || item==='Promotions') onNavigate?.('storefront'); else if(item==='Support') onNavigate?.('support'); else if(item==='Notifications') onNavigate?.('notifications'); else if(item==='Messages') onNavigate?.('messages'); else if(item==='Orders' || item==='Fulfilment') onNavigate?.('orders'); else if(item==='Revenue & payouts') onNavigate?.('wallet'); else if(item==='Inventory') onNavigate?.('seller-listing'); else if(item!=='Overview') setNotice(`${item} selected — this demo view keeps your overview visible.`); else setNotice('');};
 const saveStock=()=>{const n=Number(quantity);if(quantity===''||!Number.isInteger(n)||n<0){setNotice('Enter a valid stock quantity (zero or more).');return;}setStock(prev=>prev.map((v,i)=>i===selected?n:v));setNotice('Stock quantity updated.');setShowStock(false);setQuantity('');};
 return <div className={styles.shell}>
  <aside className={styles.sidebar}>{nav.map((item,i)=><button key={item} onClick={()=>handleNav(item)} className={tab===item?styles.activeNav:styles.navItem}>{i===0?'◉ ':''}{item}</button>)}</aside>
  <main className={styles.main}>
   <button type="button" className={styles.dashboardLogout} onClick={onLogout}>↪ Log out</button>
   <header className={styles.heading}><h1>Make room for good business.</h1><p>08 Role workspaces / Seller dashboard<br/>{user?.storeName || 'Studio Nook'} · Lekki, Lagos · Seller workspace · 11 Oct 2026</p></header>
   <section className={styles.stats}>{[['₦1.84m','Revenue · Oct','Gross paid sales · +12%'],['8','To fulfil','3 dispatches due today'],['24','Live listings','2 low-stock items'],['₦145,000','Pending payout','Held until delivery accepted']].map(([v,l,s])=><article className={styles.stat} key={l}><strong>{v}</strong><span>{l}</span><small>{s}</small></article>)}</section>
   <div className={styles.columns}><div className={styles.left}>
    <section className={styles.card}><h2>Revenue this week · ₦620,000</h2><div className={styles.chart} aria-label="Illustrative weekly revenue bar chart">{[34,57,45,79,64,100,77].map((h,i)=><div className={styles.barWrap} key={i}><div className={styles.bar} style={{height:`${h}%`}}/><span>{['M','T','W','T','F','S','S'][i]}</span></div>)}</div><p className={styles.note}>5–11 Oct · Gross revenue before refunds and fees · Illustrative values</p></section>
    <section className={styles.card}><h2>Fulfilment queue</h2>{orders.map(o=><div className={styles.order} key={o.id}><p>{o.id} · {o.item}</p><p>Amount: {o.amount}　/　Dispatch target: {o.target} · {o.status}　/　Action: <button className={styles.inlineLink} onClick={()=>setNotice(`${o.action} selected for ${o.id}.`)}>{o.action}</button></p></div>)}</section>
   </div><aside className={styles.right}><section className={styles.card}><h2>Stock needs attention</h2><p>! 2 low-stock listings</p><p>Reading lamp · {stock[2]} units left</p><p>Walnut side table · {stock[1]} unit{stock[1]===1?'':'s'} left</p><button className={styles.primary} onClick={()=>{setSelected(1);setQuantity(String(stock[1]));setShowStock(true)}}>Update stock</button><button className={styles.inlineLink} onClick={()=>{setSelected(0);setQuantity(String(stock[0]));setShowStock(true)}}>Add inventory</button></section>
    <section className={styles.card}><h2>Payout clarity</h2><h3>₦145,000 pending</h3><p>KH-10482 chair proceeds are not available until delivery and the acceptance window clear.</p><button className={styles.inlineLink} onClick={()=>setNotice('Settlement ledger opened — illustrative payout data only.')}>View settlement</button></section></aside></div>
   <section className={styles.card + ' ' + styles.inventory}><h2>Inventory snapshot</h2>{inventory.map((item,i)=><div className={styles.inventoryRow} key={item.sku}><p>{item.name}</p><p>SKU / stock: {item.sku} · {stock[i]} unit{stock[i]===1?'':'s'}　/　Visibility: {item.visibility} · {item.price}　/　Manage: <button className={styles.inlineLink} onClick={()=>{setSelected(i);setQuantity(String(stock[i]));setShowStock(true)}}>{item.action}</button></p></div>)}</section>
   {showStock&&<section className={styles.stockEditor}><h2>Update inventory</h2><label>Item<select value={selected} onChange={e=>{const i=Number(e.target.value);setSelected(i);setQuantity(String(stock[i]));}}>{inventory.map((it,i)=><option key={it.sku} value={i}>{it.name}</option>)}</select></label><label>Quantity<input type="number" min="0" value={quantity} onChange={e=>setQuantity(e.target.value)}/></label><button className={styles.primary} onClick={saveStock}>Save quantity</button><button className={styles.inlineLink} onClick={()=>setShowStock(false)}>Cancel</button></section>}
   <section className={styles.alert}><p>State example · {notice?'Stock update status':'Stock update failed'}</p><p>{notice || "We couldn't save the new quantity. The entered value is retained; retry before promising dispatch."}</p><button className={styles.inlineLink} onClick={()=>{if(showStock)saveStock();else setNotice('Retry requested. Please update the stock quantity if needed.')}}>{notice?'Dismiss / continue':'Retry stock update'}</button></section>
  </main>
 </div>;
}
