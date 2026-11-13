import React, { useState } from 'react';
import styles from './JobApplicationPage.module.css';
import { api } from './lib/api.js';

export default function JobApplicationPage({ user, job, onBack=()=>{}, onNavigate=()=>{} }) {
  const [cv,setCv]=useState(null);
  const [coverNote,setCoverNote]=useState('');
  const [consent,setConsent]=useState(false);
  const [submitting,setSubmitting]=useState(false);
  const [application,setApplication]=useState(null);
  const [error,setError]=useState('');
  const selectedJob=job||null;

  const handleFile=event=>{
    const file=event.target.files?.[0];
    if(!file){setCv(null);return;}
    if(file.size>5*1024*1024){setError('CV must be 5 MB or smaller.');setCv(null);return;}
    const allowed=['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if(!allowed.includes(file.type)){setError('Upload a PDF, DOC or DOCX CV.');setCv(null);return;}
    setError('');setCv(file);
  };
  const submit=async event=>{
    event.preventDefault();
    if(!selectedJob?.pid){setError('The job listing reference is missing. Return to the live job listing and open it again.');return;}
    if(!consent){setError('Consent is required before submitting your application.');return;}
    setSubmitting(true);setError('');
    try{
      const data=new FormData();
      if(cv)data.append('cv',cv);
      data.append('cover_note',coverNote.trim());
      const result=await api.upload('/listings/'+encodeURIComponent(selectedJob.pid)+'/applications',data);
      setApplication(result);
    }catch(err){setError(err?.message||'Your application could not be submitted.');}
    finally{setSubmitting(false);}
  };

  if(application)return <main className={styles.page}><header className={styles.heading}><h1>Application submitted.</h1><p>Your application has been recorded by KHUB.</p></header><section className={styles.card}><h2>{selectedJob?.title}</h2><p>{selectedJob?.company}</p><p>Application reference · {application.pid||application.reference||'Recorded'}</p><p>Status · {application.status||'submitted'}</p><button className={styles.primary} onClick={()=>onNavigate('job-application')}>View application area</button><button className={styles.textButton} onClick={()=>onNavigate('orders-bookings')}>Back to activity</button></section></main>;

  return <main className={styles.page}>
    <div style={{marginBottom:18}}><button type="button" onClick={onBack} aria-label="Go back" style={{display:'inline-flex',alignItems:'center',gap:8,border:'1px solid #dce8df',background:'#fff',color:'#176b43',borderRadius:999,padding:'10px 16px',fontWeight:700,cursor:'pointer'}}>← Back</button></div>
    <header className={styles.heading}><h1>Put your best work forward.</h1><p>05 Jobs / Job application<br/>{selectedJob?.title||'Select a live job'} · {selectedJob?.company||''}</p></header>
    {!selectedJob&&<div className={styles.error} role="alert">Open a job from the live job listings before applying.</div>}
    <form className={styles.layout} onSubmit={submit}>
      <div className={styles.left}>
        <section className={styles.card}><h2>Your account</h2><p>{user?.name||'KHUB member'} · {user?.email||'Account email unavailable'}</p><p>Applications are linked to your authenticated KHUB account. Update your profile if these details need correction.</p><button type="button" className={styles.textButton} onClick={()=>onNavigate('settings')}>Update profile</button></section>
        <section className={styles.card}><h2>CV / résumé</h2><label className={styles.fileLink}>Choose CV<input type="file" accept=".pdf,.doc,.docx" onChange={handleFile}/></label><p className={styles.helper}>{cv?cv.name:'PDF, DOC or DOCX · Maximum 5 MB · Optional'}</p><label className={styles.fullField}>Cover note (optional)<textarea rows="6" value={coverNote} onChange={e=>setCoverNote(e.target.value)} placeholder="Tell the employer why this role interests you and how your experience is relevant."/></label></section>
        <section className={styles.card}><h2>Consent</h2><label className={styles.check}><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/> I consent to the employer reviewing this application for the selected role under KHUB's privacy terms.</label><button className={styles.primary} type="submit" disabled={submitting||!selectedJob}>{submitting?'Submitting application…':'Submit application'}</button>{error&&<p className={styles.error} role="alert">{error}</p>}</section>
      </div>
      <aside className={styles.right}><section className={styles.card}><h2>You're applying for</h2><h3>{selectedJob?.title||'No job selected'}</h3><p>{selectedJob?.company||''}</p><p>{selectedJob?.location||''} · {selectedJob?.arrangement||''}</p><p>{selectedJob?.salary||'Salary not specified'}</p><p>KHUB sends the application to the job owner and records the status in your account.</p></section></aside>
    </form>
  </main>;
}
