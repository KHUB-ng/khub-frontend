import React, { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import styles from './CheckoutPage.module.css';
import { api } from './lib/api.js';
import { walletApi } from './lib/wallet.js';

const money = value => `₦${Number(value || 0).toLocaleString('en-NG')}`;

export default function CheckoutPage({ onSuccess, onNavigate, onBack, user, cartItems = [] }) {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    walletApi.summary().then(value => { if (active) setWallet(value); })
      .catch(err => { if (active) setError(err?.message || 'Wallet balance could not be checked.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const total = cartItems.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 1), 0);
  const placeOrder = async () => {
    if (cartItems.length !== 1) {
      setError('The current order API creates one order at a time. Keep one product in your cart for this checkout, or complete the items separately.');
      return;
    }
    const item = cartItems[0];
    if (!item?.id) { setError('This cart item is missing its KHUB listing reference. Remove it and add the live listing again.'); return; }
    setPlacing(true); setError(''); setNotice('');
    try {
      const order = await api.post('/orders', { listing_pid: item.id, quantity: Number(item.qty || 1) });
      onSuccess?.(order);
    } catch (err) {
      const message = err?.message || 'Order could not be placed.';
      setError(message);
      if (/insufficient funds/i.test(message)) setNotice('Fund your KHUB wallet using Flutterwave, then return here to place the order.');
    } finally { setPlacing(false); }
  };

  return <div className={styles.page}>
    <header className={styles.header}><button className={styles.logo} onClick={()=>onNavigate('home')}>KHUB</button><nav><button onClick={()=>onNavigate('discover')}>Discover</button><button onClick={()=>onNavigate('shop')}>Shop</button><button onClick={()=>onNavigate('rentals')}>Rent</button><button onClick={()=>onNavigate('services')}>Services</button><button onClick={()=>onNavigate('jobs')}>Jobs</button></nav><button className={styles.list} onClick={()=>onNavigate('account')}>Account</button></header>
    <main className={styles.main}>
      <div className={styles.eyebrow}>07 / COMMERCE / SECURE CHECKOUT</div><h1>Review your order.</h1><p className={styles.subtitle}>Orders are paid from your KHUB wallet and protected by the existing escrow workflow.</p>
      {error && <div className={styles.note} role="alert">{error}</div>}
      {notice && <div className={styles.note} role="status">{notice}</div>}
      <div className={styles.layout}>
        <section className={styles.left}>
          <section className={styles.card}><h2>Items in this checkout</h2>
            {cartItems.map(item=><div className={styles.field} key={item.id}><strong>{item.name}</strong><p>Quantity {item.qty} · {money(item.price)} each · Estimated {money(Number(item.price || 0) * Number(item.qty || 1))}</p></div>)}
            {!cartItems.length && <p>Your cart is empty. Add a live product listing before checkout.</p>}
            {cartItems.length > 1 && <p className={styles.note}>The current backend exposes one-order-at-a-time checkout. Complete items separately to avoid partial multi-item payment.</p>}
          </section>
          <section className={styles.card}><h2>Payment method</h2><div className={styles.field}><ShieldCheck size={18}/><strong>KHUB wallet · escrow protected</strong><p>Place the order only after the backend confirms sufficient wallet funds. The seller receives funds after the order's confirmation workflow completes.</p></div>
            <p>Available wallet balance: <strong>{loading ? 'Checking…' : wallet?.balance_display || money(wallet?.balance_kobo)}</strong></p>
            <button className={styles.outline} onClick={()=>onNavigate('wallet')}>Fund wallet with Flutterwave</button>
          </section>
          <button className={styles.primary} disabled={placing || loading || cartItems.length !== 1} onClick={placeOrder}>{placing?'Placing secure order…':'Place order with KHUB wallet'}</button>
          <button className={styles.link} onClick={onBack}>Back to cart</button>
        </section>
        <aside className={styles.right}><section className={styles.card}><h2>Order summary</h2><p>Items · {cartItems.reduce((n,i)=>n+Number(i.qty||1),0)}</p><p>Estimated subtotal · {money(total)}</p><hr/><h3>Estimated total · {money(total)}</h3><small>The server recalculates the final amount and applicable commission from the listing. No card or bank transfer is processed directly by this page.</small></section><section className={styles.tip}><strong>Protected transaction</strong><p>KHUB debits the buyer wallet into escrow. The seller payout and platform commission are recorded when the order is completed.</p></section></aside>
      </div>
    </main><footer className={styles.footer}><span>© KHUB · Privacy · Terms</span><span>Trust &amp; safety / Contact support</span></footer>
  </div>;
}
