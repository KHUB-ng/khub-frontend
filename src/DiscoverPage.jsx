import React, { useMemo, useState } from 'react';
import { ArrowUpRight, Heart, Search, SlidersHorizontal, X, Menu, ArrowRight, ShieldCheck } from 'lucide-react';
import styles from './DiscoverPage.module.css';
import chair from './assets/chair.jpg';
import rental from './assets/rental.jpg';
import service from './assets/service.jpg';
import headphones from './assets/headphones.jpg';
import camera from './assets/camera.jpg';

const listings = [
  { id: 101, title: 'Walnut desk & shelf', category: 'Furniture & home', type: 'Product', location: 'Advertised · Product · Lekki, Lagos', price: 120000, priceLabel: '₦120,000', image: chair, verified: true, available: true },
  { id: 102, title: 'Daylight studio space', category: 'Rentals', type: 'Rental', location: 'Identity verified · Rental · Yaba, Lagos', price: 25000, priceLabel: '₦25,000 / day', image: rental, verified: true, available: true },
  { id: 103, title: 'Brand identity design', category: 'Creative services', type: 'Service', location: 'Identity verified · Service · Remote · Ada Studio', price: 45000, priceLabel: 'From ₦45,000', image: service, verified: true, available: true },
  { id: 104, title: 'Creative project manager', category: 'Jobs', type: 'Job', location: 'Full-time · Job · Cedar Digital · Hybrid', price: 350000, priceLabel: '₦350,000–₦500,000 / mo', description: 'Coordinate digital projects with a small, ambitious creative team.', verified: false, available: true },
  { id: 105, title: 'Wireless headphones', category: 'Electronics', type: 'Product', location: 'Identity verified · Product · Ikeja, Lagos', price: 58000, priceLabel: '₦58,000', image: headphones, verified: true, available: false },
  { id: 106, title: 'Camera kit for rent', category: 'Rentals', type: 'Rental', location: 'Rental · Yaba, Lagos · Dates available', price: 18000, priceLabel: '₦18,000 / day', image: camera, verified: true, available: true },
  { id: 107, title: 'Walnut bedside lamp', category: 'Furniture & home', type: 'Product', location: 'Local maker · Wuse, Abuja · Handmade', price: 32000, priceLabel: '₦32,000', image: chair, verified: false, available: true },
  { id: 108, title: 'Operations coordinator', category: 'Jobs', type: 'Job', location: 'Full-time · On-site · Riverline Commerce', price: 250000, priceLabel: '₦250,000–₦350,000 / mo', description: 'Coordinate daily operations and support a growing team.', verified: true, available: false },
];

