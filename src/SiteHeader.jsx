
import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import styles from './styles.module.css';
import logo from './assets/khub_green-removebg-preview.png';

const links = [
  ['Discover', 'discover'],
  ['Shop', 'shop'],
  ['Rent', 'rentals'],
  ['Services', 'services'],
  ['Jobs', 'jobs'],
  ['Rides & delivery', 'ride-tracking'],
];

export default function SiteHeader({
  page = 'home',
  onNavigate,
  onList,
  user = null,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigate = (destination) => {
    setMobileOpen(false);
    onNavigate(destination);
  };

  return (
    <header className={styles.header}>
      <div className={styles.navInner}>
        <a
          className={styles.logo}
          href="#top"
          onClick={(event) => {
            event.preventDefault();
            navigate('home');
          }}
          aria-label="KHUB home"
        >
          <img src={logo} alt="KHUB" />
        </a>

        <nav
          className={`${styles.nav} ${
            mobileOpen ? styles.navOpen : ''
          }`}
          aria-label="Main navigation"
        >
          {links.map(([label, destination]) => (
            <button
              key={destination}
              className={
                page === destination ||
                (destination === 'jobs' && page === 'job-listings')
                  ? styles.navCurrent
                  : undefined
              }
              aria-current={
                page === destination ||
                (destination === 'jobs' && page === 'job-listings')
                  ? 'page'
                  : undefined
              }
              onClick={() => navigate(destination)}
            >
              {label}
            </button>
          ))}
        </nav>

        {user ? (
          <button
            className={styles.signupButton}
            onClick={() => {
              const routes = {
                buyer: 'dashboard',
                seller: 'seller-dashboard',
                driver: 'driver-dashboard',
                logistics_agent: 'agent-dashboard',
                service_provider: 'provider-dashboard',
                jobposter: 'job-poster-dashboard',
                admin: 'admin-dashboard',
              };
              navigate(routes[String(user.role_code || user.role || '').toLowerCase()] || 'dashboard');
            }}
          >
            {String(user.role_code || user.role || '').toLowerCase() === 'admin' ? 'Admin dashboard' : 'My dashboard'}
          </button>
        ) : page !== 'shop' ? (
          <button
            className={styles.signupButton}
            onClick={() => navigate('account')}
          >
            Sign up
          </button>
        ) : null}

        <button
          className={styles.listButton}
          onClick={onList}
        >
          List on KHUB
        </button>

        <button
          className={styles.menuButton}
          onClick={() => setMobileOpen((value) => !value)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
    </header>
  );
}
