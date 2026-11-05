import React, { useState } from 'react';
import styles from './PersonalSettingsPage.module.css';

export default function PersonalSettingsPage({ user = {}, onBack = () => {}, onNavigate = () => {} }) {
  const parts = (user.name || 'Tomi Adeyemi').trim().split(/\s+/);
  const [firstName, setFirstName] = useState(parts[0] || 'Tomi');
  const [lastName, setLastName] = useState(parts.slice(1).join(' ') || 'Adeyemi');
  const [displayName, setDisplayName] = useState(user.name || 'Tomi Adeyemi');
  const [about, setAbout] = useState('Product designer in Lagos, building a small wellness business and discovering good local work.');
  const [city, setCity] = useState('Lagos');
  const [area, setArea] = useState('Lekki Phase 1');
  const [showCity, setShowCity] = useState(true);
  const [showAddress, setShowAddress] = useState(false);
  const [allowMessages, setAllowMessages] = useState(true);
  const [saved, setSaved] = useState(false);
  const [photoMessage, setPhotoMessage] = useState('');
  const [role, setRole] = useState(user.role || 'Buyer / service customer');
  const choosePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg','image/png'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setPhotoMessage('Validation example · Avatar rejected\nOnly JPG or PNG under 5 MB is supported. Your profile details remain unchanged.');
      e.target.value = '';
      return;
    }
    setPhotoMessage('Photo selected. Save profile to keep this preview.');
  };
  const save = (e) => { e.preventDefault(); setSaved(true); setPhotoMessage(''); };
  return <main className={styles.page}>
    <div style={{ marginBottom: 18 }}><button type="button" onClick={onBack} aria-label="Go back to the previous page" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid #dce8df', background: '#fff', color: '#176b43', borderRadius: 999, padding: '10px 16px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(20,60,35,.06)' }}><span aria-hidden="true">←</span> Back</button></div>
    <header className={styles.heading}><h1>A profile that feels like you.</h1><p>Q9 Personal hub / Profile edit</p><span>Manage your public identity and private contact details. You control what’s shared.</span></header>
    <div className={styles.layout}>
      <div className={styles.leftColumn}>
        <form className={styles.card} onSubmit={save}>
          <h2>Public profile</h2>
          <div className={styles.avatarRow}><div className={styles.avatar}>{`${firstName[0] || 'T'}${lastName[0] || 'A'}`.toUpperCase()}</div><div className={styles.photoControl}><label className={styles.link} htmlFor="profile-photo">Change photo</label><input id="profile-photo" className={styles.fileInput} type="file" accept="image/jpeg,image/png" onChange={choosePhoto}/><p>JPG or PNG · Up to 5 MB · Square image recommended</p></div></div>
          <div className={styles.fieldsTwo}><label>First name<input value={firstName} onChange={e=>{setFirstName(e.target.value);setSaved(false)}} required/></label><label>Last name<input value={lastName} onChange={e=>{setLastName(e.target.value);setSaved(false)}} required/></label></div>
          <label className={styles.fullField}>Public display name<input value={displayName} onChange={e=>{setDisplayName(e.target.value);setSaved(false)}} required/></label>
          <label className={styles.fullField}>About you<textarea rows="3" value={about} onChange={e=>{setAbout(e.target.value);setSaved(false)}}/></label>
          <div className={styles.fieldsTwo}><label>City<select value={city} onChange={e=>{setCity(e.target.value);setSaved(false)}}><option>Lagos</option><option>Abuja</option><option>Port Harcourt</option><option>Enugu</option><option>Ibadan</option></select></label><label>Area<input value={area} onChange={e=>{setArea(e.target.value);setSaved(false)}}/></label></div>
          {saved && <p className={styles.success} role="status">Profile saved in this preview.</p>}
        </form>
        <section className={styles.card}><h2>Private contact details</h2><div className={styles.contactField}><span>Email · Verified</span><strong>{user.email || 'tomi.adeyemi@example.com'}</strong></div><div className={styles.contactField}><span>Phone · Verified</span><strong>{user.phone || '+234 803 000 1428'}</strong></div><p className={styles.note}>Changes require a new verification code. Email and phone are not shown on your public profile.</p></section>
      </div>
      <aside className={styles.rightColumn}>
        <section className={styles.card}><h2>Role information</h2><p>✓ Personal account active</p><label className={styles.boxField}>Primary role<select value={role} onChange={e=>setRole(e.target.value)}><option>Buyer / service customer</option><option>Seller</option><option>Service provider</option><option>Driver</option><option>Job poster</option></select></label><p>Service provider · Not enabled</p><p>Seller · Not enabled</p><button type="button" className={styles.textLink} onClick={()=>setPhotoMessage('Business role applications require identity and eligibility checks.')}>Apply for a business role</button><p className={styles.explainer}>Changing a role does not grant permissions. Business identity and eligibility checks are required.</p></section>
        <section className={styles.card}><h2>Visibility</h2><label className={styles.check}><input type="checkbox" checked={showCity} onChange={e=>setShowCity(e.target.checked)}/> Show city publicly</label><label className={styles.check}><input type="checkbox" checked={showAddress} onChange={e=>setShowAddress(e.target.checked)}/> Show exact address publicly</label><label className={styles.check}><input type="checkbox" checked={allowMessages} onChange={e=>setAllowMessages(e.target.checked)}/> Allow messages about active tasks</label><button className={styles.primary} type="button" onClick={save}>Save profile</button><button className={styles.textLink} type="button" onClick={()=>onNavigate('storefront')}>Preview public profile</button></section>
        {photoMessage && <section className={styles.validation} role="status"><p>{photoMessage}</p><label className={styles.link} htmlFor="profile-photo-again">Choose another photo</label><input id="profile-photo-again" className={styles.fileInput} type="file" accept="image/jpeg,image/png" onChange={choosePhoto}/></section>}
      </aside>
    </div>
    <button className={styles.backLink} type="button" onClick={onBack}>← Back to dashboard</button>
  </main>;
}
