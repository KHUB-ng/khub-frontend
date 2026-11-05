
import React from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  ShoppingBag,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  CalendarDays,
  Sparkles,
} from 'lucide-react';

import styles from './ItemDetailsPage.module.css';

export default function ItemDetailsPage({
  item,
  onBack,
  onBuyNow,
  onAddToCart,
  isSaved,
  onToggleSave,
}) {
  if (!item) {
    return (
      <main className={styles.container}>
        <h2>Item not found</h2>
        <button onClick={onBack}>Go back</button>
      </main>
    );
  }

  const isRental = item.kind === 'Rent';
  const isService = item.kind === 'Service';

  return (
    <main className={styles.container}>
      <button className={styles.backButton} onClick={onBack}>
        <ArrowLeft size={18} />
        Back to homepage
      </button>

      <div className={styles.breadcrumb}>
        Home <span>/</span> {item.kind} <span>/</span> {item.name}
      </div>

      <section className={styles.detailsLayout}>
        <div className={styles.imageSection}>
          <div className={styles.mainImage}>
            <img src={item.image} alt={item.name} />

            <span className={styles.itemTag}>
              {item.kind}
            </span>
          </div>

          <div className={styles.imageCaption}>
            <ShieldCheck size={17} />
            KHUB marketplace listing
          </div>
        </div>

        <div className={styles.infoSection}>
          <span className={styles.category}>
            {item.category}
          </span>

          <h1>{item.name}</h1>

          <div className={styles.location}>
            <MapPin size={16} />
            {item.location || 'Location available from seller'}
          </div>

          <h2 className={styles.price}>{item.price}</h2>

          <div className={styles.verification}>
            <CheckCircle2 size={17} />
            {item.seller || 'Local KHUB listing'}
          </div>

          <div className={styles.divider} />

          <h3>About this listing</h3>

          <p className={styles.description}>
            {item.description ||
              `Discover ${item.name} on KHUB. Connect with the listing owner, explore the available details and make your next purchase or booking with confidence.`}
          </p>

          <div className={styles.highlights}>
            <div>
              <ShieldCheck size={19} />
              <span>Trusted marketplace experience</span>
            </div>

            <div>
              <CheckCircle2 size={19} />
              <span>Listing details clearly displayed</span>
            </div>

            {isRental && (
              <div>
                <CalendarDays size={19} />
                <span>Booking availability subject to confirmation</span>
              </div>
            )}

            {isService && (
              <div>
                <Sparkles size={19} />
                <span>Professional service listing</span>
              </div>
            )}
          </div>

          <div className={styles.actions}>
            <button
              className={styles.primaryButton}
              onClick={() => onBuyNow(item)}
            >
              {isRental
                ? 'Book this rental'
                : isService
                  ? 'Request this service'
                  : 'Buy now'}
              <ArrowRight size={17} />
            </button>

            {!isRental && !isService && (
              <button
                className={styles.cartButton}
                onClick={() => onAddToCart(item)}
              >
                <ShoppingBag size={17} />
                Add to cart
              </button>
            )}

            <button
              className={`${styles.saveButton} ${
                isSaved ? styles.saved : ''
              }`}
              onClick={() => onToggleSave(item.id)}
              aria-label={isSaved ? 'Remove from wishlist' : 'Save item'}
            >
              <Heart
                size={19}
                fill={isSaved ? 'currentColor' : 'none'}
              />
            </button>
          </div>

          <p className={styles.disclaimer}>
            Always complete eligible transactions through official KHUB
            payment channels. Never pay directly outside the platform.
          </p>
        </div>
      </section>

      <section className={styles.bottomSection}>
        <h2>Why use KHUB?</h2>

        <div className={styles.benefits}>
          <div>
            <ShieldCheck size={23} />
            <h3>Trust and safety</h3>
            <p>Clear listing information and safety guidance.</p>
          </div>

          <div>
            <ShoppingBag size={23} />
            <h3>Convenience</h3>
            <p>Shop, rent and access services in one place.</p>
          </div>

          <div>
            <CheckCircle2 size={23} />
            <h3>Local connections</h3>
            <p>Discover businesses and opportunities around you.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
