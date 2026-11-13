import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowUpRight, CalendarDays, MapPin, SlidersHorizontal } from 'lucide-react';
import styles from './RentalsPage.module.css';
import { listingsApi } from './lib/listings.js';

const money = value => `₦${Number(value || 0).toLocaleString('en-NG')}`;
const mapRental = row => ({ ...row, id: row.pid, pid: row.pid, title: row.title, location: row.location || 'Nigeria', price: (row.effective_price_kobo ?? row.price_kobo ?? 0) / 100, image: null, meta: row.description || row.category || 'Rental listing', type: row.category || 'Rental' });

export default function RentalsPage({ onHome, onShop, onNavigate }) {
  const [location, setLocation] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [type, setType] = useState('All rentals');
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState(false);
  const [selected, setSelected] = useState(null);
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    const params = { vertical: 'rental', page: 1, page_size: 40, location: location || undefined, category: type === 'All rentals' ? undefined : type };
    const request = query.trim() ? listingsApi.search({ q: query.trim(), vertical: 'rental', page: 1, page_size: 40 }) : listingsApi.browse(params);
    request.then(payload => {
      if (!active) return;
      const rows = Array.isArray(payload) ? payload : (payload?.items || []);
      setRentals(rows.map(mapRental));
      setError('');
    }).catch(err => { if (active) setError(err?.message || 'Rental listings could not be loaded.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [location, type, query]);

  const nights = start && end ? Math.max(1, Math.ceil((new Date(end) - new Date(start)) / 86400000)) : 0;
  const filtered = rentals.filter(item => !query || `${item.title} ${item.location} ${item.meta}`.toLowerCase().includes(query.toLowerCase()));

  return <div className={styles.page}>
    <main className={styles.main}>
      <div className={styles.eyebrow}>03 / RENTALS / LISTINGS</div>
      <h1>Own the moment. Rent the rest.</h1>
      <p className={styles.subtitle}>Browse live spaces, equipment and other rental listings from KHUB members.</p>
      <section className={styles.searchPanel}>
        <label><MapPin size={16}/>Where?<input value={location} onChange={e => setLocation(e.target.value)} placeholder="City or area"/></label>
        <label><CalendarDays size={16}/>Requested start date<input type="date" value={start} onChange={e => setStart(e.target.value)}/></label>
        <label><CalendarDays size={16}/>Requested end date<input type="date" min={start || undefined} value={end} onChange={e => setEnd(e.target.value)}/></label>
        <button className={styles.primary} onClick={() => setFilters(true)}>Search rentals</button>
      </section>
      <div className={styles.categories}>{['All rentals','Short stays','Equipment','Event spaces','Vehicles'].map(c=><button key={c} className={type===c?styles.activeCategory:''} onClick={()=>setType(c)}>{c}</button>)}</div>
      <div className={styles.resultsBar}><span>{filtered.length} live rental listings{nights ? ` · ${nights} requested days` : ''}</span><button onClick={()=>setFilters(v=>!v)}><SlidersHorizontal size={15}/> Filters</button></div>
      {filters && <div className={styles.filterPanel}><label>Search rentals<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Apartment, camera, studio..."/></label><button onClick={()=>{setType('All rentals');setQuery('');setLocation('');setStart('');setEnd('');}}>Clear filters</button></div>}
      {loading && <div className={styles.empty}>Loading live rental listings…</div>}
      {!loading && error && <div className={styles.empty} role="alert">{error}</div>}
      {!loading && !error && <section className={styles.grid}>{filtered.map(r=><article className={styles.card} key={r.pid}><div className={styles.photo}>{r.image ? <img src={r.image} alt={r.title}/> : <div className={styles.imageFallback}>No image uploaded</div>}<span>Listed on KHUB</span></div><div className={styles.cardBody}><h2>{r.title}</h2><p>{r.location} · {r.category}</p><strong>{r.price > 0 ? money(r.price) : 'Contact provider'} <em>{r.price > 0 ? 'listed price' : ''}</em></strong><div className={styles.links}><button onClick={()=>setSelected(r)}>View details <ArrowUpRight size={14}/></button><button onClick={()=>onNavigate?.('messages')}>Contact provider</button></div></div></article>)}{filtered.length===0&&<div className={styles.empty}>No active rental listings match those filters.</div>}</section>}
      <div className={styles.note}>Date selection here is a request only. Confirm availability and rental terms with the provider in KHUB messages before placing an order.</div>
    </main>
    <footer className={styles.footer}><span>© KHUB · Privacy · Terms</span><span>Trust & safety　/　Contact support</span></footer>
    {selected&&<div className={styles.overlay} onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null)}}><section className={styles.detail}><button className={styles.back} onClick={()=>setSelected(null)}><ArrowLeft size={16}/> Back to rentals</button>{selected.image ? <img src={selected.image} alt={selected.title}/> : <div className={styles.imageFallback}>No image uploaded</div>}<span className={styles.eyebrow}>RENTALS / LISTING DETAIL</span><h2>{selected.title}</h2><p>{selected.location} · {selected.category}</p><strong className={styles.detailPrice}>{selected.price > 0 ? money(selected.price) : 'Contact provider'}</strong><p>{selected.description || selected.meta}</p><p>{start && end ? `Requested dates: ${start} to ${end} (${nights} days). The provider must confirm availability.` : 'Choose requested dates on the search panel, then confirm availability with the provider.'}</p><button className={styles.primary} onClick={()=>{setSelected(null);onNavigate?.('messages')}}>Message provider to confirm dates</button></section></div>}
  </div>;
}
