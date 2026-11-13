import React, { useEffect, useState } from 'react';
import { ArrowUpRight, Megaphone } from 'lucide-react';
import styles from './SponsoredAds.module.css';
import { api } from './lib/api.js';

const money=value=>value==null?'Contact advertiser':`₦${(Number(value)/100).toLocaleString('en-NG',{maximumFractionDigits:2})}`;
export default function SponsoredAds({placement='home',onSelect=()=>{}}){
 const [ads,setAds]=useState([]);const [loading,setLoading]=useState(true);
 useEffect(()=>{let active=true;api.get('/ads?placement='+encodeURIComponent(placement)+'&limit=8',{auth:false}).then(value=>{if(active)setAds(Array.isArray(value)?value:[]);}).catch(()=>{if(active)setAds([]);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[placement]);
 if(loading||!ads.length)return null;
 return <section className={styles.section} aria-label="Sponsored listings"><div className={styles.heading}><span><Megaphone size={15}/> SPONSORED</span><h2>Featured on KHUB</h2><p>Promoted listings approved by the KHUB team.</p></div><div className={styles.grid}>{ads.map(ad=>{const item=ad.listing;if(!item)return null;return <button type="button" className={styles.card} key={ad.ad_pid} onClick={()=>onSelect(item)}><span className={styles.tag}>Sponsored</span><span className={styles.category}>{item.category} · {item.vertical}</span><strong>{item.title}</strong><span className={styles.description}>{item.description}</span><span className={styles.bottom}>{money(item.effective_price_kobo??item.price_kobo)} <ArrowUpRight size={15}/></span></button>;})}</div></section>;
}
