import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Heart,
  Search,
  SlidersHorizontal,
  ShoppingBag
} from 'lucide-react';
import styles from './ShopPage.module.css';
import chair from './assets/chair.jpg';
import headphones from './assets/headphones.jpg';
import lamp from './assets/lamp.jpg';
import camera from './assets/camera.jpg';
import SellerListingForm from './SellerListingForm.jsx';
import ProductDetailPage from './ProductDetailPage.jsx';

const items = [
  { id: 1, title: 'The Lekki lounge chair', category: 'Furniture & home', location: 'Lekki, Lagos', city: 'Lagos', condition: 'New', price: 145000, image: chair, seller: 'Studio Nook', advertised: true, verified: false, availableToday: true },
  { id: 2, title: 'Wireless headphones', category: 'Electronics', location: 'Ikeja, Lagos', city: 'Lagos', condition: 'New', price: 58000, image: headphones, seller: 'Sound House', advertised: false, verified: true, availableToday: true },
  { id: 3, title: 'Walnut bedside lamp', category: 'Furniture & home', location: 'Wuse II, Abuja', city: 'Abuja', condition: 'Handmade', price: 32000, image: lamp, seller: 'Wood & Light', advertised: false, verified: true, availableToday: false },
  { id: 4, title: 'Lounge chair · Natural', category: 'Furniture & home', location: 'Port Harcourt', city: 'Port Harcourt', condition: 'New', price: 135000, image: chair, seller: 'Local maker', advertised: false, verified: false, availableToday: true },
  { id: 5, title: 'Creator camera kit', category: 'Electronics', location: 'Yaba, Lagos', city: 'Lagos', condition: 'Like new', price: 420000, image: camera, seller: 'Creator Supply', advertised: false, verified: false, availableToday: false },
  { id: 6, title: 'Studio headphones', category: 'Electronics', location: 'Lagos', city: 'Lagos', condition: 'New', price: 62000, image: headphones, seller: 'Sound House', advertised: false, verified: true, availableToday: true }
];

const topCategories = ['All products', 'Furniture', 'Electronics', 'Fashion', 'Home & living'];
const sidebarCategories = ['Furniture & home', 'Electronics', 'Creative services', 'Rentals', 'Jobs'];
const money = n => `₦${Number(n).toLocaleString('en-NG')}`;

function topCategoryMatches(product, category) {
  if (category === 'All products') return true;
  if (category === 'Furniture' || category === 'Home & living') return product.category === 'Furniture & home';
  return product.category === category;
}

