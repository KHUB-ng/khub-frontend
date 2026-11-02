import logo from './assets/khub_green-removebg-preview.png';
import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Search,
  ShoppingBag,
  CalendarDays,
  Sparkles,
  BriefcaseBusiness,
  CarFront,
  Package,
  ShieldCheck,
  ArrowUpRight,
  Heart,
  Menu,
  X,
  CheckCircle2,
  MapPin,
  ChevronRight,
  Mail,
  Phone,
  ArrowRight,
  SlidersHorizontal,
} from 'lucide-react';

import styles from './styles.module.css';
import hero from './assets/hero.jpg';
import chair from './assets/chair.jpg';
import headphones from './assets/headphones.jpg';
import lamp from './assets/lamp.jpg';
import camera from './assets/camera.jpg';
import rental from './assets/rental.jpg';
import service from './assets/service.jpg';

import DiscoverPage from './DiscoverPage.jsx';
import AccountPage from './AccountPage.jsx';
import PersonalSettingsPage from './PersonalSettingsPage.jsx';
import SupportPage from './SupportPage.jsx';
import NotificationsPage from './NotificationsPage.jsx';
import OrdersPage from './OrdersPage.jsx';
import OrdersBookingsPage from './OrdersBookingsPage.jsx';
import ReferralsPage from './ReferralsPage.jsx';
import ChatPage from './ChatPage.jsx';
import WalletPage from './WalletPage.jsx';
import PublicStorefrontPage from './PublicStorefrontPage.jsx';
import CustomerDashboard from './CustomerDashboard.jsx';
import DriverDashboard from './DriverDashboard.jsx';
import RideTrackingPage from './RideTrackingPage.jsx';
import RideBookingPage from './RideBookingPage.jsx';
import ServiceProviderDashboard from './ServiceProviderDashboard.jsx';
import SellerDashboard from './SellerDashboard.jsx';
import AdminDashboard from './AdminDashboard.jsx';
import JobPosterDashboard from './JobPosterDashboard.jsx';
import JobApplicationPage from './JobApplicationPage.jsx';
import JobDetailPage from './JobDetailPage.jsx';
import JobListingsPage from './JobListingsPage.jsx';
import SiteHeader from './SiteHeader.jsx';
import CheckoutPage from './CheckoutPage.jsx';
import PaymentSuccessPage from './PaymentSuccessPage.jsx';
import DeliveryDetailsPage from './DeliveryDetailsPage.jsx';
import CartPage from './CartPage.jsx';
import SellerListingForm from './SellerListingForm.jsx';
import ShopPage from './ShopPage.jsx';
import RentalsPage from './RentalsPage.jsx';

// NEW: Dedicated service-provider listing page
import ServicesPage from './ServicesPage.jsx';

const products = [
  {
    id: 1,
    name: 'The Lekki lounge chair',
    category: 'Advertised · Lekki, Lagos · New',
    seller: 'Verified seller',
    price: '₦145,000',
    image: chair,
    kind: 'Shop',
  },
  {
    id: 2,
    name: 'Wireless headphones',
    category: 'Identity verified · Ikeja, Lagos · New',
    seller: '',
    price: '₦58,000',
    image: headphones,
    kind: 'Shop',
  },
  {
    id: 3,
    name: 'Walnut bedside lamp',
    category: 'Local maker · Wuse, Abuja · Handmade',
    seller: '',
    price: '₦32,000',
    image: lamp,
    kind: 'Shop',
  },
  {
    id: 4,
    name: 'Camera kit for rent',
    category: 'Rental · Yaba, Lagos · Dates available',
    seller: '',
    price: '₦18,000 / day',
    image: camera,
    kind: 'Rent',
  },
];

const categories = [
  {
    name: 'Shop',
    desc: 'Home, tech & everyday finds',
    icon: ShoppingBag,
  },
  {
    name: 'Rent',
    desc: 'Spaces, equipment & occasions',
    icon: CalendarDays,
  },
  {
    name: 'Services',
    desc: 'Skilled people. Great work.',
    icon: Sparkles,
  },
  {
    name: 'Jobs',
    desc: 'Your next move starts here',
    icon: BriefcaseBusiness,
  },
  {
    name: 'Rides',
    desc: 'Get across your city',
    icon: CarFront,
  },
  {
    name: 'Delivery',
    desc: 'Send it, track it, relax',
    icon: Package,
  },
];

function getDashboardForRole(role) {
  switch (role) {
    case 'Buyer':
      return 'dashboard';
    case 'Seller':
      return 'seller-dashboard';
    case 'Driver':
      return 'driver-dashboard';
    case 'Provider':
      return 'provider-dashboard';
    case 'Job poster':
      return 'job-poster-dashboard';
    case 'Job seeker':
      return 'job-listings';
    default:
      return 'dashboard';
  }
}

