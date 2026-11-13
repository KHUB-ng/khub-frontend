
import logo from './assets/khub_green-removebg-preview.png';
import React, { useEffect, useMemo, useState } from 'react';
import { api } from './lib/api.js';
import { authApi } from './lib/auth.js';
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
  Star,
  ArrowLeft,
  Plus,
  Minus,
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
import ServicesPage from './ServicesPage.jsx';
import FooterContentPage, { footerRoutes } from './FooterContentPage.jsx';
import AboutUsPage from './AboutUsPage.jsx';


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
  switch (String(role || '').toLowerCase()) {
    case 'buyer': return 'dashboard';
    case 'seller': return 'seller-dashboard';
    case 'driver': return 'driver-dashboard';
    case 'provider':
    case 'service_provider': return 'provider-dashboard';
    case 'job poster':
    case 'job_poster': return 'job-poster-dashboard';
    case 'job seeker':
    case 'job_seeker': return 'job-listings';
    case 'admin': return 'admin-dashboard';
    default: return 'dashboard';
  }
}

function normalizeApiUser(user) {
  if (!user) return null;
  const roles = {
    buyer: 'Buyer',
    seller: 'Seller',
    driver: 'Driver',
    service_provider: 'Provider',
    job_poster: 'Job poster',
    admin: 'Admin',
  };
  return { ...user, role_code: user.role, role: roles[String(user.role || '').toLowerCase()] || user.role };
}

