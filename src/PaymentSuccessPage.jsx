import React from 'react';
import { Check } from 'lucide-react';
import styles from './CheckoutPage.module.css';

const money = value => `₦${Number(value || 0).toLocaleString('en-NG')}`;
export default function PaymentSuccessPage({ onNavigate, payment = {} }) {
  const amount = payment.amount_display || money(Number(payment.amount_kobo || 0) / 100);
  const commission = money(Number(payment.commission_kobo || 0) / 100);
  const sellerNet = money(Number(payment.seller_net_kobo || 0) / 100);
  return <div className={styles.page}>
    <header className={styles.header}><button className={styles.logo} onClick={()=>onNavigate('home')}>KHUB</button><nav><button onClick={()=>onNavigate('discover')}>Discover</button><button onClick={()=>onNavigate('shop')}>Shop</button><button onClick={()=>onNavigate('rentals')}>Rent</button><button onClick={()=>onNavigate('services')}>Services</button><button onClick={()=>onNavigate('jobs')}>Jobs</button></nav><button className={styles.list} onClick={()=>onNavigate('account')}>Account</button></header>
    <main className={styles.successMain}>
      <div className={styles.eyebrow}>07 / COMMERCE / ORDER CONFIRMATION</div>
      <h1>Your order is placed.</h1>
      <p className={styles.subtitle}>The backend has accepted the order and moved the buyer funds into KHUB escrow.</p>
      <div className={styles.successGrid}>
        <section className={styles.card}>
          <h2>Order confirmation</h2><div className={styles.checkCircle}><Check size={20}/></div>
          <span className={styles.pill}>{payment.status || 'paid_escrow'}</span>
          <h3 className={styles.orderNo}>{payment.orders?.length > 1 ? `${payment.orders.length} orders created` : 'Order reference'} · {payment.orders?.length > 1 ? 'See references below' : (payment.pid || 'Not returned')}</h3>
          <p className={styles.lead}>Your wallet payment was accepted by the KHUB order API. Funds remain protected by the escrow workflow until the order is completed.</p>
          {payment.orders?.length ? <div className={styles.field}><strong>Created order references</strong>{payment.orders.map(order=><p key={order.pid}>{order.listing_title} · {order.pid} · {money(Number(order.amount_kobo || 0) / 100)}</p>)}</div> : <p>Listing reference · {payment.listing_pid || '—'}<br/>Quantity · {payment.quantity ?? '—'}</p>}
          <h3 className={styles.total}>Total · {amount}</h3>
          <div className={styles.field}><p>Platform commission snapshot · {commission}</p><p>Seller net settlement · {sellerNet}</p></div>
          <button className={styles.primary} onClick={()=>onNavigate('orders')}>View my orders</button>
          <button className={styles.outline} onClick={()=>window.print()}>Print order summary</button>
        </section>
        <div className={styles.successSide}>
          <section className={styles.card}><h2>What happens next</h2><p>1 · The seller prepares the order.</p><p>2 · The seller marks the order as delivered.</p><p>3 · Confirm receipt in KHUB to release escrow according to the order terms.</p><p className={styles.muted}>If there is a problem, use the order dispute workflow before confirming completion.</p></section>
          <section className={styles.tip}><strong>Payment security</strong><p>KHUB never asks for your card PIN or OTP in chat. Keep the order reference for support requests.</p></section>
          <button className={styles.outline} onClick={()=>onNavigate('home')}>Explore KHUB</button>
        </div>
      </div>
    </main>
    <footer className={styles.footer}><span>© KHUB · Privacy · Terms</span><span><button onClick={()=>onNavigate('support')}>Trust &amp; safety / Contact support</button></span></footer>
  </div>;
}
