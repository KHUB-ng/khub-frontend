
import React, { useState } from 'react';
import {
  CircleUserRound,
  PackageCheck,
  CalendarDays,
  BriefcaseBusiness,
  Wallet,
  MessageCircle,
  Gift,
  LifeBuoy,
  Settings,
  Bell,
  LayoutDashboard,
  ChevronRight,
  ArrowUpRight,
  ShoppingCart,
  LogOut,
} from 'lucide-react';

import styles from './CustomerDashboard.module.css';

const navItems = [
  ['Overview', 'dashboard', LayoutDashboard],
  ['My Cart', 'cart', ShoppingCart],
  ['Orders & bookings', 'orders', PackageCheck],
  ['Applications', 'applications', BriefcaseBusiness],
  ['Saved items', 'saved', Gift],
  ['Wallet', 'wallet', Wallet],
  ['Messages', 'messages', MessageCircle],
  ['Referrals', 'referrals', Gift],
  ['Notifications', 'notifications', Bell],
  ['Profile', 'profile', CircleUserRound],
  ['Support', 'support', LifeBuoy],
  ['Settings', 'settings', Settings],
];

export default function CustomerDashboard({
  user = {},
  onNavigate = () => {},
  cartCount = 0,
  onLogout = () => onNavigate('account'),
}) {
  const [active, setActive] = useState('dashboard');

  const firstName =
    (user.name || 'there').trim().split(/\s+/)[0] || 'there';

  const go = (id) => {
    if (id === 'cart') {
      onNavigate('cart');
      return;
    }

    if (id === 'wallet') {
      onNavigate('wallet');
      return;
    }

    if (id === 'settings' || id === 'profile') {
      onNavigate('settings');
      return;
    }

    if (id === 'messages') {
      onNavigate('messages');
      return;
    }

    if (id === 'support') {
      onNavigate('support');
      return;
    }

    if (id === 'notifications') {
      onNavigate('notifications');
      return;
    }

    if (id === 'orders') {
      onNavigate('orders-bookings');
      return;
    }

    if (id === 'referrals') {
      onNavigate('referrals');
      return;
    }

    if (id === 'applications') {
      onNavigate('job-application');
      return;
    }

    if (id === 'saved') {
      onNavigate('discover');
      return;
    }

    setActive(id);
  };

  return (
    <div className={styles.dashboard}>
      <aside
        className={styles.sidebar}
        aria-label="Customer dashboard navigation"
      >
        {navItems.map(([label, id, Icon]) => (
          <button
            key={id}
            className={`${styles.sideLink} ${
              active === id ? styles.sideActive : ''
            }`}
            onClick={() => go(id)}
            aria-current={active === id ? 'page' : undefined}
          >
            <Icon size={16} />

            <span>
              {label}

              {id === 'cart' && cartCount > 0 && (
                <span
                  className={styles.cartBadge}
                  aria-label={`${cartCount} items in cart`}
                >
                  {cartCount}
                </span>
              )}
            </span>
          </button>
        ))}
      </aside>

      <main className={styles.content}>
        <button type="button" className={styles.dashboardLogout} onClick={onLogout}><LogOut size={16} /> Log out</button>
        {active === 'dashboard' ? (
          <>
            <div className={styles.welcome}>
              <h1>Good morning, {firstName}.</h1>
              <p>08 Role workspaces / User dashboard</p>
              <span>
                Your everyday, connected · Sunday 11 October 2026
              </span>
            </div>

            <section
              className={styles.metrics}
              aria-label="Account summary"
            >
              <article>
                <strong>1</strong>
                <span>Active orders</span>
                <small>KH-10482 · Preparing</small>
              </article>

              <article>
                <strong>1</strong>
                <span>Service bookings</span>
                <small>13 Oct · Ada Studio</small>
              </article>

              <article>
                <strong>1</strong>
                <span>Applications</span>
                <small>Cedar Digital · Submitted</small>
              </article>

              <article>
                <strong>₦86,500</strong>
                <span>Wallet available</span>
                <small>Pending ₦12,000 separate</small>
              </article>
            </section>

            <div className={styles.columns}>
              <div className={styles.mainColumn}>
                <section className={styles.panel}>
                  <h2>Keep your plans moving</h2>

                  <p>
                    Ada Studio discovery call
                    <br />
                    Tue 13 Oct · 10:00 WAT · Standard identity · ₦78,750
                    <br />
                    ✓ Booking confirmed
                  </p>

                  <button
                    className={styles.primary}
                    onClick={() => onNavigate('orders-bookings')}
                  >
                    Open booking
                  </button>

                  <p>
                    Your next good finds
                    <br />
                    KH-10482 · Lounge chair + headphones · ₦207,000
                    <br />
                    ● Sellers preparing
                  </p>

                  <button
                    className={styles.textLink}
                    onClick={() => onNavigate('orders-bookings')}
                  >
                    Track order
                  </button>
                </section>

                <section className={styles.panel}>
                  <h2>Recent activity</h2>

                  <p>
                    Cedar Digital application
                    <br />
                    Reference: KH-AP-9012　/　Status: ✓ Submitted · 11
                    Oct　/　Next step: View application
                  </p>

                  <p>
                    Economy ride · Lagos
                    <br />
                    Reference: KH-RD-5520　/　Status: ● In progress ·
                    ₦5,200　/　Next step: Open tracking
                  </p>

                  <button
                    className={styles.textLink}
                    onClick={() => onNavigate('ride-tracking')}
                  >
                    Track active ride
                  </button>

                  <p>
                    Brand samples delivery
                    <br />
                    Reference: KH-DL-8821　/　Status: ◷ Pickup
                    scheduled　/　Next step: View delivery
                  </p>
                </section>
              </div>

              <aside className={styles.rightColumn}>
                <section
                  className={`${styles.panel} ${styles.walletPanel}`}
                >
                  <h2>Your wallet</h2>
                  <h3>₦86,500 available</h3>

                  <p>
                    Pending referral / refund funds are not spendable.
                  </p>

                  <button
                    className={styles.primary}
                    onClick={() => onNavigate('wallet')}
                  >
                    Top up wallet
                  </button>

                  <button
                    className={styles.textLink}
                    onClick={() => onNavigate('wallet')}
                  >
                    View transactions
                  </button>
                </section>

                <section className={styles.panel}>
                  <h2>A little update</h2>
                  <p>● 2 unread messages</p>
                  <p>
                    Ada Studio: “Looking forward to our discovery call.”
                  </p>

                  <button
                    className={styles.textLink}
                    onClick={() => onNavigate('messages')}
                  >
                    Open inbox
                  </button>
                </section>

                <section className={styles.panel}>
                  <h2>Build your KHUB profile</h2>

                  <p>
                    Profile 85% complete. Add a short bio so providers
                    understand your goals.
                  </p>

                  <button
                    className={styles.textLink}
                    onClick={() => onNavigate('settings')}
                  >
                    Edit profile
                  </button>
                </section>
              </aside>
            </div>
          </>
        ) : (
          <section className={styles.panel}>
            <h1>
              {navItems.find((item) => item[1] === active)?.[0] ||
                'Overview'}
            </h1>

            <p>
              This area is ready for your KHUB{' '}
              {navItems
                .find((item) => item[1] === active)?.[0]
                .toLowerCase() || 'dashboard'}{' '}
              details.
            </p>

            <button
              className={styles.primary}
              onClick={() => setActive('dashboard')}
            >
              Back to overview <ChevronRight size={16} />
            </button>

            <button
              className={styles.textLink}
              onClick={() => onNavigate('settings')}
            >
              Open Settings <ArrowUpRight size={15} />
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
