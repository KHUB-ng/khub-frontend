import React from 'react';
import styles from './AboutUsPage.module.css';

const AboutUsPage = ({ onNavigate }) => {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <span className={styles.eyebrow}>GET TO KNOW US</span>
        <h1>About KHUB</h1>
        <h2>Connecting Businesses, People and Opportunities.</h2>
        <p>
          KHUB is an all-in-one digital business and commerce platform
          designed to make buying, selling, renting, finding jobs,
          accessing services and connecting with opportunities easier.
        </p>

        <div className={styles.actions}>
          <button onClick={() => onNavigate?.('home')}>
            Explore KHUB
          </button>
          <button
            className={styles.secondary}
            onClick={() => onNavigate?.('account')}
          >
            Create an Account
          </button>
        </div>
      </section>

      <section className={styles.section}>
        <span className={styles.eyebrow}>WHO WE ARE</span>
        <h2>A connected digital marketplace for everyone.</h2>
        <p>
          We are building a connected digital marketplace where
          individuals, entrepreneurs, small businesses, established
          companies, service providers, job seekers, property owners,
          drivers and logistics operators can discover opportunities
          and connect in one convenient digital environment.
        </p>
      </section>

      <section className={styles.section}>
        <span className={styles.eyebrow}>WHAT YOU CAN DO</span>
        <h2>Everything you need, connected in one place.</h2>

        <div className={styles.grid}>
          {[
            ['Shop', 'Discover products and shop from different sellers.'],
            ['Sell', 'Showcase your products and grow your business.'],
            ['Find Services', 'Connect with skilled professionals and service providers.'],
            ['Find Jobs', 'Discover employment and career opportunities.'],
            ['Post Jobs', 'Reach potential candidates for your business.'],
            ['Explore Rentals', 'Discover available properties and rental opportunities.'],
            ['Book Rides', 'Access convenient ride-booking opportunities.'],
            ['Access Logistics', 'Connect with delivery and logistics services.'],
          ].map(([title, description]) => (
            <article className={styles.card} key={title}>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <span className={styles.eyebrow}>OUR PURPOSE</span>
        <h2>Making opportunities easier to access.</h2>
        <p>
          Our goal is to give individuals and businesses visibility,
          useful digital tools and access to opportunities. We aim to
          simplify how people discover products and services while
          bringing different business and everyday activities together
          through one connected platform.
        </p>
      </section>

      <section className={styles.section}>
        <span className={styles.eyebrow}>OUR COMMITMENT</span>
        <h2>Building for today and tomorrow.</h2>
        <p>
          We are committed to technology, innovation, accessibility
          and user-focused services. Through continuous improvement,
          we aim to expand opportunities for individuals and businesses
          across Nigeria and beyond.
        </p>
      </section>

      <section className={styles.closing}>
        <h2>KHUB — Your No. 1 Business Hub.</h2>
        <p>Imagine Tomorrow, Creating Today.</p>
        <button onClick={() => onNavigate?.('account')}>
          Join KHUB Today
        </button>
      </section>
    </main>
  );
};

export default AboutUsPage;