export default function ShopPage({ onHome, onRent, onNavigate }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All products');
  const [location, setLocation] = useState('Lagos, Nigeria');
  const [minPrice, setMinPrice] = useState('10000');
  const [maxPrice, setMaxPrice] = useState('250000');
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [availableToday, setAvailableToday] = useState(false);
  const [checkedCategories, setCheckedCategories] = useState(['Furniture & home']);
  const [appliedFilters, setAppliedFilters] = useState(null);
  const [sortBy, setSortBy] = useState('Recommended');
  const [saved, setSaved] = useState([]);
  const [selected, setSelected] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const filtered = useMemo(() => {
    const active = appliedFilters;
    const search = query.trim().toLowerCase();
    let result = items.filter(p => {
      const matchesSearch = `${p.title} ${p.category} ${p.location} ${p.seller} ${p.condition}`.toLowerCase().includes(search);
      const matchesTop = topCategoryMatches(p, category);
      if (!active) return matchesSearch && matchesTop;
      const low = Number(active.minPrice) || 0;
      const high = active.maxPrice === '' ? Infinity : Number(active.maxPrice);
      const matchesLocation = active.location === 'All locations' || p.city === active.location.replace(', Nigeria', '');
      const matchesPrice = p.price >= low && p.price <= high;
      const matchesCategory = active.categories.length === 0 || active.categories.includes(p.category);
      return matchesSearch && matchesTop && matchesLocation && matchesPrice && matchesCategory &&
        (!active.verifiedOnly || p.verified) && (!active.availableToday || p.availableToday);
    });
    if (sortBy === 'Price: low to high') result = [...result].sort((a, b) => a.price - b.price);
    if (sortBy === 'Price: high to low') result = [...result].sort((a, b) => b.price - a.price);
    if (sortBy === 'Newest first') result = [...result].sort((a, b) => b.id - a.id);
    return result;
  }, [query, category, appliedFilters, sortBy]);

  const toggleSave = id => setSaved(old => old.includes(id) ? old.filter(x => x !== id) : [...old, id]);
  const toggleCategory = name => setCheckedCategories(old => old.includes(name) ? old.filter(x => x !== name) : [...old, name]);
  const applyFilters = () => {
    setAppliedFilters({ location, minPrice, maxPrice, verifiedOnly, availableToday, categories: [...checkedCategories] });
    setPageNumber(1);
    setShowMobileFilters(false);
  };
  const clearFilters = () => {
    setQuery('');
    setCategory('All products');
    setLocation('Lagos, Nigeria');
    setMinPrice('10000');
    setMaxPrice('250000');
    setVerifiedOnly(false);
    setAvailableToday(false);
    setCheckedCategories([]);
    setAppliedFilters(null);
    setSortBy('Recommended');
    setPageNumber(1);
    setShowMobileFilters(false);
  };
  if (selected) {
    return <ProductDetailPage product={selected} products={items} onBack={() => setSelected(null)} onOpenProduct={setSelected} saved={saved.includes(selected.id)} onToggleSave={() => toggleSave(selected.id)} onAddToCart={() => window.alert('Your product is selected. Cart checkout integration can be connected to your existing cart flow.')} />;
  }

  const goToPage = next => {
    setPageNumber(Math.max(1, Math.min(22, next)));
    document.querySelector(`.${styles.main}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const sidebar = (
    <aside className={`${styles.filters} ${showMobileFilters ? styles.filtersMobileOpen : ''}`}>
      <h2>Refine your results</h2>
      <label className={styles.filterField}>
        <span>Location</span>
        <select value={location} onChange={e => setLocation(e.target.value)}>
          <option>Lagos, Nigeria</option>
          <option>Abuja, Nigeria</option>
          <option>Port Harcourt</option>
          <option>All locations</option>
        </select>
      </label>
      <div className={styles.filterField}>
        <span>Price range (₦)</span>
        <div className={styles.priceRange}>
          <input type="number" min="0" value={minPrice} onChange={e => setMinPrice(e.target.value)} aria-label="Minimum price" />
          <span>—</span>
          <input type="number" min="0" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} aria-label="Maximum price" />
        </div>
      </div>
      <div className={styles.categoryFilters}>
        <h3>Category</h3>
        {sidebarCategories.map((name, i) => (
          <label className={styles.check} key={name}>
            <input type="checkbox" checked={checkedCategories.includes(name)} onChange={() => toggleCategory(name)} />
            <span>{name}</span>
          </label>
        ))}
      </div>
      <div className={styles.filterDivider} />
      <label className={styles.check}>
        <input type="checkbox" checked={verifiedOnly} onChange={e => setVerifiedOnly(e.target.checked)} />
        <span>Identity-verified sellers</span>
      </label>
      <label className={styles.check}>
        <input type="checkbox" checked={availableToday} onChange={e => setAvailableToday(e.target.checked)} />
        <span>Available today</span>
      </label>
      <label className={styles.filterField}>
        <span>Sort by</span>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option>Recommended</option>
          <option>Price: low to high</option>
          <option>Price: high to low</option>
          <option>Newest first</option>
        </select>
      </label>
      <button className={styles.apply} onClick={applyFilters}>Apply filters</button>
      <button className={styles.clear} onClick={clearFilters}>Clear all</button>
      <button className={styles.closeMobileFilters} onClick={() => setShowMobileFilters(false)}>Close filters</button>
    </aside>
  );

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.eyebrow}>03 / SHOPPING / PRODUCT LISTINGS</div>
        <h1>Thoughtful finds. Local prices.</h1>
        <p className={styles.subtitle}>Furniture, technology and everyday essentials from Nigerian sellers.</p>

        <label className={styles.search}>
          <Search size={18} aria-hidden="true" />
          <input value={query} onChange={e => { setQuery(e.target.value); setPageNumber(1); }} placeholder="Search products" aria-label="Search products" />
          {query && <button type="button" onClick={() => setQuery('')}>Clear</button>}
        </label>

        <div className={styles.categories} aria-label="Product categories">
          {topCategories.map(name => (
            <button key={name} onClick={() => { setCategory(name); setPageNumber(1); }} className={category === name ? styles.selectedCategory : ''} aria-pressed={category === name}>{name}</button>
          ))}
        </div>

        <div className={styles.shopLayout}>
          {sidebar}
          <section className={styles.productArea} aria-label="Shop products">
            <div className={styles.resultsBar}>
              <span>128 products in Lagos · {sortBy}</span>
              <button className={styles.desktopFilterButton} onClick={() => setShowMobileFilters(true)}><SlidersHorizontal size={15} /> Filter &amp; sort</button>
              <button className={styles.mobileFilterButton} onClick={() => setShowMobileFilters(true)}><SlidersHorizontal size={15} /> Filter &amp; sort</button>
            </div>

            <div className={styles.grid}>
              {filtered.map(p => (
                <article className={styles.card} key={p.id}>
                  <div className={styles.photo}>
                    <img src={p.image} alt={p.title} onClick={() => setSelected(p)} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && setSelected(p)} />
                    <button className={styles.heart} onClick={() => toggleSave(p.id)} aria-label={saved.includes(p.id) ? 'Remove saved item' : 'Save item'}>
                      <Heart size={18} fill={saved.includes(p.id) ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                  <div className={styles.cardBody}>
                    <h2><button type="button" onClick={() => setSelected(p)}>{p.title}</button></h2>
                    <p>{p.advertised ? 'Advertised' : p.verified ? 'Identity verified' : p.seller} · {p.location} · {p.condition}{p.advertised ? ` · ${p.seller}` : ''}</p>
                    <strong>{money(p.price)}</strong>
                    <div className={styles.links}>
                      <button onClick={() => setSelected(p)}>View details <ArrowUpRight size={14} /></button>
                      <button onClick={() => toggleSave(p.id)}><Heart size={14} fill={saved.includes(p.id) ? 'currentColor' : 'none'} />{saved.includes(p.id) ? 'Saved' : 'Save'}</button>
                    </div>
                  </div>
                </article>
              ))}
              {filtered.length === 0 && <div className={styles.empty}>No products match your search. Try another keyword or clear your filters.</div>}
            </div>

            <div className={styles.pagination}>
              <p>Showing {filtered.length} of 128 · Page {pageNumber} of 22</p>
              <div className={styles.pageControls}>
                {pageNumber > 1 && <button onClick={() => goToPage(pageNumber - 1)}><ArrowLeft size={14} /> Previous page</button>}
                <button onClick={() => goToPage(pageNumber + 1)} disabled={pageNumber >= 22}>Next page <ArrowRight size={14} /></button>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className={styles.footer}>
        <span>© KHUB · Privacy · Terms · Illustrative marketplace content</span>
        <span>Trust &amp; safety　/　Contact support</span>
      </footer>


    </div>
  );
}
