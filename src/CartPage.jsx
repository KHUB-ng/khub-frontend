import React, { useMemo, useState } from 'react';
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2, Heart } from 'lucide-react';
import styles from './CartPage.module.css';
import chair from './assets/chair.jpg';
import headphones from './assets/headphones.jpg';

const initialItems = [
  { id: 1, name: 'The Lekki lounge chair', seller: 'Studio Nook · Forest green', price: 145000, image: chair, qty: 1, saved: false },
  { id: 2, name: 'Wireless headphones', seller: 'Sound House · Cream', price: 58000, image: headphones, qty: 1, saved: false },
];
const money = value => `₦${Number(value).toLocaleString('en-NG')}`;

export default function CartPage({ onNavigate, onBack = () => {}, cartItems, onUpdateCart }) {
  const [items, setItems] = useState(cartItems ?? initialItems);
  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [notice, setNotice] = useState('No discount applied.');
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.qty, 0), [items]);
  const delivery = items.length ? 4000 : 0;
  const total = Math.max(0, subtotal - discount) + delivery;
  const update = next => { setItems(next); onUpdateCart?.(next); };
  const changeQty = (id, amount) => update(items.map(item => item.id === id ? { ...item, qty: Math.max(1, item.qty + amount) } : item));
  const remove = id => update(items.filter(item => item.id !== id));
  const toggleSaved = id => update(items.map(item => item.id === id ? { ...item, saved: !item.saved } : item));
  const applyCode = () => {
    if (code.trim().toUpperCase() === 'KHUB5') { setDiscount(Math.round(subtotal * 0.05)); setNotice('KHUB5 applied · 5% off your items.'); }
    else { setDiscount(0); setNotice(code.trim() ? 'That code is not valid. Try KHUB5.' : 'No discount applied.'); }
  };

  return <div className={styles.page}>
    <header className={styles.header}><div className={styles.headerInner}>
      <button className={styles.logo} onClick={() => onNavigate('home')} aria-label="KHUB home">KHUB</button>
      <nav><button onClick={() => onNavigate('discover')}>Discover</button><button onClick={() => onNavigate('shop')}>Shop</button><button onClick={() => onNavigate('rentals')}>Rent</button><button onClick={() => onNavigate('services')}>Services</button><button onClick={() => onNavigate('jobs')}>Jobs</button><button onClick={() => onNavigate('city')}>Rides &amp; delivery</button></nav>
      <button className={styles.listButton} onClick={() => onNavigate('account')}>List on KHUB</button>
    </div></header>
    <main className={styles.main}>
      <div style={{ marginBottom: 18 }}><button type="button" onClick={onBack} aria-label="Go back to the previous page" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid #dce8df', background: '#fff', color: '#176b43', borderRadius: 999, padding: '10px 16px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(20,60,35,.06)' }}><span aria-hidden="true">←</span> Back</button></div>
      <div className={styles.eyebrow}>07 / COMMERCE / CART</div>
      <h1>Your good finds, together</h1><p className={styles.subtitle}>{items.length} {items.length === 1 ? 'item' : 'items'} · {items.length ? 'Ready when you are.' : 'Your next good find is waiting.'}</p>
      <div className={styles.layout}>
        <section className={styles.left}>
          {items.length ? items.map(item => <article className={styles.product} key={item.id}>
            <img className={styles.productImage} src={item.image} alt={item.name}/>
            <div className={styles.productBody}><h2>{item.name}</h2><p className={styles.seller}>{item.seller}</p><span className={styles.pill}>In stock · New</span><strong className={styles.price}>{money(item.price)}</strong>
              <div className={styles.quantity}><span>Quantity</span><div><button aria-label={`Decrease ${item.name} quantity`} onClick={() => changeQty(item.id, -1)} disabled={item.qty <= 1}><Minus size={13}/></button><span>{item.qty}</span><button aria-label={`Increase ${item.name} quantity`} onClick={() => changeQty(item.id, 1)}><Plus size={13}/></button></div></div>
              <div className={styles.itemActions}><button onClick={() => toggleSaved(item.id)}><Heart size={14} fill={item.saved ? 'currentColor' : 'none'}/>{item.saved ? 'Saved for later' : 'Save for later'}</button><span>·</span><button onClick={() => remove(item.id)}><Trash2 size={14}/>Remove item</button></div>
            </div>
          </article>) : <div className={styles.empty}><ShoppingBag size={28}/><h2>Your cart is taking a little break.</h2><p>Explore local finds and add something you love.</p><button className={styles.primary} onClick={() => onNavigate('shop')}>Explore the shop</button></div>}
          <section className={styles.discount}><h2>Have a discount code?</h2><label className={styles.field}><span>Code</span><input value={code} onChange={e => setCode(e.target.value)} placeholder="Enter your code" /></label><button className={styles.secondary} onClick={applyCode}>Apply code</button><p className={styles.helper}>{notice}{discount ? ` Discount: ${money(discount)}.` : ` Subtotal ${money(subtotal)}.`}</p></section>
          <button className={styles.continue} onClick={() => onNavigate('shop')}><ArrowLeft size={15}/> Continue shopping</button>
        </section>
        <aside className={styles.summary}><h2>Order summary</h2><p>Subtotal ({items.reduce((n, i) => n + i.qty, 0)} items) · {money(subtotal)}</p><p>{items.map(i => i.name.toLowerCase().replace('the ', '')).join(' + ') || 'No items yet'}</p><div className={styles.delivery}><p>Delivery fee · {money(delivery)}</p><p>Lekki, Lagos • standard delivery</p></div>{discount > 0 && <div className={styles.discountLine}><span>Discount</span><strong>−{money(discount)}</strong></div>}<div className={styles.total}><span>Total</span><strong>{money(total)}</strong></div><p className={styles.note}>No additional platform fee on this order. Prices include applicable taxes.</p><button className={styles.primary} disabled={!items.length} onClick={() => { onUpdateCart?.(items); onNavigate('delivery-details'); }}>Proceed to checkout</button><p className={styles.protected}>Protected payment · Get help with a dispute</p></aside>
      </div>
    </main>
    <footer className={styles.footer}><span>© KHUB · Privacy · Terms · Illustrative marketplace content</span><span><button onClick={() => onNavigate('support')}>Trust &amp; safety</button>　/　<button onClick={() => onNavigate('support')}>Contact support</button></span></footer>
  </div>;
}
