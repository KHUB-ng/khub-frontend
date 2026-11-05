import React, { useState } from 'react';
import styles from './JobApplicationPage.module.css';

const defaultJob = {
  title: 'Product designer', company: 'Cedar Digital', reference: 'KH-JB-3107',
  salary: '₦450,000–₦650,000 / month', location: 'Lagos', arrangement: 'Hybrid',
  type: 'Full-time', closes: '25 Oct 2026',
};

export default function JobApplicationPage({ user, job, onBack, onNavigate }) {
  const selectedJob = job || defaultJob;
  const [form, setForm] = useState({
    fullName: user?.name || 'Tomi Adeyemi',
    email: user?.email || 'tomi.adeyemi@example.com',
    phone: user?.phone || '+234 803 000 1428',
    location: 'Lekki, Lagos', portfolio: 'tomi-design.example.com',
    experience: '4 years', notice: '4 weeks',
    reason: 'I have designed merchant tools used by small businesses in Lagos. I would love to bring my research-led approach to Cedar’s inventory and payments products.',
  });
  const [fileName, setFileName] = useState('Tomi-Adeyemi-CV.pdf');
  const [fileSize, setFileSize] = useState('1.8 MB');
  const [confirmed, setConfirmed] = useState(true);
  const [consent, setConsent] = useState(true);
  const [alerts, setAlerts] = useState(false);
  const [submitted, setSubmitted] = useState(true); // The screenshot demonstrates the submitted confirmation state.
  const [draftSaved, setDraftSaved] = useState(false);
  const [error, setError] = useState('Tomi-CV.pdf (8 MB) exceeds 5 MB. Compress or replace the file. Contact details and cover note stay saved.');

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError(`${file.name} exceeds 5 MB. Compress or replace the file. Contact details and cover note stay saved.`);
      return;
    }
    setFileName(file.name);
    setFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);
    setError('');
    setSubmitted(false);
  };
  const submit = (event) => {
    event.preventDefault();
    if (!confirmed || !consent) return;
    setSubmitted(true);
    setDraftSaved(false);
    setError('');
  };
  const saveDraft = () => {
    setDraftSaved(true);
    setSubmitted(false);
    setError('Your draft is saved in this demo. Your details remain on this device and have not been sent to an employer.');
  };

  return <main className={styles.page}>
    <div style={{ marginBottom: 18 }}><button type="button" onClick={onBack} aria-label="Go back to the previous page" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid #dce8df', background: '#fff', color: '#176b43', borderRadius: 999, padding: '10px 16px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(20,60,35,.06)' }}><span aria-hidden="true">←</span> Back</button></div>
    <header className={styles.heading}>
      <h1>Put your best work forward.</h1>
      <p>05 Jobs / Job application<br />{selectedJob.title} · {selectedJob.company} · {selectedJob.reference} · Your information stays private.</p>
    </header>
    <form className={styles.layout} onSubmit={submit}>
      <div className={styles.left}>
        <section className={styles.card}>
          <h2>Your contact details</h2>
          <div className={styles.fields}>
            <label>Full name *<input required value={form.fullName} onChange={e=>update('fullName',e.target.value)} /></label>
            <label className={styles.focused}>Email *<input required type="email" value={form.email} onChange={e=>update('email',e.target.value)} /></label>
            <label>Phone *<input required value={form.phone} onChange={e=>update('phone',e.target.value)} /></label>
            <label>Current location *<input required value={form.location} onChange={e=>update('location',e.target.value)} /></label>
          </div>
        </section>
        <section className={styles.card}>
          <h2>Experience and attachments</h2>
          <div className={styles.fileBox}><span>CV / résumé *</span><span>✓ {fileName} · {fileSize} · Attached</span></div>
          <label className={styles.fileLink}>Replace CV<input type="file" accept=".pdf,.doc,.docx" onChange={handleFile} /></label>
          <p className={styles.helper}>PDF or DOCX · Maximum 5 MB · Shared only with this employer</p>
          <label className={styles.fullField}>Portfolio URL *<input required value={form.portfolio} onChange={e=>update('portfolio',e.target.value)} /></label>
          <div className={styles.fields}>
            <label>Relevant experience *<select value={form.experience} onChange={e=>update('experience',e.target.value)}><option>Less than 1 year</option><option>1 year</option><option>2 years</option><option>3 years</option><option>4 years</option><option>5 years</option><option>6+ years</option></select></label>
            <label>Notice period<select value={form.notice} onChange={e=>update('notice',e.target.value)}><option>Immediately</option><option>1 week</option><option>2 weeks</option><option>4 weeks</option><option>8 weeks</option></select></label>
          </div>
          <label className={styles.fullField}>Why this role?<textarea rows="3" value={form.reason} onChange={e=>update('reason',e.target.value)} /></label>
        </section>
        <section className={styles.card}>
          <h2>Review and consent</h2>
          <label className={styles.check}><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)} required /> I confirm my information is accurate.</label>
          <label className={styles.check}><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} required /> I consent to {selectedJob.company} using this application for this role’s recruitment. KHUB’s privacy terms apply.</label>
          <label className={styles.check}><input type="checkbox" checked={alerts} onChange={e=>setAlerts(e.target.checked)} /> Send me similar job alerts (optional).</label>
          <div className={styles.actions}><button className={styles.primary} type="submit">Submit application</button><button className={styles.textButton} type="button" onClick={saveDraft}>Save draft</button></div>
          {draftSaved && <p className={styles.draftNotice}>Draft saved · Your application has not been submitted.</p>}
        </section>
      </div>
      <aside className={styles.right}>
        <section className={styles.card}>
          <h2>You’re applying for</h2><h3>{selectedJob.title}</h3>
          <p>✓ {selectedJob.company} · Verified</p><p>{selectedJob.salary}</p><p>{selectedJob.location} · {selectedJob.arrangement} · {selectedJob.type}</p><p>Closes {selectedJob.closes} · No application fee</p>
        </section>
        {error && <section className={styles.alert}><p>State example · {error.includes('exceeds') ? 'Upload validation' : draftSaved ? 'Draft saved' : 'Application status'}</p><p>{error}</p>{error.includes('exceeds') && <label className={styles.fileLink}>Replace file<input type="file" accept=".pdf,.doc,.docx" onChange={handleFile} /></label>}</section>}
        {submitted && <section className={styles.success}>
          <h2>Contained confirmation state</h2><p>✓ Application submitted</p><h3>You’re in the running.</h3>
          <p>Application KH-AP-9012 sent to {selectedJob.company} on 11 Oct 2026, 11:20 WAT.</p>
          <p>Attached: {fileName}. Expected review within 7 business days; an update is not a job offer.</p>
          <button className={styles.linkButton} type="button" onClick={()=>onNavigate?.('orders-bookings')}>View application status</button>
          <p>This panel documents the successful submission outcome, not a second screen.</p>
        </section>}
      </aside>
    </form>
    <div className={styles.backRow}><button className={styles.textButton} type="button" onClick={onBack}>← Back to jobs</button></div>
  </main>;
}
