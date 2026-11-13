import React from 'react';
import { ArrowLeft, Heart, ShoppingBag, ShieldCheck, MapPin, CheckCircle2 } from 'lucide-react';
import styles from './ProductDetailPage.module.css';

const money = value => `₦${Number(value || 0).toLocaleString('en-NG')}`;

export default function ProductDetailPage({ product, products = [], onBack, onOpenProduct, onAddToCart, saved = false, onToggleSave }) {
  if (!product) return null;
  const related = products.filter(item => item.id !== product.id && (item.category === product.category || item.category?.toLowerCase().includes(product.category?.split(' ')[0]?.toLowerCase()))).slice(0, 4);
  const suggestions = related.length ? related : products.filter(item => item.id !== product.id).slice(0, 4);
  return <main className={styles.page}>
    <div className={styles.wrap}>
      <button className={styles.back} onClick={onBack}><ArrowLeft size={17}/> Back to products</button>
      <div className={styles.crumb}>KHUB / SHOP / PRODUCT DETAILS</div>
      <section className={styles.product}>
        <div className={styles.gallery}>{(product.images?.[0] || product.image) ? <img src={product.images?.[0] || product.image} alt={product.title || product.name}/> : <div className={styles.noImage}>No product image uploaded</div>}</div>
        <div className={styles.info}>
          <span className={styles.tag}><ShieldCheck size={14}/> Marketplace listing</span>
          <h1>{product.title || product.name}</h1>
          <p className={styles.category}>{product.category || 'Marketplace product'}</p>
          <div className={styles.price}>{money(product.price ?? String(product.priceLabel || product.price || '').replace(/[^0-9]/g, ''))}</div>
          <p className={styles.description}>{product.description || `${product.title || product.name} is listed on KHUB by ${product.seller || 'a local seller'}. Review the product information and contact the seller to confirm current availability, delivery options and any additional specifications before purchase.`}</p>
          <div className={styles.facts}><div><MapPin size={16}/><span>{product.location || product.city || 'Nigeria'}</span></div><div><CheckCircle2 size={16}/><span>{product.condition || (product.verified ? 'Identity-verified seller' : 'Availability to be confirmed')}</span></div><div><ShoppingBag size={16}/><span>Seller: {product.seller || 'KHUB marketplace seller'}</span></div></div>
          <div className={styles.actions}><button className={styles.primary} disabled={product.quantity === 0} onClick={() => onAddToCart?.(product)}><ShoppingBag size={17}/> {product.quantity === 0 ? 'Out of stock' : 'Add to cart'}</button><button className={styles.secondary} onClick={() => onToggleSave?.()}><Heart size={17} fill={saved ? 'currentColor' : 'none'}/>{saved ? 'Saved' : 'Save product'}</button></div>
          <p className={styles.note}>{product.quantity === 0 ? 'This listing is currently out of stock.' : product.quantity != null ? 'Available stock: ' + product.quantity + '. Confirm product condition and delivery arrangements before purchase.' : 'Please confirm stock, product condition and delivery arrangements with the seller before completing your purchase.'}</p>
        </div>
      </section>
      <section className={styles.related}><div className={styles.relatedHead}><div><span className={styles.crumb}>KEEP EXPLORING</span><h2>Related products</h2><p>More items you may like from the marketplace.</p></div></div>
        <div className={styles.grid}>{suggestions.map(item => <article className={styles.card} key={item.id} onClick={() => onOpenProduct?.(item)}>{item.images?.[0] || item.image ? <img src={item.images?.[0] || item.image} alt={item.title || item.name}/> : <div className={styles.noImage}>No image uploaded</div>}<div><h3>{item.title || item.name}</h3><p>{item.category}</p><strong>{money(item.price ?? String(item.priceLabel || '').replace(/[^0-9]/g, ''))}</strong><button onClick={() => onOpenProduct?.(item)}>View product <span>→</span></button></div></article>)}</div>
      </section>
    </div>
  </main>;
}