function App() {
  const [page, setPage] = useState('home');

  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [listingsError, setListingsError] = useState('');

  const [saved, setSaved] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [toast, setToast] = useState('');

  // Stores the product currently being viewed.
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [paymentDetails, setPaymentDetails] = useState(null);
  const [deliveryDetails, setDeliveryDetails] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    let active = true;
    authApi.getCurrentUser()
      .then((user) => { if (active) setCurrentUser(normalizeApiUser(user)); })
      .catch(() => { if (active) setCurrentUser(null); })
      .finally(() => { if (active) setAuthLoading(false); });

    api.get('/listings?page=1&page_size=24', { auth: false })
      .then((payload) => {
        if (!active) return;
        const rows = Array.isArray(payload) ? payload : (payload?.items || []);
        const mapped = rows.map((listing) => {
          const vertical = listing.vertical;
          const image = vertical === 'rental' ? rental : vertical === 'service' ? service : vertical === 'job' ? camera : chair;
          const amountKobo = listing.effective_price_kobo ?? listing.price_kobo ?? 0;
          const kind = vertical === 'rental' ? 'Rent' : vertical === 'service' ? 'Services' : vertical === 'job' ? 'Jobs' : 'Shop';
          return {
            id: listing.pid,
            pid: listing.pid,
            name: listing.title,
            category: [listing.category, listing.location].filter(Boolean).join(' · '),
            seller: 'KHUB marketplace listing',
            sellerName: 'KHUB member',
            price: listing.price_display || (amountKobo ? `₦${(amountKobo / 100).toLocaleString('en-NG')}` : 'Contact provider'),
            numericPrice: amountKobo / 100,
            image,
            kind,
            location: listing.location || 'Nigeria',
            condition: listing.attributes?.condition || 'Listed on KHUB',
            availability: listing.status,
            description: listing.description,
            features: [],
            vertical,
            priceKobo: amountKobo,
          };
        });
        setProducts(mapped);
        setListingsError('');
      })
      .catch((error) => {
        if (active) setListingsError(error?.message || 'Marketplace listings could not be loaded.');
      })
      .finally(() => { if (active) setListingsLoading(false); });

    return () => { active = false; };
  }, []);

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
    [activeCategory, search, products]
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

  const openModal = (title) => {
    if (!currentUser) {
      navigate('account');
      notify('Sign in to contact a KHUB member.');
      return;
    }
    notify(`${title}: continue securely in KHUB messages.`);
    navigate('messages');
  };

  const toggleSaved = (id) =>
    setSaved((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );

  // Opens the dedicated detail page for a selected product.
  const openProduct = (product) => {
    setSelectedProduct(product);
    setPage('product-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Adds a product to the cart, increasing quantity if it already exists.
  const addProductToCart = (product, showNotification = true) => {
    setCartItems((old) => {
      const existing = old.find(
        (item) => item.id === product.id
      );

      if (existing) {
        return old.map((item) =>
          item.id === product.id
            ? {
                ...item,
                qty: item.qty + 1,
              }
            : item
        );
      }

      return [
        ...old,
        {
          id: product.id,
          name: product.name,
          seller: product.sellerName || product.seller || 'KHUB seller',
          price: product.numericPrice,
          image: product.image,
          qty: 1,
          saved: false,
        },
      ];
    });

    if (showNotification) {
      notify(`${product.name} added to your cart`);
    }
  };

  // Buy Now takes the selected product to the delivery process.
  const buyProductNow = (product) => {
    setSelectedProduct(product);

    if (product.kind === 'Rent') {
      notify('Please confirm rental dates with the provider before booking.');
      navigate('rentals');
      return;
    }

    addProductToCart(product, false);
    navigate('checkout');
  };

  const submitGlobalSearch = (event) => {
    event.preventDefault();
    const query = globalSearch.trim();
    if (!query) return;

    const normalized = query.toLowerCase();

    if (/\b(ride|rides|taxi|driver|pickup|drop.?off|delivery|deliveries|parcel|logistics)\b/.test(normalized)) {
      navigate('ride-booking');
      return;
    }

    setGlobalSearch(query);
    setPage('discover');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigate = (destination) => {
    setMobileMenu(false);
    const protectedPages = new Set([
      'settings', 'dashboard', 'driver-dashboard', 'provider-dashboard',
      'seller-dashboard', 'admin-dashboard', 'job-poster-dashboard',
      'orders', 'orders-bookings', 'referrals', 'messages', 'wallet',
      'job-application', 'delivery-details', 'checkout', 'payment-success',
      'cart', 'seller-listing', 'storefront', 'ride-tracking'
    ]);
    if (protectedPages.has(destination) && !currentUser) {
      setPage('account');
      notify('Sign in to access this part of KHUB.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (destination === 'home') {
      setPage('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Opens dedicated standalone footer pages.
    if (destination.startsWith('footer-')) {
      setPage(destination);
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
      destination === 'product-detail' ||
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

  const handleLogout = async () => {
    try { await authApi.signOut(); }
    finally {
      setCurrentUser(null);
      setCartItems([]);
      setPage('account');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleList = () => {
    navigate('seller-listing');
  };

  // Dedicated About Us page.
  if (page === 'footer-about-us') {
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

        <AboutUsPage onNavigate={navigate} />
      </>
    );
  }

  // Dedicated standalone pages for other footer links.
  if (page.startsWith('footer-')) {
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

        <FooterContentPage
          page={page.replace('footer-', '')}
          onNavigate={navigate}
        />
      </>
    );
  }

  // Dedicated Shop page.
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
          onAddToCart={addProductToCart}
        />
      </>
    );
  }

  // Dedicated Rentals page.
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

  // Dedicated Services page.
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

      {page === 'product-detail' ? (
        selectedProduct ? (
          <main
            style={{
              maxWidth: '1200px',
              margin: '0 auto',
              padding: '35px 20px 80px',
              color: '#183b2b',
            }}
          >
            <button
              type="button"
              onClick={() => navigate('home')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                border: 'none',
                background: 'transparent',
                color: '#26734d',
                fontWeight: 700,
                cursor: 'pointer',
                marginBottom: '28px',
                padding: '8px 0',
              }}
            >
              <ArrowLeft size={18} />
              Back to marketplace
            </button>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
                gap: '42px',
                alignItems: 'start',
              }}
            >
              <div>
                <div
                  style={{
                    background: '#f4f7f4',
                    borderRadius: '18px',
                    overflow: 'hidden',
                    minHeight: '350px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      maxHeight: '550px',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '10px',
                    flexWrap: 'wrap',
                    marginTop: '16px',
                  }}
                >
                  <span
                    style={{
                      background: '#e8f5ed',
                      color: '#24734b',
                      padding: '8px 13px',
                      borderRadius: '30px',
                      fontSize: '13px',
                      fontWeight: 700,
                    }}
                  >
                    <ShieldCheck
                      size={14}
                      style={{
                        verticalAlign: 'middle',
                        marginRight: '5px',
                      }}
                    />
                    KHUB listing
                  </span>

                  <span
                    style={{
                      background: '#f1f3f1',
                      padding: '8px 13px',
                      borderRadius: '30px',
                      fontSize: '13px',
                    }}
                  >
                    {selectedProduct.condition}
                  </span>

                  <span
                    style={{
                      background: '#f1f3f1',
                      padding: '8px 13px',
                      borderRadius: '30px',
                      fontSize: '13px',
                    }}
                  >
                    {selectedProduct.availability}
                  </span>
                </div>
              </div>

              <div>
                <span
                  style={{
                    color: '#278052',
                    fontSize: '13px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                  }}
                >
                  {selectedProduct.kind === 'Rent'
                    ? 'Rental listing'
                    : 'Marketplace listing'}
                </span>

                <h1
                  style={{
                    fontSize: 'clamp(28px, 4vw, 42px)',
                    lineHeight: 1.15,
                    margin: '12px 0',
                    color: '#173b2a',
                  }}
                >
                  {selectedProduct.name}
                </h1>

                <p
                  style={{
                    color: '#718077',
                    fontSize: '14px',
                    lineHeight: 1.7,
                  }}
                >
                  {selectedProduct.category}
                </p>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    margin: '20px 0',
                    color: '#28734d',
                    fontSize: '14px',
                  }}
                >
                  <MapPin size={17} />
                  {selectedProduct.location}
                </div>

                <div
                  style={{
                    fontSize: '30px',
                    fontWeight: 800,
                    color: '#173b2a',
                    margin: '18px 0',
                  }}
                >
                  {selectedProduct.price}
                </div>

                {selectedProduct.kind === 'Rent' && (
                  <p
                    style={{
                      color: '#78847c',
                      fontSize: '13px',
                      marginTop: '-10px',
                    }}
                  >
                    Rental price per day. Confirm availability and terms
                    with the provider before booking.
                  </p>
                )}

                <div
                  style={{
                    borderTop: '1px solid #e5ebe6',
                    borderBottom: '1px solid #e5ebe6',
                    padding: '20px 0',
                    margin: '22px 0',
                  }}
                >
                  <h3
                    style={{
                      margin: '0 0 9px',
                      fontSize: '16px',
                    }}
                  >
                    Seller information
                  </h3>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: '#e8f5ed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#26734d',
                      }}
                    >
                      <ShoppingBag size={20} />
                    </div>

                    <div>
                      <strong>{selectedProduct.sellerName}</strong>
                      <p
                        style={{
                          margin: '4px 0 0',
                          color: '#718077',
                          fontSize: '13px',
                        }}
                      >
                        {selectedProduct.seller}
                      </p>
                    </div>
                  </div>
                </div>

                <h3
                  style={{
                    fontSize: '17px',
                    marginBottom: '9px',
                  }}
                >
                  Product description
                </h3>

                <p
                  style={{
                    color: '#65746a',
                    lineHeight: 1.8,
                    fontSize: '15px',
                  }}
                >
                  {selectedProduct.description}
                </p>

                <h3
                  style={{
                    fontSize: '17px',
                    margin: '25px 0 12px',
                  }}
                >
                  Listing details
                </h3>

                <ul
                  style={{
                    paddingLeft: '20px',
                    color: '#65746a',
                    lineHeight: 2,
                    fontSize: '14px',
                  }}
                >
                  {selectedProduct.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '12px',
                    marginTop: '28px',
                  }}
                >
                  {selectedProduct.kind === 'Rent' ? (
                    <button
                      type="button"
                      onClick={() => navigate('rentals')}
                      style={{
                        flex: '1 1 180px',
                        minHeight: '50px',
                        border: 'none',
                        borderRadius: '9px',
                        background: '#26734d',
                        color: '#fff',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Explore rental options
                      <ArrowUpRight
                        size={16}
                        style={{
                          verticalAlign: 'middle',
                          marginLeft: '7px',
                        }}
                      />
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => buyProductNow(selectedProduct)}
                        style={{
                          flex: '1 1 150px',
                          minHeight: '50px',
                          border: 'none',
                          borderRadius: '9px',
                          background: '#26734d',
                          color: '#fff',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Buy now
                        <ArrowUpRight
                          size={16}
                          style={{
                            verticalAlign: 'middle',
                            marginLeft: '7px',
                          }}
                        />
                      </button>

                      <button
                        type="button"
                        onClick={() => addProductToCart(selectedProduct)}
                        style={{
                          flex: '1 1 150px',
                          minHeight: '50px',
                          border: '1px solid #26734d',
                          borderRadius: '9px',
                          background: '#fff',
                          color: '#26734d',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <ShoppingBag
                          size={16}
                          style={{
                            verticalAlign: 'middle',
                            marginRight: '7px',
                          }}
                        />
                        Add to cart
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      toggleSaved(selectedProduct.id);
                      notify(
                        saved.includes(selectedProduct.id)
                          ? 'Removed from your wishlist'
                          : 'Added to your wishlist'
                      );
                    }}
                    aria-label={
                      saved.includes(selectedProduct.id)
                        ? 'Remove from wishlist'
                        : 'Add to wishlist'
                    }
                    style={{
                      width: '52px',
                      minHeight: '50px',
                      border: '1px solid #dce5de',
                      borderRadius: '9px',
                      background: '#fff',
                      color: saved.includes(selectedProduct.id)
                        ? '#d34a62'
                        : '#26734d',
                      cursor: 'pointer',
                    }}
                  >
                    <Heart
                      size={20}
                      fill={
                        saved.includes(selectedProduct.id)
                          ? 'currentColor'
                          : 'none'
                      }
                    />
                  </button>
                </div>

                <div
                  style={{
                    background: '#f3f8f4',
                    borderRadius: '12px',
                    padding: '16px',
                    marginTop: '25px',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                  }}
                >
                  <ShieldCheck
                    size={21}
                    color="#26734d"
                    style={{ flexShrink: 0 }}
                  />
                  <div>
                    <strong style={{ fontSize: '14px' }}>
                      Shop safely on KHUB
                    </strong>
                    <p
                      style={{
                        margin: '5px 0 0',
                        color: '#65746a',
                        fontSize: '13px',
                        lineHeight: 1.6,
                      }}
                    >
                      Keep payments and transaction communication within
                      official KHUB channels. Never share your PIN or OTP.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: '55px',
                paddingTop: '28px',
                borderTop: '1px solid #e5ebe6',
              }}
            >
              <h2 style={{ fontSize: '23px' }}>
                Explore more on KHUB
              </h2>
              <p style={{ color: '#718077' }}>
                Discover more products, rentals and opportunities.
              </p>

              <button
                type="button"
                onClick={() => navigate('shop')}
                style={{
                  border: 'none',
                  background: '#26734d',
                  color: '#fff',
                  borderRadius: '8px',
                  padding: '13px 20px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  marginTop: '10px',
                }}
              >
                Visit KHUB Shop
                <ArrowRight
                  size={15}
                  style={{
                    verticalAlign: 'middle',
                    marginLeft: '8px',
                  }}
                />
              </button>
            </div>
          </main>
        ) : (
          <main style={{ padding: '80px 20px', textAlign: 'center' }}>
            <h2>No product selected</h2>
            <p>Choose a listing from the marketplace to view its details.</p>
            <button
              type="button"
              onClick={() => navigate('home')}
              className={styles.primary}
            >
              Return home
            </button>
          </main>
        )
      ) : page === 'seller-listing' ? (
        <SellerListingForm
          onNavigate={navigate}
          onSaved={() => {}}
        />
      ) : page === 'cart' ? (
        <CartPage
          onBack={() => navigate('dashboard')}
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
          cartItems={cartItems}
          onNavigate={navigate}
          onBack={() => navigate('cart')}
          onSuccess={(order) => {
            setPaymentDetails(order);
            setCartItems([]);
            navigate('payment-success');
          }}
        />
      ) : page === 'payment-success' ? (
        <PaymentSuccessPage
          payment={paymentDetails}
          onNavigate={navigate}
        />
      ) : page === 'admin-dashboard' ? (
        <AdminDashboard onNavigate={navigate} />
      ) : page === 'discover' ? (
        <DiscoverPage
          initialQuery={globalSearch}
          onHome={() => navigate('home')}
          onAccount={() => navigate('account')}
        />
      ) : page === 'account' ? (
        <AccountPage
          onHome={() => navigate('home')}
          onAccountCreated={(user) => {
            if (!user) return;

            const normalized = normalizeApiUser(user);
            setCurrentUser(normalized);
            const destination = getDashboardForRole(normalized.role_code || normalized.role);
            navigate(destination);
          }}
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
          onBack={() => navigate('dashboard')}
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

                <form
                  className={styles.globalSearch}
                  onSubmit={submitGlobalSearch}
                  role="search"
                >
                  <Search size={20} aria-hidden="true" />
                  <label
                    className={styles.srOnly}
                    htmlFor="khub-global-search"
                  >
                    Search everything on KHUB
                  </label>
                  <input
                    id="khub-global-search"
                    type="search"
                    value={globalSearch}
                    onChange={(event) =>
                      setGlobalSearch(event.target.value)
                    }
                    placeholder="Search products, rentals, services, jobs..."
                    autoComplete="off"
                  />
                  <button type="submit">
                    Search KHUB <ArrowRight size={16} />
                  </button>
                </form>

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
                  <article
                    className={styles.productCard}
                    key={p.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`View details for ${p.name}`}
                    onClick={() => openProduct(p)}
                    onKeyDown={(event) => {
                      if (
                        event.key === 'Enter' ||
                        event.key === ' '
                      ) {
                        event.preventDefault();
                        openProduct(p);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className={styles.productImage}>
                      <img src={p.image} alt={p.name} />

                      <button
                        type="button"
                        className={`${styles.saveButton} ${
                          saved.includes(p.id) ? styles.saved : ''
                        }`}
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleSaved(p.id);
                        }}
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
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            buyProductNow(p);
                          }}
                        >
                          Buy now <ArrowUpRight size={13} />
                        </button>

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            addProductToCart(p);
                          }}
                        >
                          <ShoppingBag size={13} />
                          Add to cart
                        </button>

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleSaved(p.id);
                          }}
                        >
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

                      <small
                        style={{
                          display: 'block',
                          marginTop: '12px',
                          color: '#26734d',
                          fontWeight: 600,
                        }}
                      >
                        View product details <ArrowUpRight size={12} />
                      </small>
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
                <h2>Spaces and equipment to rent</h2>
                <p>Current rental listings published by KHUB members.</p>
              </div>
              <div className={styles.productGrid}>
                {products.filter(item => item.kind === 'Rent').slice(0, 3).map(item => (
                  <article className={styles.productCard} key={item.id} onClick={() => openProduct(item)}>
                    <div className={styles.productImage}><img src={item.image} alt={item.name} /></div>
                    <div className={styles.productInfo}><h3>{item.name}</h3><p>{item.category}</p><strong>{item.price}</strong></div>
                  </article>
                ))}
                {products.filter(item => item.kind === 'Rent').length === 0 && <p>No active rental listings are available right now.</p>}
              </div>
              <button className={styles.primary} onClick={() => navigate('rentals')}>Explore rentals</button>
            </section>

            <section className={styles.section} id="services">
              <div className={styles.sectionHeading}>
                <h2>Services from KHUB providers</h2>
                <p>Explore real services currently listed on the platform.</p>
              </div>
              <div className={styles.productGrid}>
                {products.filter(item => item.kind === 'Services').slice(0, 3).map(item => (
                  <article className={styles.productCard} key={item.id} onClick={() => openProduct(item)}>
                    <div className={styles.productImage}><img src={item.image} alt={item.name} /></div>
                    <div className={styles.productInfo}><h3>{item.name}</h3><p>{item.category}</p><strong>{item.price}</strong></div>
                  </article>
                ))}
                {products.filter(item => item.kind === 'Services').length === 0 && <p>No active service listings are available right now.</p>}
              </div>
              <button className={styles.primary} onClick={() => navigate('services')}>Explore services</button>
            </section>

            <section className={styles.section} id="jobs">
              <div className={styles.sectionHeading}>
                <h2>Current opportunities</h2>
                <p>Job listings published by employers on KHUB.</p>
              </div>
              <div className={styles.productGrid}>
                {products.filter(item => item.kind === 'Jobs').slice(0, 4).map(item => (
                  <article className={styles.productCard} key={item.id} onClick={() => { setSelectedJob({ title: item.name, company: item.sellerName, reference: item.id, salary: item.price, location: item.location, description: item.description }); navigate('job-detail'); }}>
                    <div className={styles.productInfo}><h3>{item.name}</h3><p>{item.category}</p><strong>{item.price}</strong></div>
                  </article>
                ))}
                {products.filter(item => item.kind === 'Jobs').length === 0 && <p>No active job listings are available right now.</p>}
              </div>
              <button className={styles.primary} onClick={() => navigate('job-listings')}>Explore jobs</button>
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

              <p className={styles.footerTagline}>
                Your No. 1 Business Hub.
              </p>
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
                    ['Categories', 'shop'],
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
                    ['About Us', 'footer-about-us'],
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
                          // About Us opens its dedicated standalone page.
                          if (label === 'About Us') {
                            navigate('footer-about-us');
                            return;
                          }

                          if (footerRoutes[label]) {
                            navigate(footerRoutes[label]);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                            return;
                          }

                          if (destination === 'subscription') {
                            navigate('footer-subscription-plans');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                            return;
                          }

                          if (destination === 'legal') {
                            const slug = `footer-${label
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, '-')}`;

                            navigate(slug);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                            return;
                          }

                          if (
                            ['categories', 'finds', 'discover'].includes(
                              destination
                            )
                          ) {
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
                  <a
                    href="https://khub.com.ng"
                    target="_blank"
                    rel="noreferrer"
                  >
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
                  <label
                    className={styles.srOnly}
                    htmlFor="khub-newsletter-email"
                  >
                    Email address
                  </label>
                  <input
                    id="khub-newsletter-email"
                    type="email"
                    required
                    placeholder="Enter your email address"
                  />
                  <button type="submit">Submit</button>
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