function App() {
  const [page, setPage] = useState('home');

  const [currentUser, setCurrentUser] = useState({
    name: 'Tomi Adeyemi',
    email: 'tomi.adeyemi@example.com',
    phone: '+234 803 000 1428',
    role: 'Buyer',
  });

  const [saved, setSaved] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const [paymentDetails, setPaymentDetails] = useState({
    method: 'Bank transfer',
    total: 207000,
  });

  const [deliveryDetails, setDeliveryDetails] = useState({
    deliveryFee: 4000,
    total: 207000,
    delivery: 'standard',
  });

  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: 'The Lekki lounge chair',
      seller: 'Studio Nook · Forest green',
      price: 145000,
      image: chair,
      qty: 1,
      saved: false,
    },
    {
      id: 2,
      name: 'Wireless headphones',
      seller: 'Sound House · Cream',
      price: 58000,
      image: headphones,
      qty: 1,
      saved: false,
    },
  ]);

  const [selectedJob, setSelectedJob] = useState({
    title: 'Product designer',
    company: 'Cedar Digital',
    reference: 'KH-JB-3107',
    salary: '₦450,000–₦650,000 / month',
    location: 'Lagos',
    arrangement: 'Hybrid',
    type: 'Full-time',
    closes: '25 Oct 2026',
  });

  const filteredProducts = useMemo(
    () =>
      products.filter(
        (p) =>
          (
            activeCategory === 'All' ||
            activeCategory === p.kind ||
            (activeCategory === 'Shop' && p.kind === 'Shop')
          ) &&
          `${p.name} ${p.category}`
            .toLowerCase()
            .includes(search.toLowerCase())
      ),
    [activeCategory, search]
  );

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  };

  const goTo = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
    });
    setMobileMenu(false);
  };

  const openModal = (
    title,
    description,
    action = 'Continue'
  ) => {
    setSubmitted(false);
    setModal({ title, description, action });
  };

  const toggleSaved = (id) =>
    setSaved((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );

  const onSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const navigate = (destination) => {
    setMobileMenu(false);

    if (destination === 'home') {
      setPage('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (
      destination === 'jobs' ||
      destination === 'job-listings'
    ) {
      setPage('job-listings');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (destination === 'shop') {
      setPage('shop');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (
      destination === 'rentals' ||
      destination === 'rent'
    ) {
      setPage('rentals');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // NEW: Open the dedicated service-provider listing page.
    if (
      destination === 'services' ||
      destination === 'service'
    ) {
      setPage('services');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

   if (destination === 'city') {
  setPage('ride-tracking');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  return;
  }

    if (
  destination === 'discover' ||
  destination === 'account' ||
  destination === 'settings' ||
  destination === 'dashboard' ||
  destination === 'driver-dashboard' ||
  destination === 'provider-dashboard' ||
  destination === 'seller-dashboard' ||
  destination === 'admin-dashboard' ||
  destination === 'support' ||
  destination === 'notifications' ||
  destination === 'orders' ||
  destination === 'orders-bookings' ||
  destination === 'referrals' ||
  destination === 'messages' ||
  destination === 'wallet' ||
  destination === 'storefront' ||
  destination === 'job-poster-dashboard' ||
  destination === 'ride-tracking' ||
  destination === 'ride-booking' ||
  destination === 'job-application' ||
  destination === 'job-detail' ||
  destination === 'delivery-details' ||
  destination === 'checkout' ||
  destination === 'payment-success' ||
  destination === 'cart' ||
  destination === 'seller-listing'
) {
  setPage(destination);
  window.scrollTo({ top: 0, behavior: 'smooth' });
  return;
}

    const sectionByDestination = {
      shop: 'finds',
      rentals: 'rent',
      jobs: 'jobs',
      city: 'city',
    };

    const sectionId = sectionByDestination[destination];

    if (sectionId) {
      if (page !== 'home') {
        setPage('home');

        window.setTimeout(
          () =>
            document
              .getElementById(sectionId)
              ?.scrollIntoView({ behavior: 'smooth' }),
          100
        );
      } else {
        document
          .getElementById(sectionId)
          ?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setPage('account');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handles the seller listing button in the navigation header.
  const handleList = () => {
    navigate('seller-listing');
  };

  // Dedicated Shop page with the shared navigation header.
  if (page === 'shop') {
    return (
      <>
        <SiteHeader
          page={page}
          onNavigate={navigate}
          onList={handleList}
          cartCount={cartItems.reduce(
            (n, item) => n + item.qty,
            0
          )}
        />

        <ShopPage
          onHome={() => navigate('home')}
          onRent={() => navigate('rentals')}
          onNavigate={navigate}
        />
      </>
    );
  }

  // Dedicated Rentals page with the shared navigation header.
  if (page === 'rentals') {
    return (
      <>
        <SiteHeader
          page={page}
          onNavigate={navigate}
          onList={handleList}
          cartCount={cartItems.reduce(
            (n, item) => n + item.qty,
            0
          )}
        />

        <RentalsPage
          onHome={() => navigate('home')}
          onShop={() => navigate('shop')}
          onNavigate={navigate}
        />
      </>
    );
  }

  // NEW: Dedicated Services page with the shared navigation header.
  if (page === 'services') {
    return (
      <>
        <SiteHeader
          page={page}
          onNavigate={navigate}
          onList={handleList}
          cartCount={cartItems.reduce(
            (n, item) => n + item.qty,
            0
          )}
        />

        <ServicesPage
          onHome={() => navigate('home')}
          onNavigate={navigate}
        />
      </>
    );
  }

  return (
    <div className={styles.app}>
      {page !== 'delivery-details' &&
        page !== 'checkout' &&
        page !== 'payment-success' &&
        page !== 'cart' &&
        page !== 'driver-dashboard' &&
        page !== 'provider-dashboard' &&
        page !== 'seller-dashboard' &&
        page !== 'settings' &&
        page !== 'support' &&
        page !== 'notifications' &&
        page !== 'orders' &&
        page !== 'orders-bookings' &&
        page !== 'referrals' &&
        page !== 'messages' &&
        page !== 'wallet' &&
        page !== 'storefront' &&
        page !== 'admin-dashboard' &&
        page !== 'job-poster-dashboard' &&
        page !== 'ride-booking' && (

          <SiteHeader
            page={page}
            onNavigate={navigate}
            onList={handleList}
            cartCount={cartItems.reduce(
              (n, item) => n + item.qty,
              0
            )}
          />
        )}

      {page === 'seller-listing' ? (
        <SellerListingForm
          onNavigate={navigate}
          onSaved={() => {}}
        />
      ) : page === 'cart' ? (
        <CartPage
          onNavigate={navigate}
          cartItems={cartItems}
          onUpdateCart={setCartItems}
        />
      ) : page === 'delivery-details' ? (
        <DeliveryDetailsPage
          user={currentUser}
          onNavigate={navigate}
          onContinue={(details) => {
            setDeliveryDetails(details);
            navigate('checkout');
          }}
        />
      ) : page === 'checkout' ? (
        <CheckoutPage
          user={currentUser}
          deliveryDetails={deliveryDetails}
          onNavigate={navigate}
          onBack={() => navigate('delivery-details')}
          onSuccess={(payment) => {
            setPaymentDetails({
              ...payment,
              total: deliveryDetails.total,
            });
            navigate('payment-success');
          }}
        />
      ) : page === 'payment-success' ? (
        <PaymentSuccessPage
          payment={paymentDetails}
          onNavigate={navigate}
        />
      )  : page === 'admin-dashboard' ? (
        <AdminDashboard onNavigate={navigate} />

      ): page === 'discover' ? (
        <DiscoverPage
          onHome={() => navigate('home')}
          onAccount={() => navigate('account')}
        />
      ) : page === 'account' ? (
        <AccountPage
          onHome={() => navigate('home')}
          onAccountCreated={(user) => {
          if (!user) return;

          setCurrentUser(user);

          const destination = getDashboardForRole(user.role);

          navigate(destination);
        }}
      />
    ) : page === 'dashboard' ? (
      <CustomerDashboard
        user={currentUser}
        onNavigate={navigate}
        onLogout={handleLogout}
        />
      ) : page === 'dashboard' ? (
        <CustomerDashboard
          user={currentUser}
          onNavigate={navigate}
          onLogout={handleLogout}
        />
      ) : page === 'driver-dashboard' ? (
        <DriverDashboard
          user={currentUser}
          onNavigate={navigate}
          onLogout={handleLogout}
        />
      ) : page === 'ride-tracking' ? (
        <RideTrackingPage
          user={currentUser}
          onNavigate={navigate}
          onBack={() => navigate('orders-bookings')}
        />
      ) : page === 'ride-booking' ? (
        <RideBookingPage
          user={currentUser}
          onNavigate={navigate}
          onBack={() => navigate('dashboard')}
        />
      ) : page === 'provider-dashboard' ? (
        <ServiceProviderDashboard
          user={currentUser}
          onNavigate={navigate}
          onLogout={handleLogout}
        />
      ) : page === 'seller-dashboard' ? (
        <SellerDashboard
          user={currentUser}
          onNavigate={navigate}
          onLogout={handleLogout}
        />
    
      ) : page === 'job-poster-dashboard' ? (
        <JobPosterDashboard
          user={currentUser}
          onNavigate={navigate}
          onLogout={handleLogout}
        />
      ) : page === 'job-listings' ? (
        <JobListingsPage
          savedJobs={savedJobs}
          onToggleSave={(id) =>
            setSavedJobs((prev) =>
              prev.includes(id)
                ? prev.filter((item) => item !== id)
                : [...prev, id]
            )
          }
          onViewJob={(job) => {
            setSelectedJob({
              title: job.title,
              company: job.company,
              reference: job.id,
              salary: job.salary,
              location: job.location,
              arrangement: job.arrangement,
              type: job.type,
              closes: job.closes,
            });

            navigate('job-detail');
          }}
        />
      ) : page === 'job-detail' ? (
        <JobDetailPage
          job={selectedJob}
          onBack={() => navigate('jobs')}
          onApply={() => navigate('job-application')}
        />
      ) : page === 'job-application' ? (
        <JobApplicationPage
          user={currentUser}
          job={selectedJob}
          onBack={() => navigate('job-detail')}
          onNavigate={navigate}
        />
      ) : page === 'storefront' ? (
        <PublicStorefrontPage
          user={currentUser}
          onNavigate={navigate}
          onBack={() =>
            navigate(
              currentUser?.role === 'Seller'
                ? 'seller-dashboard'
                : currentUser?.role === 'Provider'
                  ? 'provider-dashboard'
                  : 'home'
            )
          }
        />
      ) : page === 'settings' ? (
        <PersonalSettingsPage
          user={currentUser}
          onBack={() =>
            navigate(
              currentUser?.role === 'Seller'
                ? 'seller-dashboard'
                : currentUser?.role === 'Provider'
                  ? 'provider-dashboard'
                  : 'dashboard'
            )
          }
          onNavigate={navigate}
        />
      ) : page === 'support' ? (
        <SupportPage
          user={currentUser}
          onBack={() =>
            navigate(
              currentUser?.role === 'Driver'
                ? 'driver-dashboard'
                : currentUser?.role === 'Provider'
                  ? 'provider-dashboard'
                  : currentUser?.role === 'Seller'
                    ? 'seller-dashboard'
                    : currentUser?.role === 'Job poster'
                      ? 'job-poster-dashboard'
                      : 'dashboard'
            )
          }
        />
      ) : page === 'notifications' ? (
        <NotificationsPage
          onBack={() =>
            navigate(
              currentUser?.role === 'Driver'
                ? 'driver-dashboard'
                : currentUser?.role === 'Provider'
                  ? 'provider-dashboard'
                  : currentUser?.role === 'Seller'
                    ? 'seller-dashboard'
                    : currentUser?.role === 'Job poster'
                      ? 'job-poster-dashboard'
                      : 'dashboard'
            )
          }
          onNavigate={navigate}
        />
      ) : page === 'wallet' ? (
        <WalletPage
          user={currentUser}
          onBack={() =>
            navigate(
              currentUser?.role === 'Job poster'
                ? 'job-poster-dashboard'
                : 'dashboard'
            )
          }
          onNavigate={navigate}
        />
      ) : page === 'referrals' ? (
        <ReferralsPage
          onBack={() =>
            navigate(
              currentUser?.role === 'Job poster'
                ? 'job-poster-dashboard'
                : 'dashboard'
            )
          }
          onWallet={() => navigate('wallet')}
        />
      ) : page === 'orders-bookings' ? (
        <OrdersBookingsPage
          onBack={() =>
            navigate(
              currentUser?.role === 'Driver'
                ? 'driver-dashboard'
                : currentUser?.role === 'Provider'
                  ? 'provider-dashboard'
                  : currentUser?.role === 'Seller'
                    ? 'seller-dashboard'
                    : currentUser?.role === 'Job poster'
                      ? 'job-poster-dashboard'
                      : 'dashboard'
            )
          }
          onOpenOrder={() => navigate('orders')}
          onSupport={() => navigate('support')}
          onNavigate={navigate}
        />
      
      ) : page === 'orders' ? (
        <OrdersPage
          onBack={() => navigate('orders-bookings')}
          onSupport={() => navigate('support')}
        />
      ) : page === 'messages' ? (
        <ChatPage
          user={currentUser}
          onNavigate={navigate}
          onBack={() =>
            navigate(
              currentUser?.role === 'Seller'
                ? 'seller-dashboard'
                : currentUser?.role === 'Driver'
                  ? 'driver-dashboard'
                  : currentUser?.role === 'Provider'
                    ? 'provider-dashboard'
                    : currentUser?.role === 'Job poster'
                      ? 'job-poster-dashboard'
                      : 'dashboard'
            )
          }
        />
      ) : (

        <>
          <main id="top">
            <section className={styles.hero} id="discover">
              <div className={styles.heroCopy}>
                <span className={styles.eyebrow}>
                  Made for your everyday
                </span>
              

                <h1>
                  A world of
                  <br />
                  possibility.
                  <br />
                  One local hub.
                </h1>

                <p>
                  Find the things, people and opportunities that move you
                  forward. All in one trusted Nigerian marketplace.
                </p>

                
            <div className={styles.actions}>
              <button
                className={styles.primary}
                onClick={() => goTo('finds')}
              >
                Explore KHUB
              </button>

              <button
                className={styles.secondary}
                onClick={() =>
                  openModal(
                    'Start selling on KHUB',
                    'Create a listing and connect with people looking for what you offer.',
                    'Get started'
                  )
                }
              >
                Start selling
              </button>
            </div>

            {/* Temporary admin dashboard access button */}
            {/*<button
              className={styles.secondary}
              onClick={() => navigate('admin-dashboard')}
              style={{ marginTop: '16px' }}
            >
              Open Admin Dashboard
            </button>
            */}

                <small>
                  Lagos · Abuja · Port Harcourt & beyond
                </small>
              </div>

              <div className={styles.heroVisual}>
                <img
                  src={hero}
                  alt="A Nigerian entrepreneur working from a plant-filled home workspace"
                />

                <div className={styles.imageCaption}>
                  Local ambition. Everyday connection.
                  <ArrowUpRight size={15} />
                </div>
              </div>
            </section>

            <section className={styles.trustStrip}>
              <div>
                <ShieldCheck />
                Identity verification, clearly labelled
              </div>
              <div>
                <ShieldCheck />
                Protected payments on eligible orders
              </div>
              <div>
                <ShieldCheck />
                Local support, when you need it
              </div>
            </section>

            <section className={styles.section} id="categories">
              <div className={styles.sectionHeading}>
                <h2>What brings you here?</h2>
                <p>Six ways to make your day work better.</p>
              </div>

              <div className={styles.categoryGrid}>
                {categories.map(({ name, desc, icon: Icon }) => (
                  <button
                    className={`${styles.categoryCard} ${
                      activeCategory === name
                        ? styles.categoryActive
                        : ''
                    }`}
                    key={name}
                    onClick={() => {
                      if (name === 'Jobs') {
                        navigate('jobs');
                        return;
                      }

                      if (name === 'Rent') {
                        navigate('rentals');
                        return;
                      }

                      if (name === 'Shop') {
                        navigate('shop');
                        return;
                      }

                      // NEW: Services category opens its own page.
                     if (name === 'Services') {
                        navigate('services');
                        return;
                      }

                      if (name === 'Rides' || name === 'Delivery') {
                        navigate('ride-booking');
                        return;
                      }

                      setActiveCategory(
                        activeCategory === name ? 'All' : name
                      );
                      goTo('finds');
                    }}
                  >
                    <Icon size={20} strokeWidth={1.7} />
                    <strong>{name}</strong>
                    <span>{desc}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className={styles.section} id="finds">
              <div className={styles.sectionHeadingRow}>
                <div className={styles.sectionHeading}>
                  <h2>Good finds, close to home</h2>
                  <p>
                    Curated inventory from local sellers. Sponsored items
                    are labelled Advertised.
                  </p>
                </div>

                <div className={styles.searchBox}>
                  <Search size={16} />

                  <input
                    aria-label="Search listings"
                    placeholder="Search finds"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />

                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      aria-label="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div className={styles.filterRow}>
                <button
                  className={
                    activeCategory === 'All'
                      ? styles.filterActive
                      : styles.filter
                  }
                  onClick={() => setActiveCategory('All')}
                >
                  All finds
                </button>

                {['Shop', 'Rent'].map((c) => (
                  <button
                    key={c}
                    className={
                      activeCategory === c
                        ? styles.filterActive
                        : styles.filter
                    }
                    onClick={() => setActiveCategory(c)}
                  >
                    {c}
                  </button>
                ))}

                <span>
                  <SlidersHorizontal size={14} />{' '}
                  {filteredProducts.length} listings
                </span>
              </div>

              <div className={styles.productGrid}>
                {filteredProducts.map((p) => (
                  <article className={styles.productCard} key={p.id}>
                    <div className={styles.productImage}>
                      <img src={p.image} alt={p.name} />

                      <button
                        className={`${styles.saveButton} ${
                          saved.includes(p.id) ? styles.saved : ''
                        }`}
                        onClick={() => toggleSaved(p.id)}
                        aria-label={
                          saved.includes(p.id)
                            ? `Unsave ${p.name}`
                            : `Save ${p.name}`
                        }
                      >
                        <Heart
                          size={17}
                          fill={
                            saved.includes(p.id)
                              ? 'currentColor'
                              : 'none'
                          }
                        />
                      </button>
                    </div>

                    <div className={styles.productInfo}>
                      <h3>{p.name}</h3>
                      <p>{p.category}</p>

                      {p.seller && <p>{p.seller}</p>}

                      <strong>{p.price}</strong>

                      <div className={styles.productLinks}>
                        <button
                          onClick={() => navigate('delivery-details')}
                        >
                          Buy now <ArrowUpRight size={13} />
                        </button>

                        <button
                          onClick={() => {
                            setCartItems((old) => {
                              const existing = old.find(
                                (item) => item.id === p.id
                              );

                              return existing
                                ? old.map((item) =>
                                    item.id === p.id
                                      ? {
                                          ...item,
                                          qty: item.qty + 1,
                                        }
                                      : item
                                  )
                                : [
                                    ...old,
                                    {
                                      id: p.id,
                                      name: p.name,
                                      seller:
                                        p.id === 1
                                          ? 'Studio Nook · Forest green'
                                          : p.id === 2
                                            ? 'Sound House · Cream'
                                            : p.seller,
                                      price: Number(
                                        String(p.price).replace(
                                          /[^0-9]/g,
                                          ''
                                        )
                                      ),
                                      image: p.image,
                                      qty: 1,
                                      saved: false,
                                    },
                                  ];
                            });

                            notify(`${p.name} added to your cart`);
                          }}
                        >
                          <ShoppingBag size={13} />
                          Add to cart
                        </button>

                        <button onClick={() => toggleSaved(p.id)}>
                          <Heart
                            size={13}
                            fill={
                              saved.includes(p.id)
                                ? 'currentColor'
                                : 'none'
                            }
                          />
                          {saved.includes(p.id) ? 'Saved' : 'Save'}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}

                {filteredProducts.length === 0 && (
                  <div className={styles.emptyState}>
                    No listings match that search. Try a different keyword
                    or{' '}
                    <button
                      onClick={() => {
                        setSearch('');
                        setActiveCategory('All');
                      }}
                    >
                      show all finds
                    </button>
                    .
                  </div>
                )}
              </div>
            </section>

            <section className={styles.section} id="rent">
              <div className={styles.sectionHeading}>
                <h2>Space for what’s next</h2>
                <p>
                  From a weekend stay to the tools for your next big idea.
                </p>
              </div>

              <div className={styles.featureRow}>
                <img
                  className={styles.featureImage}
                  src={rental}
                  alt="A sunlit contemporary apartment with a comfortable living room"
                />

                <div className={styles.featurePanel}>
                  <span className={styles.tag}>
                    Rental · Lekki, Lagos
                  </span>

                  <h3>A light-filled place to pause.</h3>

                  <p>
                    Furnished one-bedroom apartment. Wi-Fi, workspace and
                    flexible short stays.
                  </p>

                  <strong className={styles.priceLarge}>
                    ₦65,000 / night
                  </strong>

                  <small>
                    Refundable deposit ₦100,000 · Fees shown before booking
                  </small>

                  <button
                    className={styles.primary}
                    onClick={() => navigate('rentals')}
                  >
                    Explore rentals
                  </button>
                </div>
              </div>
            </section>

            <section className={styles.section} id="services">
              <div className={styles.sectionHeading}>
                <h2>Expertise, a conversation away</h2>
                <p>
                  Find a provider who understands the work you want to do.
                </p>
              </div>

              <div
                className={`${styles.featureRow} ${styles.reverseOnMobile}`}
              >
                <img
                  className={styles.featureImage}
                  src={service}
                  alt="A creative professional working on a design project"
                />

                <div className={styles.featurePanel}>
                  <span className={styles.tag}>
                    Creative services
                  </span>

                  <h3>Brand identity by Ada Studio</h3>

                  <p>
                    Logos, visual systems and launch-ready assets for
                    growing Nigerian businesses.
                  </p>

                  <strong className={styles.priceLarge}>
                    From ₦45,000
                  </strong>

                  <small>
                    ★ 4.9 · 28 illustrative reviews · Identity verified
                  </small>

                  <button
                    className={styles.primary}
                    onClick={() => navigate('services')}
                  >
                    Explore all services
                  </button>
                </div>
              </div>
            </section>

            <section className={styles.section} id="jobs">
              <div className={styles.sectionHeading}>
                <h2>Find your next opportunity</h2>
                <p>
                  Explore work with clear terms, pay and location.
                </p>
              </div>

              <div className={styles.jobGrid}>
                <JobCard
                  title="Product designer"
                  company="Cedar Digital · Lagos"
                  type="Full-time · Hybrid"
                  salary="₦450,000–₦650,000 / month"
                  note="Health cover · Portfolio required"
                  onClick={() => {
                    setSelectedJob({
                      title: 'Product designer',
                      company: 'Cedar Digital',
                      reference: 'KH-JB-3107',
                      salary: '₦450,000–₦650,000 / month',
                      location: 'Lagos',
                      arrangement: 'Hybrid',
                      type: 'Full-time',
                      closes: '25 Oct 2026',
                    });

                    navigate('job-detail');
                  }}
                />

                <JobCard
                  title="Operations coordinator"
                  company="Riverline Commerce · Abuja"
                  type="Full-time · On-site"
                  salary="₦250,000–₦350,000 / month"
                  note="Monday–Friday · 2+ years experience"
                  onClick={() => {
                    setSelectedJob({
                      title: 'Operations coordinator',
                      company: 'Riverline Commerce',
                      reference: 'KH-JB-3112',
                      salary: '₦250,000–₦350,000 / month',
                      location: 'Abuja',
                      arrangement: 'On-site',
                      type: 'Full-time',
                      closes: '28 Oct 2026',
                    });

                    navigate('job-detail');
                  }}
                />
              </div>
            </section>

            <section className={styles.section} id="city">
              <div className={styles.sectionHeading}>
                <h2>Your city. A little closer.</h2>
                <p>
                  Book a ride or get a parcel moving, with clear upfront
                  estimates.
                </p>
              </div>

              <div className={styles.cityGrid}>
                <div className={styles.cityCard}>
                  <CarFront size={23} />

                  <h3>Get there with confidence</h3>

                  <p>
                    Choose your pickup, compare vehicles and see the
                    estimated fare before you request.
                  </p>

                  <button
                    className={styles.primary}
                    onClick={() => navigate('ride-booking')}
                  >
                    Book a ride
                  </button>
                </div>

                <div className={styles.cityCard}>
                  <Package size={23} />

                  <h3>Send a little possibility</h3>

                  <p>
                    Door-to-door local delivery with driver updates and a
                    trackable timeline.
                  </p>

                  <button
                    className={styles.primary}
                    onClick={() => navigate('ride-booking')}
                  >
                    Send a parcel
                  </button>
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeading}>
                <h2>A marketplace built on clarity</h2>
                <p>
                  Confidence comes from knowing what to expect.
                </p>
              </div>

              <div className={styles.clarityGrid}>
                {[
                  {
                    title: 'Know who you’re dealing with',
                    text: 'Identity checks are labelled. They do not guarantee inventory quality.',
                  },
                  {
                    title: 'Keep payment on KHUB',
                    text: 'Eligible payments have dispute support. Never share an OTP or pay an unknown personal account.',
                  },
                  {
                    title: 'Speak up, stay safe',
                    text: 'Report a listing, block a contact or reach support from every transaction.',
                  },
                ].map((item) => (
                  <div
                    className={styles.clarityCard}
                    key={item.title}
                  >
                    <ShieldCheck size={20} />
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className={styles.referral}>
              <div>
                <h2>
                  Better together.
                  <br />
                  Bring your people to KHUB.
                </h2>

                <p>
                  Invite friends and earn ₦1,000 when an eligible first
                  order is completed. Terms and reward limits apply.
                </p>

                <button
                  className={styles.lightButton}
                  onClick={() => navigate('referrals')}
                >
                  Explore referrals
                </button>

                <small>
                  For the makers, the movers and everyone building what’s
                  next.
                </small>
              </div>
            </section>
          </main>

      
  <footer className={styles.footer} aria-label="KHUB website footer">
    <div className={styles.footerSafety}>
      <ShieldCheck size={30} aria-hidden="true" />
      <div>
        <h2>NEVER PAY OUTSIDE KHUB!</h2>
        <p>
          Always make payments through the official KHUB platform. Payments
          made directly to sellers, vendors, drivers or other users outside
          KHUB are not protected by KHUB's secure payment and escrow system
          and may not be recoverable. Keep your transactions within KHUB to
          enjoy applicable transaction protection and support.
        </p>
      </div>
    </div>

    <div className={styles.footerIntro}>
      <a
        className={styles.logo}
        href="#top"
        aria-label="KHUB home"
        onClick={(e) => {
          e.preventDefault();
          navigate('home');
        }}
      >
        <img src={logo} alt="KHUB brand logo" />
      </a>

      <p className={styles.footerTagline}>Your No. 1 Business Hub.</p>
      <p>
        KHUB is your all-in-one business hub, connecting customers, businesses,
        service providers, job seekers, property owners, drivers and logistics
        providers on one platform. Shop, sell, rent, find jobs, offer services,
        book rides and access delivery solutions with KHUB.
      </p>
    </div>

    <div className={styles.footerColumns}>
      {[
        {
          title: 'EXPLORE KHUB',
          items: [
            ['Home', 'home'],
            ['Shop Products', 'shop'],
            ['Categories', 'categories'],
            ['Services', 'services'],
            ['Jobs & Careers', 'jobs'],
            ['Rentals', 'rentals'],
            ['Rides', 'ride-booking'],
            ['Logistics & Delivery', 'ride-booking'],
            ['Featured Listings', 'finds'],
            ['New Arrivals', 'finds'],
            ['Special Offers', 'finds'],
          ],
        },
        {
          title: 'FOR CUSTOMERS',
          items: [
            ['Create Account', 'account'],
            ['My Profile', 'settings'],
            ['My Orders', 'orders-bookings'],
            ['Track Orders', 'orders-bookings'],
            ['My Wishlist', 'account'],
            ['Shopping Cart', 'cart'],
            ['My Bookings', 'orders-bookings'],
            ['My Applications', 'job-application'],
            ['My Messages', 'messages'],
            ['My Wallet', 'wallet'],
            ['Transaction History', 'wallet'],
          ],
        },
        {
          title: 'FOR BUSINESSES & PARTNERS',
          items: [
            ['Become a Seller', 'seller-listing'],
            ['Register Your Business', 'account'],
            ['Become a Service Provider', 'provider-dashboard'],
            ['Post a Job', 'job-poster-dashboard'],
            ['Become a Landlord / Property Owner', 'rentals'],
            ['List Rental Spaces', 'rentals'],
            ['Become a Driver', 'driver-dashboard'],
            ['Become a Dispatch Rider', 'driver-dashboard'],
            ['Become a Logistics Partner', 'support'],
            ['Subscription Plans', 'subscription'],
            ['Referral Programme', 'referrals'],
          ],
        },
        {
          title: 'HELP & SUPPORT',
          items: [
            ['Help Centre', 'support'],
            ['FAQs', 'support'],
            ['Contact Customer Care', 'support'],
            ['How KHUB Works', 'discover'],
            ['How to Buy', 'shop'],
            ['How to Sell', 'seller-listing'],
            ['Payments & Withdrawals', 'wallet'],
            ['Orders & Deliveries', 'orders-bookings'],
            ['Returns & Refunds', 'support'],
            ['Booking Support', 'support'],
            ['Report a Problem', 'support'],
            ['Report Fraud', 'support'],
          ],
        },
        {
          title: 'SAFETY, TRUST & LEGAL',
          items: [
            ['Buyer Protection Policy', 'support'],
            ['Seller Protection Policy', 'support'],
            ['Secure Payments & Escrow', 'support'],
            ['Terms & Conditions', 'legal'],
            ['Privacy Policy', 'legal'],
            ['Refund & Return Policy', 'legal'],
            ['Cancellation Policy', 'legal'],
            ['Delivery Policy', 'legal'],
            ['Rental Terms', 'legal'],
            ['Job Posting Policy', 'legal'],
            ['Service Provider Policy', 'legal'],
            ['Prohibited Items & Activities', 'legal'],
            ['Dispute Resolution', 'support'],
            ['Account Suspension & Appeals', 'support'],
          ],
        },
        {
          title: 'ABOUT KHUB',
          items: [
            ['About Us', 'discover'],
            ['Mission & Vision', 'discover'],
            ['Why Choose KHUB?', 'discover'],
            ['Our Services', 'services'],
            ['Careers', 'jobs'],
            ['Become a Partner', 'support'],
            ['Affiliate Programme', 'referrals'],
            ['Advertise With Us', 'support'],
            ['Business Enquiries', 'support'],
            ['Contact Us', 'support'],
          ],
        },
      ].map((group) => (
        <details className={styles.footerGroup} key={group.title}>
          <summary>{group.title}</summary>
          <div className={styles.footerLinkList}>
            {group.items.map(([label, destination]) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  if (destination === 'subscription') {
                    openModal(
                      'KHUB subscription plans',
                      'Free: basic access. Verified: ₦5,000/month. Premium: ₦15,000/month. Subscription benefits and payment are not configured yet.',
                      'Contact support'
                    );
                    return;
                  }

                  if (destination === 'legal') {
                    openModal(
                      label,
                      'This policy page has not been created yet. Contact KHUB support for current policy information.',
                      'Contact support'
                    );
                    return;
                  }

                  if (['categories', 'finds', 'discover'].includes(destination)) {
                    navigate('home');
                    window.setTimeout(() => {
                      document
                        .getElementById(
                          destination === 'categories'
                            ? 'categories'
                            : destination === 'finds'
                              ? 'finds'
                              : 'discover'
                        )
                        ?.scrollIntoView({ behavior: 'smooth' });
                    }, 80);
                    return;
                  }

                  navigate(destination);
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </details>
      ))}
    </div>

    <div className={styles.footerPlans}>
      <div>
        <span className={styles.footerEyebrow}>GROW WITH KHUB</span>
        <h2>Find the right plan for your next step.</h2>
        <p>
          Choose the access level that suits you. Plan benefits and online
          subscriptions are not yet connected in this version.
        </p>
      </div>

      <div className={styles.footerPlanCards}>
        <article>
          <h3>Free</h3>
          <strong>Basic access</strong>
          <p>Get started with KHUB.</p>
        </article>
        <article>
          <h3>Verified</h3>
          <strong>
            ₦5,000 <small>/ month</small>
          </strong>
          <p>Plan details to be confirmed.</p>
        </article>
        <article>
          <h3>Premium</h3>
          <strong>
            ₦15,000 <small>/ month</small>
          </strong>
          <p>Plan details to be confirmed.</p>
        </article>
      </div>

      <button
        className={styles.footerPlanCta}
        type="button"
        onClick={() =>
          openModal(
            'KHUB subscription plans',
            'Subscriptions are not yet connected to a subscription page or payment service. Please contact support for information.',
            'Contact support'
          )
        }
      >
        EXPLORE SUBSCRIPTION PLANS <ArrowRight size={15} />
      </button>
    </div>

    <div className={styles.footerContact}>
      <div>
        <h2>Customer support</h2>
        <p><MapPin size={16} /> Kano State, Nigeria</p>
        <p>
          <Phone size={16} />
          <a href="tel:+2347065036761">+234 706 503 6761</a>
        </p>
        <p>
          <Mail size={16} />
          <a href="mailto:support@khub.com.ng">support@khub.com.ng</a>
        </p>
        <p>
          <ArrowUpRight size={16} />
          <a href="https://khub.com.ng" target="_blank" rel="noreferrer">
            khub.com.ng
          </a>
        </p>
      </div>

      <div>
        <h2>Payments & trust</h2>
        <p>
          Use only payment methods displayed during KHUB checkout. Available
          payment providers and escrow coverage depend on the live checkout
          configuration. Never share your PIN or one-time password.
        </p>
      </div>

      <div>
        <h2>Stay connected with KHUB!</h2>
        <p>
          Get updates on new products, business opportunities, job vacancies,
          special offers and exciting platform features.
        </p>

        <form
          className={styles.footerNewsletter}
          onSubmit={(e) => {
            e.preventDefault();
            notify(
              'Newsletter sign-up is not connected yet. No email was sent.'
            );
          }}
        >
          <label className={styles.srOnly} htmlFor="khub-newsletter-email">
            Email address
          </label>
          <input
            id="khub-newsletter-email"
            type="email"
            required
            placeholder="Enter your email address"
          />
          <button type="submit">Subscribe</button>
        </form>

        <small>
          By subscribing, you agree to receive KHUB updates. Unsubscribe
          options will be provided when newsletter service is connected.
        </small>
      </div>
    </div>

    <div className={styles.footerBottom}>
      <span>© 2026 KHUB. All Rights Reserved.</span>
      <div>
        <button
          onClick={() =>
            openModal(
              'Terms & Conditions',
              'This policy page has not been created yet. Contact support for current terms.',
              'Contact support'
            )
          }
        >
          Terms & Conditions
        </button>
        <button
          onClick={() =>
            openModal(
              'Privacy Policy',
              'This policy page has not been created yet. Contact support for current privacy information.',
              'Contact support'
            )
          }
        >
          Privacy Policy
        </button>
        <button
          onClick={() =>
            openModal(
              'Refund Policy',
              'This policy page has not been created yet. Contact support for current refund information.',
              'Contact support'
            )
          }
        >
          Refund Policy
        </button>
        <button
          onClick={() =>
            notify('Cookie preferences are not configured in this version.')
          }
        >
          Cookie Preferences
        </button>
      </div>
    </div>
  </footer>


          {toast && (
            <div className={styles.toast}>
              <CheckCircle2 size={17} />
              {toast}
            </div>
          )}

          {modal && (
            <div
              className={styles.modalBackdrop}
              role="presentation"
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) {
                  setModal(null);
                }
              }}
            >
              <section
                className={styles.modal}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
              >
                <button
                  className={styles.modalClose}
                  onClick={() => setModal(null)}
                  aria-label="Close dialog"
                >
                  <X size={19} />
                </button>

                {submitted ? (
                  <div className={styles.modalSuccess}>
                    <CheckCircle2 size={34} />

                    <h2>Thanks — you’re on your way.</h2>

                    <p>
                      This demo has recorded your interaction locally. No
                      information was sent to a server.
                    </p>

                    <button
                      className={styles.primary}
                      onClick={() => setModal(null)}
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <>
                    <span className={styles.tag}>
                      KHUB · Local marketplace
                    </span>

                    <h2 id="modal-title">{modal.title}</h2>

                    <p>{modal.description}</p>

                    <form onSubmit={onSubmit}>
                      <label>
                        Your name
                        <input
                          required
                          placeholder="Enter your name"
                        />
                      </label>

                      <label>
                        Email or phone
                        <input
                          required
                          placeholder="you@example.com or phone number"
                        />
                      </label>

                      <label>
                        More details
                        <textarea
                          placeholder="Share a few details (optional)"
                          rows="3"
                        />
                      </label>

                      <button
                        className={styles.primary}
                        type="submit"
                      >
                        {modal.action} <ArrowRight size={15} />
                      </button>

                      <small>
                        Demo interface only. Submitting will not send your
                        details anywhere.
                      </small>
                    </form>
                  </>
                )}
              </section>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function JobCard({
  title,
  company,
  type,
  salary,
  note,
  onClick,
}) {
  return (
    <article className={styles.jobCard}>
      <h3>{title}</h3>
      <span className={styles.tag}>{type}</span>
      <p>{company}</p>
      <strong>{salary}</strong>
      <small>{note}</small>

      <button
        className={styles.outlineButton}
        onClick={onClick}
      >
        Explore role <ChevronRight size={14} />
      </button>
    </article>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
