import React, { useEffect, useState } from 'react';
import styles from './ServicesPage.module.css';
import { listingsApi } from './lib/listings.js';
import LiveMap from './LiveMap.jsx';

const money = amount => `₦${Number(amount || 0).toLocaleString('en-NG')}`;
const mapService = row => ({ ...row, id: row.pid, pid: row.pid, title: row.title, category: row.category || 'Service', provider: 'KHUB service provider', location: row.location || 'Nigeria', price: (row.effective_price_kobo ?? row.price_kobo ?? 0) / 100, image: null });

export default function ServicesPage({ onHome, onNavigate }) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All services');
  const [location, setLocation] = useState('');
  const [providers, setProviders] = useState([]);
  const [selected, setSelected] = useState(null);
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

  if (selected) {
    const related = providers.filter(item => item.pid !== selected.pid && item.category === selected.category).slice(0,4);
    return <main className={styles.page}><section className={styles.intro}><button className={styles.viewLink} onClick={()=>setSelected(null)}>← Back to services</button><p className={styles.breadcrumb}>04 Services / Listing detail</p><h1>{selected.title}</h1><p className={styles.subtitle}>{selected.category} · {selected.location}</p></section><section className={styles.cardBody}><h2>Service details</h2><p>{selected.description||'The provider has not supplied a detailed description yet. Contact the provider through KHUB to confirm scope, timing and terms.'}</p><p className={styles.price}>{selected.price>0?money(selected.price):'Contact provider'}</p><LiveMap label={selected.title+' service area map'} query={selected.location}/><button className={styles.viewLink} onClick={()=>onNavigate?.('messages')}>Message provider</button></section><section className={styles.results}><h2>Related services</h2><div className={styles.providerGrid}>{related.map(item=><article className={styles.card} key={item.pid}><div className={styles.cardBody}><p>{item.category} · {item.location}</p><h3><button className={styles.viewLink} onClick={()=>setSelected(item)}>{item.title}</button></h3><p>{item.description}</p><strong className={styles.price}>{item.price>0?money(item.price):'Contact provider'}</strong></div></article>)}</div>{related.length===0&&<p>No related live services are available right now.</p>}</section></main>;
  }

  const categories = ['All services', 'Accounting & Bookkeeping', 'Architecture & Interior Design', 'Beauty & Personal Care', 'Business Consulting', 'Cleaning & Home Care', 'Construction & Building', 'Content Writing & Editing', 'Data & Research', 'Digital Marketing', 'Education & Tutoring', 'Electrical Services', 'Events & Catering', 'Fashion Design & Tailoring', 'Film, Photography & Video', 'Graphic Design & Branding', 'Health, Fitness & Wellness', 'IT Support & Networking', 'Legal & Compliance', 'Mechanics & Auto Services', 'Moving & Installation', 'Plumbing & HVAC', 'Repairs & Maintenance', 'Software & Web Development', 'Transport & Logistics', 'Virtual Assistance & Admin', 'Welding & Fabrication'];
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
          {provider.image ? <img className={styles.providerImage} src={provider.image} alt={provider.title}/> : <div className={styles.providerImageFallback}>No image uploaded</div>}
          <div className={styles.cardBody}><p className={styles.verified}>Live KHUB listing · {provider.category}</p><h2><button className={styles.viewLink} onClick={()=>setSelected(provider)}>{provider.title}</button></h2><p>{provider.location} · {provider.provider}</p><p>{provider.description}</p><p className={styles.price}>{provider.price > 0 ? money(provider.price) : 'Contact provider'}</p><div className={styles.providerMeta}><button className={styles.viewLink} onClick={()=>onNavigate?.('messages')}>Message provider</button><button className={styles.viewLink} onClick={()=>onNavigate?.('orders-bookings')}>View bookings</button></div></div>
        </article>)}{providers.length===0&&<div className={styles.empty}>No active service listings match your search.</div>}</div>}
      </section>
    </div>
  </main>;
}