export default function DiscoverPage({ onHome = () => {}, onAccount = () => {}, initialQuery = '' }) {
  const [search, setSearch] = useState(initialQuery);
  const [searchEdited, setSearchEdited] = useState(Boolean(initialQuery));
  const [tab, setTab] = useState('All');
  const [category, setCategory] = useState(['Furniture & home']);
  const [verified, setVerified] = useState(true);
  const [available, setAvailable] = useState(false);
  const [minPrice, setMinPrice] = useState('10000');
  const [maxPrice, setMaxPrice] = useState('250000');
  const [location, setLocation] = useState('Lagos, Nigeria');
  const [sort, setSort] = useState('Recommended');
  const [applied, setApplied] = useState({ category: [], verified: false, available: false, min: 0, max: Infinity, location: 'Lagos, Nigeria', sort: 'Recommended' });
  const [saved, setSaved] = useState([]);
  const [count, setCount] = useState(4);
  const [modal, setModal] = useState(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  const toggleCategory = name => setCategory(current => current.includes(name) ? current.filter(item => item !== name) : [...current, name]);
  const applyFilters = () => { setApplied({ category: [...category], verified, available, min: Number(minPrice) || 0, max: Number(maxPrice) || Infinity, location, sort }); setCount(4); };
  const clearFilters = () => {
    setCategory([]); setVerified(false); setAvailable(false); setMinPrice('0'); setMaxPrice('1000000'); setLocation('Lagos, Nigeria'); setSort('Recommended');
    setApplied({ category: [], verified: false, available: false, min: 0, max: 1000000, location: 'Lagos, Nigeria', sort: 'Recommended' }); setCount(4);
  };
  const filtered = useMemo(() => {
    let result = listings.filter(item => {
      const query = searchEdited ? search.trim().toLowerCase() : '';
      const textMatch = !query || `${item.title} ${item.category} ${item.location} ${item.type} ${item.description || ''}`.toLowerCase().includes(query);
      const tabMatch = tab === 'All' || (tab === 'Products' && item.type === 'Product') || (tab === 'Rentals' && item.type === 'Rental') || (tab === 'Services' && item.type === 'Service') || (tab === 'Jobs' && item.type === 'Job');
      const categoryMatch = !applied.category.length || applied.category.includes(item.category);
      return textMatch && tabMatch && categoryMatch && (!applied.verified || item.verified) && (!applied.available || item.available) && item.price >= applied.min && item.price <= applied.max;
    });
    if (applied.sort === 'Price: low to high') result.sort((a, b) => a.price - b.price);
    if (applied.sort === 'Price: high to low') result.sort((a, b) => b.price - a.price);
    return result;
  }, [search, searchEdited, tab, applied]);

  const toggleSave = id => setSaved(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  const openDetails = item => setModal(item);
  const jumpToFilters = () => { setShowFilters(true); document.getElementById('khub-discover-filters')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

  return <div className={styles.page}>
<main className={styles.main}>
      <div className={styles.breadcrumb}>01 / DISCOVER / UNIFIED SEARCH</div>
      <h1>Find your next good thing</h1>
      <p className={styles.subtitle}>Results across KHUB, tailored to Lagos.</p>

      <label className={styles.unifiedSearch}>
        <Search size={19} aria-hidden="true" />
        <span><small>Search all of KHUB</small><input value={search} onChange={event => { setSearch(event.target.value); setSearchEdited(true); setCount(4); }} placeholder="Products, rentals, services or jobs" aria-label="Search all of KHUB" /></span>
        {search && <button type="button" onClick={() => { setSearch(''); setSearchEdited(true); }} aria-label="Clear search"><X size={17} /></button>}
      </label>

      <div className={styles.tabs} role="tablist" aria-label="Listing type">
        {['All', 'Products', 'Rentals', 'Services', 'Jobs'].map((name, index) => <button key={name} role="tab" aria-selected={tab === name} className={tab === name ? styles.tabActive : styles.tab} onClick={() => { setTab(name); setCount(4); }}>{name} <span>{[24, 8, 6, 5, 5][index]}</span></button>)}
      </div>

      <div className={`${styles.layout} ${!showFilters ? styles.layoutWide : ''}`}>
        {showFilters && <aside className={styles.filterPanel} id="khub-discover-filters">
          <h2>Refine your results</h2>
          <label className={styles.filterField}>Location<select value={location} onChange={event => setLocation(event.target.value)}><option>Lagos, Nigeria</option><option>Abuja, Nigeria</option><option>Port Harcourt, Nigeria</option><option>Anywhere in Nigeria</option></select></label>
          <div className={styles.priceField}><label htmlFor="khub-min-price">Price range (₦)</label><div><input id="khub-min-price" type="number" min="0" value={minPrice} onChange={event => setMinPrice(event.target.value)} aria-label="Minimum price"/><span>—</span><input type="number" min="0" value={maxPrice} onChange={event => setMaxPrice(event.target.value)} aria-label="Maximum price" /></div></div>
          <fieldset className={styles.categoryFilters}><legend>Category</legend>{['Furniture & home', 'Electronics', 'Creative services', 'Rentals', 'Jobs'].map(name => <label key={name}><input type="checkbox" checked={category.includes(name)} onChange={() => toggleCategory(name)} />{name}</label>)}</fieldset>
          <div className={styles.filterChecks}><label><input type="checkbox" checked={verified} onChange={event => setVerified(event.target.checked)} />Identity-verified sellers</label><label><input type="checkbox" checked={available} onChange={event => setAvailable(event.target.checked)} />Available today</label></div>
          <label className={styles.filterField}>Sort by<select value={sort} onChange={event => setSort(event.target.value)}><option>Recommended</option><option>Price: low to high</option><option>Price: high to low</option></select></label>
          <button className={styles.applyButton} onClick={applyFilters}>Apply filters</button><button className={styles.clearButton} onClick={clearFilters}>Clear all</button>
        </aside>}

        <section className={styles.results} aria-label="Search results">
          <div className={styles.resultToolbar}><span>{filtered.length === 0 ? 'No' : (searchEdited || tab !== 'All' ? filtered.length : 24)} results · {applied.sort}</span><button onClick={() => { if (!showFilters) setShowFilters(true); else jumpToFilters(); }}><SlidersHorizontal size={15}/>{showFilters ? 'Filters & sort' : 'Filters & sort'}</button></div>
          <div className={styles.activeChips}>{applied.category.map(name => <button key={name} onClick={() => { setCategory(current => current.filter(value => value !== name)); setApplied(current => ({ ...current, category: current.category.filter(value => value !== name) })); }}>{name} ×</button>)}{applied.verified && <button onClick={() => { setVerified(false); setApplied(current => ({ ...current, verified: false })); }}>Identity verified ×</button>}</div>
          <div className={styles.cards}>{filtered.slice(0, count).map(item => <article className={styles.card} key={item.id}>
            {item.image && <img className={styles.cardImage} src={item.image} alt={item.title} />}
            <div className={styles.cardBody}><h3>{item.title}</h3><p>{item.location}</p>{item.description && <p>{item.description}</p>}<strong>{item.priceLabel}</strong><div className={styles.cardActions}><button onClick={() => openDetails(item)}>View details <ArrowUpRight size={14}/></button><button onClick={() => toggleSave(item.id)}><Heart size={15} fill={saved.includes(item.id) ? 'currentColor' : 'none'}/>{saved.includes(item.id) ? 'Saved' : 'Save'}</button></div></div>
          </article>)}{filtered.length === 0 && <div className={styles.empty}>No results match these filters. Try changing your search or <button onClick={clearFilters}>clear all filters</button>.</div>}</div>
          <div className={styles.resultsBottom}>Showing {Math.min(count, filtered.length)} of {filtered.length || 0} results · Page 1 of {Math.max(1, Math.ceil(filtered.length / 4))}<button disabled={count >= filtered.length} onClick={() => setCount(value => value + 4)}>Load more results</button></div>
          <p className={styles.resultsNote}>Filters apply to each category where relevant. Job results use salary and employment filters.</p>
        </section>
      </div>
    </main>

    <footer className={styles.footer}><span>© KHUB · Privacy · Terms · Illustrative marketplace content</span><span><button onClick={() => setModal({ title: 'Trust & safety', location: 'Identity checks are labelled. Keep payments on KHUB and report suspicious listings.' })}>Trust & safety</button><i>/</i><button onClick={() => setModal({ title: 'Contact support', location: 'Tell our support team what you need help with.' })}>Contact support</button></span></footer>

    {modal && <div className={styles.backdrop} onMouseDown={event => { if (event.target === event.currentTarget) setModal(null); }}><section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="khub-modal-title"><button className={styles.modalClose} onClick={() => setModal(null)} aria-label="Close dialog"><X size={19}/></button><span className={styles.modalTag}><ShieldCheck size={14}/> KHUB · Discover</span><h2 id="khub-modal-title">{modal.title}</h2>{modal.image && <img className={styles.modalImage} src={modal.image} alt={modal.title}/>}<p>{modal.priceLabel && <strong>{modal.priceLabel} · </strong>}{modal.location || 'Explore this listing and connect with the seller for more information.'}</p><button className={styles.applyButton} onClick={() => setModal(null)}>Got it <ArrowRight size={15}/></button></section></div>}
  </div>;
}
