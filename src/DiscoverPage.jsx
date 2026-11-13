import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Heart, Search, SlidersHorizontal, X, Menu, ArrowRight } from 'lucide-react';
import styles from './DiscoverPage.module.css';
import { listingsApi } from './lib/listings.js';

const money = kobo => '₦' + (Number(kobo || 0) / 100).toLocaleString('en-NG');
const verticals = ['All', 'product', 'rental', 'service', 'job'];
const labels = { product: 'Products', rental: 'Rentals', service: 'Services', job: 'Jobs' };
const safeRows = payload => Array.isArray(payload) ? payload : payload?.items || [];

export default function DiscoverPage({ onHome=()=>{}, onAccount=()=>{}, onNavigate=()=>{}, initialQuery='' }) {
  const [search,setSearch]=useState(initialQuery);
  const [tab,setTab]=useState('All');
  const [category,setCategory]=useState('');
  const [location,setLocation]=useState('');
  const [minPrice,setMinPrice]=useState('');
  const [maxPrice,setMaxPrice]=useState('');
  const [sort,setSort]=useState('newest');
  const [applied,setApplied]=useState({});
  const [items,setItems]=useState([]);
  const [page,setPage]=useState(1);
  const [meta,setMeta]=useState({total_items:0,total_pages:1});
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [selected,setSelected]=useState(null);
  const [detailLoading,setDetailLoading]=useState(false);
  const [mobileMenu,setMobileMenu]=useState(false);
  const [saved,setSaved]=useState([]);
  const [showFilters,setShowFilters]=useState(true);

  useEffect(()=>{
    let active=true;
    listingsApi.wishlist().then(rows=>{
      if(active)setSaved((Array.isArray(rows)?rows:[]).map(row=>row.pid));
    }).catch(()=>{});
    return()=>{active=false;};
  },[]);

  useEffect(()=>{
    let active=true;
    setLoading(true);setError('');
    const params={
      vertical:tab==='All'?undefined:tab,
      category:applied.category||undefined,
      location:applied.location||undefined,
      min_price:applied.minPrice||undefined,
      max_price:applied.maxPrice||undefined,
      sort:applied.sort||'newest',
      page,page_size:24,
    };
    const request=search.trim()
      ? listingsApi.search({q:search.trim(),vertical:params.vertical,category:params.category,location:params.location,min_price:params.min_price,max_price:params.max_price,sort:params.sort,page,page_size:24})
      : listingsApi.browse(params);
    request.then(payload=>{
      if(!active)return;
      const rows=safeRows(payload);
      setItems(rows);
      setMeta({total_items:payload?.total_items??rows.length,total_pages:payload?.total_pages??1});
    }).catch(err=>{if(active)setError(err?.message||'KHUB listings could not be loaded.');})
      .finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[search,tab,applied,page]);

  const applyFilters=()=>{setApplied({category,location,minPrice,maxPrice,sort});setPage(1);};
  const clearFilters=()=>{setSearch('');setTab('All');setCategory('');setLocation('');setMinPrice('');setMaxPrice('');setSort('newest');setApplied({});setPage(1);};
  const toggleSave=async pid=>{
    try{
      const result=await listingsApi.toggleWishlist(pid);
      setSaved(old=>result.saved?(old.includes(pid)?old:[...old,pid]):old.filter(x=>x!==pid));
      setError('');
    }catch(err){setError(err?.message||'Sign in to save listings to your KHUB wishlist.');}
  };
  const openDetails=async row=>{
    setSelected(row);setDetailLoading(true);
    try{const payload=await listingsApi.detail(row.pid);setSelected(current=>current?.pid===row.pid?{...current,...(payload?.listing||payload),images:payload?.images||[]}:current);}
    catch(err){setError(err?.message||'Listing details could not be loaded.');}
    finally{setDetailLoading(false);}
  };
  const goToVertical=vertical=>onNavigate(vertical==='product'?'shop':vertical==='rental'?'rentals':vertical==='service'?'services':'jobs');
  const rows=useMemo(()=>items,[items]);

  return <div className={styles.page}>
    <header className={styles.header}><div className={styles.navInner}>
      <button className={styles.logo} onClick={onHome}>KHUB</button><button className={styles.menuButton} onClick={()=>setMobileMenu(v=>!v)} aria-label="Toggle navigation"><Menu size={20}/></button>
      <nav className={`${styles.nav} ${mobileMenu?styles.navOpen:''}`}><button className={styles.navSelected} onClick={onHome}>Discover</button><button onClick={()=>onNavigate('shop')}>Shop</button><button onClick={()=>onNavigate('rentals')}>Rentals</button><button onClick={()=>onNavigate('services')}>Services</button><button onClick={()=>onNavigate('jobs')}>Jobs</button></nav>
      <button className={styles.signInButton} onClick={onAccount}>Sign in</button><button className={styles.listButton} onClick={()=>onNavigate('account')}>Start selling</button>
    </div></header>
    <main className={styles.main}>
      <div className={styles.breadcrumb}>01 / DISCOVER / LIVE MARKETPLACE</div>
      <h1>Find your next good thing</h1>
      <p className={styles.subtitle}>Search current listings published by KHUB members. Results come directly from the KHUB API.</p>
      <label className={styles.unifiedSearch}><Search size={19}/><span><small>Search all of KHUB</small><input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Products, rentals, services or jobs" aria-label="Search all of KHUB"/></span>{search&&<button type="button" onClick={()=>setSearch('')} aria-label="Clear search"><X size={17}/></button>}</label>
      <div className={styles.tabs} role="tablist" aria-label="Listing type">{verticals.map(value=><button key={value} role="tab" aria-selected={tab===value} className={tab===value?styles.tabActive:styles.tab} onClick={()=>{setTab(value);setPage(1);}}>{labels[value]||value}</button>)}</div>
      <div className={`${styles.layout} ${!showFilters?styles.layoutWide:''}`}>
        {showFilters&&<aside className={styles.filterPanel}><h2>Refine live listings</h2>
          <label className={styles.filterField}>Location<input value={location} onChange={e=>setLocation(e.target.value)} placeholder="City or area"/></label>
          <div className={styles.priceField}><label>Price range (₦)</label><div><input type="number" min="0" value={minPrice} onChange={e=>setMinPrice(e.target.value)} aria-label="Minimum price"/><span>—</span><input type="number" min="0" value={maxPrice} onChange={e=>setMaxPrice(e.target.value)} aria-label="Maximum price"/></div></div>
          <label className={styles.filterField}>Category<input value={category} onChange={e=>setCategory(e.target.value)} placeholder="Exact category"/></label>
          <label className={styles.filterField}>Sort by<select value={sort} onChange={e=>setSort(e.target.value)}><option value="newest">Newest</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option></select></label>
          <button className={styles.applyButton} onClick={applyFilters}>Apply filters</button><button className={styles.clearButton} onClick={clearFilters}>Clear all</button>
        </aside>}
        <section className={styles.results} aria-label="Live marketplace results">
          <div className={styles.resultToolbar}><span>{meta.total_items} live listings · Page {page} of {meta.total_pages}</span><button onClick={()=>setShowFilters(v=>!v)}><SlidersHorizontal size={15}/> Filters &amp; sort</button></div>
          {loading&&<div className={styles.empty}>Loading live KHUB listings…</div>}
          {!loading&&error&&<div className={styles.empty} role="alert">{error}<button onClick={()=>setPage(p=>p)}>Retry</button></div>}
          {!loading&&!error&&<div className={styles.cards}>{rows.map(row=><article className={styles.card} key={row.pid}>
            {row.image_url&&<img className={styles.cardImage} src={row.image_url} alt={row.title}/>}
            <div className={styles.cardBody}><h3>{row.title}</h3><p>{labels[row.vertical]||row.vertical} · {row.category||'General'} · {row.location||'Location not provided'}</p><p>{row.description}</p><strong>{row.price_display||money(row.effective_price_kobo??row.price_kobo)}</strong><div className={styles.cardActions}><button onClick={()=>openDetails(row)}>View details <ArrowUpRight size={14}/></button><button onClick={()=>toggleSave(row.pid)}><Heart size={14} fill={saved.includes(row.pid)?'currentColor':'none'}/>{saved.includes(row.pid)?'Saved':'Save'}</button></div></div>
          </article>)}{rows.length===0&&<div className={styles.empty}>No active KHUB listings match these filters.</div>}</div>}
          {!loading&&!error&&<div className={styles.resultsBottom}><span>Showing {rows.length} of {meta.total_items} live listings</span><div><button disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Previous</button> <button disabled={page>=meta.total_pages} onClick={()=>setPage(p=>p+1)}>Next <ArrowRight size={14}/></button></div></div>}
          <p className={styles.resultsNote}>Listing availability, pricing, status and saved items are managed by the KHUB backend.</p>
        </section>
      </div>
    </main>
    <footer className={styles.footer}><span>© KHUB · Privacy · Terms</span><span>Trust &amp; safety / Contact support</span></footer>
    {selected&&<div className={styles.backdrop} onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null);}}><section className={styles.modal}><button className={styles.modalClose} onClick={()=>setSelected(null)} aria-label="Close listing details"><X size={18}/></button><span className={styles.modalTag}>{labels[selected.vertical]||selected.vertical} / LIVE LISTING</span><h2>{selected.title}</h2>{detailLoading&&<p>Loading listing details…</p>}{selected.images?.[0]&&<img className={styles.modalImage} src={selected.images[0]} alt={selected.title}/>}<p>{selected.location||'Location not provided'} · {selected.category}</p><strong>{selected.price_display||money(selected.effective_price_kobo??selected.price_kobo)}</strong><p>{selected.description}</p><div className={styles.cardActions}><button className={styles.applyButton} onClick={()=>{const vertical=selected.vertical;setSelected(null);goToVertical(vertical);}}>Open {labels[selected.vertical]||'listing'} section</button><button className={styles.clearButton} onClick={()=>{setSelected(null);onNavigate('messages');}}>Open KHUB chat</button></div></section></div>}
  </div>;
}
