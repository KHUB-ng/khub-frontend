import React, { useMemo } from 'react';
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2, Heart } from 'lucide-react';
import styles from './CartPage.module.css';

const money = value => `₦${Number(value || 0).toLocaleString('en-NG')}`;

export default function CartPage({ onNavigate, onBack = () => {}, cartItems = [], onUpdateCart }) {
  const items = cartItems;
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + Number(item.price || 0) * item.qty, 0), [items]);
  const update = next => onUpdateCart?.(next);
  const changeQty = (id, amount) => update(items.map(item => item.id === id ? { ...item, qty: Math.max(1, item.qty + amount) } : item));
  const remove = id => update(items.filter(item => item.id !== id));
  const toggleSaved = id => update(items.map(item => item.id === id ? { ...item, saved: !item.saved } : item));

  return <div className={styles.page}>
    <header className={styles.header}><div className={styles.headerInner}>
      <button className={styles.logo} onClick={() => onNavigate('home')} aria-label="KHUB home">KHUB</button>
      <nav><button onClick={() => onNavigate('discover')}>Discover</button><button onClick={() => onNavigate('shop')}>Shop</button><button onClick={() => onNavigate('rentals')}>Rent</button><button onClick={() => onNavigate('services')}>Services</button><button onClick={() => onNavigate('jobs')}>Jobs</button></nav>
      <button className={styles.listButton} onClick={() => onNavigate('account')}>List on KHUB</button>
    </div></header>
    <main className={styles.main}>
      <div style={{ marginBottom: 18 }}><button type="button" onClick={onBack} aria-label="Go back" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid #dce8df', background: '#fff', color: '#176b43', borderRadius: 999, padding: '10px 16px', fontWeight: 700, cursor: 'pointer' }}><ArrowLeft size={15}/> Back</button></div>
      <div className={styles.eyebrow}>07 / COMMERCE / CART</div>
      <h1>Your good finds, together</h1><p className={styles.subtitle}>{items.length} {items.length === 1 ? 'item' : 'items'} · {items.length ? 'Review before checkout.' : 'Your cart is empty.'}</p>
      <div className={styles.layout}>
        <section className={styles.left}>
          {items.length ? items.map(item => <article className={styles.product} key={item.id}>
            <img className={styles.productImage} src={item.image} alt={item.name}/>
            <div className={styles.productBody}><h2>{item.name}</h2><p className={styles.seller}>{item.seller || 'KHUB seller'}</p><strong className={styles.price}>{money(item.price)}</strong>
              <div className={styles.quantity}><span>Quantity</span><div><button aria-label={`Decrease ${item.name} quantity`} onClick={() => changeQty(item.id, -1)} disabled={item.qty <= 1}><Minus size={13}/></button><span>{item.qty}</span><button aria-label={`Increase ${item.name} quantity`} onClick={() => changeQty(item.id, 1)}><Plus size={13}/></button></div></div>
              <div className={styles.itemActions}><button onClick={() => toggleSaved(item.id)}><Heart size={14} fill={item.saved ? 'currentColor' : 'none'}/>{item.saved ? 'Saved for later' : 'Save for later'}</button><span>·</span><button onClick={() => remove(item.id)}><Trash2 size={14}/>Remove item</button></div>
            </div>
          </article>) : <div className={styles.empty}><ShoppingBag size={28}/><h2>Your cart is empty.</h2><p>Browse live listings and add products to your cart.</p><button className={styles.primary} onClick={() => onNavigate('shop')}>Explore the shop</button></div>}
          <button className={styles.continue} onClick={() => onNavigate('shop')}><ArrowLeft size={15}/> Continue shopping</button>
        </section>
        <aside className={styles.summary}><h2>Order summary</h2><p>Items ({items.reduce((n, i) => n + i.qty, 0)}) · {money(subtotal)}</p><hr/><h3>Total · {money(subtotal)}</h3><p>Final amount is calculated by the backend from each listing at order creation. No unverified delivery or discount fees are added here.</p><button className={styles.primary} disabled={!items.length} onClick={() => onNavigate('checkout')}>Continue to secure checkout</button><p className={styles.secure}>Protected KHUB wallet payment · Escrow release after order confirmation</p></aside>
      </div>
    </main>
    <footer className={styles.footer}><span>© KHUB · Privacy · Terms</span><span>Trust &amp; safety　/　Contact support</span></footer>
  </div>;
}
