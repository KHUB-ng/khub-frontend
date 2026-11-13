import React, { useEffect, useState } from 'react';
import styles from './ServicesPage.module.css';
import serviceImage from './assets/service.jpg';
import { listingsApi } from './lib/listings.js';

const money = amount => `₦${Number(amount || 0).toLocaleString('en-NG')}`;
const mapService = row => ({ ...row, id: row.pid, pid: row.pid, title: row.title, category: row.category || 'Service', provider: 'KHUB service provider', location: row.location || 'Nigeria', price: (row.effective_price_kobo ?? row.price_kobo ?? 0) / 100, image: serviceImage });

export default function ServicesPage({ onHome, onNavigate }) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All services');
  const [location, setLocation] = useState('');
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    const params = { vertical: 'service', page: 1, page_size: 40, category: activeCategory === 'All services' ? undefined : activeCategory, location: location || undefined };
    const request = search.trim()
      ? listingsApi.search({ q: search.trim(), vertical: 'service', category: params.category, page: 1, page_size: 40 })
      : listingsApi.browse(params);
    request.then(payload => {
      if (!active) return;
      const rows = Array.isArray(payload) ? payload : (payload?.items || []);
      setProviders(rows.map(mapService));
      setError('');
    }).catch(err => { if (active) setError(err?.message || 'Service listings could not be loaded.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [search, activeCategory, location]);

  const categories = ['All services', ...new Set(providers.map(item => item.category).filter(Boolean))];
  return <main className={styles.page}>
    <section className={styles.intro}>
      <h1>Good people. Great work.</h1>
      <p className={styles.breadcrumb}>04 Services / Services search</p>
      <p className={styles.subtitle}>Find skilled providers with live service listings and clear project details.</p>
      <label className={styles.searchBox}><span>Search services</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Brand design, websites, home repairs..."/></label>
      <label className={styles.searchBox}><span>Location</span><input value={location} onChange={e=>setLocation(e.target.value)} placeholder="City or area"/></label>
    </section>
    <nav className={styles.tabs} aria-label="Service categories">{categories.map(category=><button key={category} className={activeCategory===category?styles.activeTab:''} onClick={()=>setActiveCategory(category)}>{category}</button>)}</nav>
    <div className={styles.content}>
      <section className={styles.results}>
        <div className={styles.resultsTop}><p>{providers.length} live service listings</p></div>
        {loading && <div className={styles.empty}>Loading live service listings…</div>}
        {!loading && error && <div className={styles.empty} role="alert">{error}</div>}
        {!loading && !error && <div className={styles.providerGrid}>{providers.map(provider=><article className={styles.card} key={provider.pid}>
          <div className={styles.providerImage}><img src={provider.image} alt={provider.title}/><span>KHUB service listing</span></div>
          <div className={styles.cardBody}><p className={styles.providerMeta}>{provider.category}</p><h2>{provider.title}</h2><p>{provider.location} · {provider.provider}</p><p>{provider.description}</p><strong>{provider.price > 0 ? money(provider.price) : 'Contact provider'}</strong><div className={styles.providerMeta}><button className={styles.viewLink} onClick={()=>onNavigate?.('messages')}>Message provider</button><button className={styles.viewLink} onClick={()=>onNavigate?.('orders-bookings')}>View bookings</button></div></div>
        </article>)}{providers.length===0&&<div className={styles.empty}>No active service listings match your search.</div>}</div>}
      </section>
    </div>
  </main>;
}
