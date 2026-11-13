import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Heart, Search, SlidersHorizontal } from 'lucide-react';
import styles from './ShopPage.module.css';
import { listingsApi } from './lib/listings.js';
import ProductDetailPage from './ProductDetailPage.jsx';

const topCategories = ['All products', 'Phones & Accessories', 'Computers & Tablets', 'Electronics', 'Fashion & Clothing', 'Footwear', 'Furniture', 'Home & Kitchen', 'Beauty & Personal Care', 'Sports & Fitness', 'Books & Stationery', 'Food & Groceries', 'Automotive'];
const sidebarCategories = topCategories.slice(1);
const money = value => `₦${Number(value || 0).toLocaleString('en-NG')}`;
const mapListing = row => {
  const amount = row.effective_price_kobo ?? row.price_kobo ?? 0;
  return { id: row.pid, pid: row.pid, title: row.title, name: row.title, category: row.category || 'Other', location: row.location || 'Nigeria', city: row.location || 'Nigeria', condition: row.attributes?.condition || 'Listed on KHUB', price: amount / 100, numericPrice: amount / 100, priceKobo: amount, image: null, seller: 'Seller on KHUB', description: row.description, vertical: row.vertical, status: row.status, quantity: row.quantity };
};

export default function ShopPage({ onHome, onRent, onNavigate, onAddToCart }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All products');
  const [location, setLocation] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [checkedCategories, setCheckedCategories] = useState([]);
  const [filters, setFilters] = useState(null);
  const [sortBy, setSortBy] = useState('Newest first');
  const [saved, setSaved] = useState([]);
  const [selected, setSelected] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ total_items: 0, total_pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    listingsApi.wishlist().then(rows => {
      if (active) setSaved((Array.isArray(rows) ? rows : []).map(row => row.pid));
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const params = {
      vertical: 'product', page: pageNumber, page_size: 24,
      sort: sortBy === 'Price: low to high' ? 'price_asc' : sortBy === 'Price: high to low' ? 'price_desc' : 'newest',
      category: category === 'All products' ? undefined : category,
      location: filters?.location || undefined,
      min_price: filters?.minPrice || undefined,
      max_price: filters?.maxPrice || undefined,
    };
    const request = query.trim()
      ? listingsApi.search({ q: query.trim(), vertical: 'product', category: params.category, page: pageNumber, page_size: 24 })
      : listingsApi.browse(params);
    request.then(payload => {
      if (!active) return;
      const rows = Array.isArray(payload) ? payload : (payload?.items || []);
      const mapped = rows.map(mapListing);
      const visible = filters?.categories?.length ? mapped.filter(item => filters.categories.includes(item.category)) : mapped;
      setItems(visible);
      setMeta({ total_items: payload?.total_items ?? visible.length, total_pages: payload?.total_pages ?? 1 });
      setError('');
    }).catch(err => { if (active) setError(err?.message || 'Products could not be loaded.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [query, category, filters, sortBy, pageNumber]);

  const toggleSave = async id => {
    try {
      const result = await listingsApi.toggleWishlist(id);
      setSaved(old => result.saved ? (old.includes(id) ? old : [...old, id]) : old.filter(x => x !== id));
      setError('');
    } catch (err) { setError(err?.message || 'Sign in to save listings to your KHUB wishlist.'); }
  };
  const openDetails = async product => {
    setSelected(product);
    try {
      const payload = await listingsApi.detail(product.pid);
      const listing = payload?.listing || payload;
      setSelected(current => current?.pid === product.pid ? { ...current, ...mapListing(listing), image: payload?.images?.[0] || current.image, images: payload?.images || [] } : current);
    } catch { /* Keep the listing card data if detail retrieval fails. */ }
  };
  if (selected) return <ProductDetailPage product={selected} products={items} onBack={() => setSelected(null)} onOpenProduct={openDetails} saved={saved.includes(selected.id)} onToggleSave={() => toggleSave(selected.id)} onAddToCart={product => onAddToCart?.({ ...product, id: product.pid || product.id, numericPrice: product.price })} />;

  const applyFilters = () => { setFilters({ location, minPrice, maxPrice, categories: [...checkedCategories] }); setPageNumber(1); setShowMobileFilters(false); };
  const clearFilters = () => { setQuery(''); setCategory('All products'); setLocation(''); setMinPrice(''); setMaxPrice(''); setCheckedCategories([]); setFilters(null); setSortBy('Newest first'); setPageNumber(1); setShowMobileFilters(false); };
  const sidebar = <aside className={`${styles.filters} ${showMobileFilters ? styles.filtersMobileOpen : ''}`}>
    <h2>Refine your results</h2>
    <label className={styles.filterField}><span>Location</span><input value={location} onChange={e => setLocation(e.target.value)} placeholder="City or area" /></label>
    <div className={styles.filterField}><span>Price range (₦)</span><div className={styles.priceRange}><input type="number" min="0" value={minPrice} onChange={e => setMinPrice(e.target.value)} aria-label="Minimum price" /><span>—</span><input type="number" min="0" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} aria-label="Maximum price" /></div></div>
    <div className={styles.categoryFilters}><h3>Category</h3>{sidebarCategories.map(name => <label className={styles.check} key={name}><input type="checkbox" checked={checkedCategories.includes(name)} onChange={() => setCheckedCategories(old => old.includes(name) ? old.filter(x => x !== name) : [...old, name])} /><span>{name}</span></label>)}</div>
    <label className={styles.filterField}><span>Sort by</span><select value={sortBy} onChange={e => setSortBy(e.target.value)}><option>Newest first</option><option>Price: low to high</option><option>Price: high to low</option></select></label>
    <button className={styles.apply} onClick={applyFilters}>Apply filters</button><button className={styles.clear} onClick={clearFilters}>Clear all</button><button className={styles.closeMobileFilters} onClick={() => setShowMobileFilters(false)}>Close filters</button>
  </aside>;

  return <div className={styles.page}><main className={styles.main}>
    <div className={styles.eyebrow}>03 / SHOPPING / PRODUCT LISTINGS</div><h1>Thoughtful finds. Local prices.</h1><p className={styles.subtitle}>Browse current product listings published by KHUB sellers.</p>
    <label className={styles.search}><Search size={18} aria-hidden="true" /><input value={query} onChange={e => { setQuery(e.target.value); setPageNumber(1); }} placeholder="Search products" aria-label="Search products" />{query && <button type="button" onClick={() => setQuery('')}>Clear</button>}</label>
    <div className={styles.categories} aria-label="Product categories">{topCategories.map(name => <button key={name} onClick={() => { setCategory(name); setPageNumber(1); }} className={category === name ? styles.selectedCategory : ''} aria-pressed={category === name}>{name}</button>)}</div>
    <div className={styles.shopLayout}>{sidebar}<section className={styles.productArea} aria-label="Shop products">
      <div className={styles.resultsBar}><span>{meta.total_items} products · {sortBy}</span><button className={styles.desktopFilterButton} onClick={() => setShowMobileFilters(true)}><SlidersHorizontal size={15} /> Filter &amp; sort</button><button className={styles.mobileFilterButton} onClick={() => setShowMobileFilters(true)}><SlidersHorizontal size={15} /> Filter &amp; sort</button></div>
      {loading && <div className={styles.empty}>Loading live KHUB listings…</div>}
      {!loading && error && <div className={styles.empty} role="alert">{error} <button onClick={() => setPageNumber(pageNumber)}>Retry</button></div>}
      {!loading && !error && <div className={styles.grid}>{items.map(p => <article className={styles.card} key={p.id}>
        <div className={styles.photo}>{p.image ? <button type="button" onClick={() => openDetails(p)} aria-label={`View ${p.title}`}><img src={p.image} alt={p.title} /></button> : <button type="button" onClick={() => openDetails(p)} aria-label={`View ${p.title}`} className={styles.photoPlaceholder}>KHUB listing</button>}<button className={styles.heart} onClick={() => toggleSave(p.id)} aria-label={saved.includes(p.id) ? 'Remove saved item' : 'Save item'}><Heart size={18} fill={saved.includes(p.id) ? 'currentColor' : 'none'} /></button></div>
        <div className={styles.cardBody}><h2><button type="button" onClick={() => openDetails(p)}>{p.title}</button></h2><p>{p.location} · {p.category}</p><strong>{money(p.price)}</strong><div className={styles.links}><button onClick={() => openDetails(p)}>View details <ArrowUpRight size={14} /></button><button onClick={() => toggleSave(p.id)}><Heart size={14} fill={saved.includes(p.id) ? 'currentColor' : 'none'} />{saved.includes(p.id) ? 'Saved' : 'Save'}</button></div></div>
      </article>)}{items.length === 0 && <div className={styles.empty}>No live products match your search. Try another keyword or clear your filters.</div>}</div>}
      <div className={styles.pagination}><p>Showing {items.length} of {meta.total_items} · Page {pageNumber} of {meta.total_pages}</p><div className={styles.pageControls}>{pageNumber > 1 && <button onClick={() => setPageNumber(p => p - 1)}><ArrowLeft size={14} /> Previous page</button>}<button onClick={() => setPageNumber(p => p + 1)} disabled={pageNumber >= meta.total_pages}>Next page <ArrowRight size={14} /></button></div></div>
    </section></div>
  </main><footer className={styles.footer}><span>© KHUB · Privacy · Terms</span><span>Trust &amp; safety　/　Contact support</span></footer></div>;
}
