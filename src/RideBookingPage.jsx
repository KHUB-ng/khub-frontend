import React, { useMemo, useState } from 'react';
import { ArrowLeft, CarFront, Package, CalendarClock, MapPin, Wallet, CheckCircle2 } from 'lucide-react';
import styles from './RideBookingPage.module.css';

const rideOptions = [
  { id: 'Economy', price: 5200, seats: '4 seats', pickup: 'Pickup in 4 min', vehicle: 'Toyota Corolla', detail: 'Everyday trips' },
  { id: 'Comfort', price: 7800, seats: '4 seats', pickup: 'Pickup in 6 min', vehicle: 'Extra legroom', detail: 'More room to relax' },
  { id: 'XL', price: 10500, seats: '6 seats', pickup: 'Pickup in 8 min', vehicle: 'Larger vehicle', detail: 'For groups and luggage' },
];
const money = value => '₦' + Number(value).toLocaleString('en-NG');

export default function RideBookingPage({ user = {}, onNavigate = () => {}, onBack = () => {} }) {
  const [mode, setMode] = useState('Ride');
  const [pickup, setPickup] = useState('12 Admiralty Way, Lekki Phase 1');
  const [destination, setDestination] = useState('18 Ozumba Mbadiwe Ave, Victoria Island');
  const [when, setWhen] = useState('Now');
  const [passengers, setPassengers] = useState('1 passenger');
  const [pickupNote, setPickupNote] = useState('Flat 3B · Meet at the gate');
  const [ride, setRide] = useState('Economy');
  const [payment, setPayment] = useState('KHUB wallet · Available ₦86,500');
  const [notice, setNotice] = useState('');
  const [requested, setRequested] = useState(false);
  const [parcel, setParcel] = useState({ item: 'Small parcel', recipient: '', phone: '' });
  const selected = rideOptions.find(item => item.id === ride) || rideOptions[0];
  const estimate = useMemo(() => selected.price, [selected]);
  const request = () => {
    if (!pickup.trim() || !destination.trim()) { setNotice('Add both pickup and destination before requesting.'); return; }
    if (mode === 'Ride') {
      setRequested(true);
      setNotice(`${ride} request prepared · ${money(estimate)} estimated. No payment has been taken in this demo.`);
    } else if (mode === 'Scheduled') {
      setNotice('Your scheduled ride details are saved in this demo. Choose a time before confirming a live booking.');
    } else {
      setNotice('Parcel request prepared. Add recipient details and confirm pickup to continue.');
    }
  };
  const confirm = () => onNavigate('ride-tracking');

  return <main className={styles.page}>
    <div style={{ marginBottom: 18 }}><button type="button" onClick={onBack} aria-label="Go back to the previous page" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid #dce8df', background: '#fff', color: '#176b43', borderRadius: 999, padding: '10px 16px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(20,60,35,.06)' }}><span aria-hidden="true">←</span> Back</button></div>
    <header className={styles.heading}>
      <h1>Your city. A little closer.</h1>
      <p>06 Rides and logistics / Ride booking</p>
      <p>Book across Lagos with an upfront fare estimate. All times are WAT.</p>
    </header>
    <nav className={styles.tabs} aria-label="Ride and delivery type">
      {['Ride', 'Send a parcel', 'Scheduled'].map(item => <button key={item} className={mode === item ? styles.activeTab : ''} onClick={() => { setMode(item); setRequested(false); setNotice(''); }}>{item}</button>)}
    </nav>
    <div className={styles.layout}>
      <div className={styles.leftColumn}>
        <section className={styles.card + ' ' + styles.destinationCard}>
          <h2>{mode === 'Send a parcel' ? 'Where is it going?' : 'Where are we going?'}</h2>
          <label className={styles.field}><span><MapPin size={13}/> Pickup</span><input value={pickup} onChange={e => setPickup(e.target.value)} aria-label="Pickup address" /></label>
          <label className={styles.field}><span><MapPin size={13}/> {mode === 'Send a parcel' ? 'Drop-off' : 'Destination'}</span><input value={destination} onChange={e => setDestination(e.target.value)} aria-label="Destination address" /></label>
          {mode === 'Send a parcel' ? <>
            <label className={styles.field}><span>Parcel size</span><select value={parcel.item} onChange={e => setParcel(p => ({ ...p, item: e.target.value }))}><option>Small parcel</option><option>Medium parcel</option><option>Large parcel</option></select></label>
            <div className={styles.twoFields}><label className={styles.field}><span>Recipient name</span><input value={parcel.recipient} onChange={e => setParcel(p => ({ ...p, recipient: e.target.value }))} placeholder="Full name" /></label><label className={styles.field}><span>Recipient phone</span><input value={parcel.phone} onChange={e => setParcel(p => ({ ...p, phone: e.target.value }))} placeholder="+234…" /></label></div>
          </> : <div className={styles.twoFields}>
            <label className={styles.field}><span>When</span><select value={when} onChange={e => setWhen(e.target.value)}><option>Now</option><option>In 30 minutes</option><option>In 1 hour</option><option>Choose time</option></select></label>
            <label className={styles.field}><span>Passengers</span><select value={passengers} onChange={e => setPassengers(e.target.value)}><option>1 passenger</option><option>2 passengers</option><option>3 passengers</option><option>4 passengers</option><option>5 passengers</option><option>6 passengers</option></select></label>
          </div>}
          <label className={styles.noteField}><span>Pickup note</span><input value={pickupNote} onChange={e => setPickupNote(e.target.value)} /></label>
        </section>
        <section className={styles.card + ' ' + styles.rideCard}>
          <h2>{mode === 'Send a parcel' ? 'Choose delivery speed' : 'Choose your ride'}</h2>
          {mode === 'Send a parcel' ? <>
            <label className={styles.rideOption}><input type="radio" checked={ride === 'Economy'} onChange={() => setRide('Economy')} /><span><strong>Standard delivery · ₦3,000</strong><small>Pickup in 30–45 min · Trackable delivery</small><small>✓ Available</small></span></label>
            <label className={styles.rideOption}><input type="radio" checked={ride === 'Comfort'} onChange={() => setRide('Comfort')} /><span><strong>Express delivery · ₦4,500</strong><small>Pickup in 15–25 min · Priority handling</small><small>✓ Available</small></span></label>
          </> : rideOptions.map(option => <label className={styles.rideOption} key={option.id}><input type="radio" name="ride" checked={ride === option.id} onChange={() => setRide(option.id)} /><span><strong>{option.id} · {money(option.price)}</strong><small>{option.seats} · {option.pickup} · {option.vehicle}</small><small>✓ Available</small></span></label>)}
        </section>
      </div>
      <div className={styles.rightColumn}>
        <section className={styles.mapCard} aria-label="Illustrative route map">
          <div className={styles.mapTop}><strong>Lekki · Admiralty Way</strong><span>8.2 km · 24 min</span></div>
          <svg className={styles.route} viewBox="0 0 700 330" preserveAspectRatio="none" role="img" aria-label="Illustrative route from Lekki to Victoria Island"><path d="M35 54 V116 H240 V174 H470 V228" fill="none" stroke="#123f32" strokeWidth="5" strokeLinejoin="miter"/><circle cx="35" cy="54" r="7" fill="#123f32" stroke="#fff" strokeWidth="3"/><circle cx="470" cy="228" r="7" fill="#123f32" stroke="#fff" strokeWidth="3"/></svg>
          <strong className={styles.mapDestination}>Victoria Island · Ozumba</strong>
        </section>
        <p className={styles.caption}>Illustrative route, not a live map · Lagos</p>
        <section className={styles.card + ' ' + styles.fareCard}>
          <h2>{mode === 'Send a parcel' ? 'Delivery estimate' : 'Fare estimate'}</h2>
          <div className={styles.fareLine}><span>Base + distance/time · {money(mode === 'Send a parcel' ? (ride === 'Comfort' ? 4000 : 2500) : estimate - 500)}</span><span>{mode === 'Send a parcel' ? 'Delivery fee · ₦500' : 'Booking fee · ₦500'}</span></div>
          <h3>{mode === 'Send a parcel' ? `Estimated total · ${ride === 'Comfort' ? '₦4,500' : '₦3,000'}` : `${ride} total · ${money(estimate)}`}</h3>
          <p>8.2 km · About 24 min. Estimate includes applicable taxes; changed destination, waiting time after 3 min or tolls may change final fare. Review any change before accepting.</p>
          <label className={styles.field + ' ' + styles.paymentField}><span><Wallet size={13}/> Payment method</span><select value={payment} onChange={e => setPayment(e.target.value)}><option>KHUB wallet · Available ₦86,500</option><option>Card · Visa ending 2041</option><option>Cash to driver</option></select></label>
          {!requested ? <button className={styles.primary + ' ' + styles.full} onClick={request}>{mode === 'Send a parcel' ? 'Request delivery · ₦3,000' : mode === 'Scheduled' ? `Schedule ${ride} · ${money(estimate)}` : `Request ${ride} · ${money(estimate)}`}</button> : <div className={styles.confirmBox}><p><CheckCircle2 size={16}/> Request details ready</p><span>{ride} · {money(estimate)} estimate · {payment}</span><button className={styles.primary + ' ' + styles.full} onClick={confirm}>Confirm and view trip</button></div>}
        </section>
        <section className={styles.tip}><p>State example · Ride unavailable<br/>No Economy drivers near your pickup right now. You have not been charged. Keep your route and try Comfort or retry shortly.</p><button className={styles.link} onClick={() => { setRide('Comfort'); setRequested(false); setNotice('Comfort selected. Review the updated fare before requesting.'); }}>Try again</button></section>
        <p className={styles.footerNote}>Share trip and safety support are available once a driver is assigned. Always check the plate and driver before boarding.</p>
      </div>
    </div>
    {notice && <div className={styles.notice} role="status"><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss notice">×</button></div>}
    <button className={styles.back} onClick={onBack}><ArrowLeft size={14}/> Back to dashboard</button>
  </main>;
}
