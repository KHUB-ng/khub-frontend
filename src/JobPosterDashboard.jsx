import React, { useCallback, useEffect, useState } from 'react';
import styles from './JobPosterDashboard.module.css';
import { api } from './lib/api.js';
import AdRequestPanel from './AdRequestPanel.jsx';

const rows=value=>Array.isArray(value)?value:(value?.items||[]);
const stages=['New','Review','Shortlisted','Hired','Rejected'];

export default function JobPosterDashboard({user={},onNavigate=()=>{}}) {
  const [active,setActive]=useState('Overview');
  const [tab,setTab]=useState('New');
  const [jobs,setJobs]=useState([]);
  const [applications,setApplications]=useState([]);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState('');
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');

  const load=useCallback(async()=>{
    setLoading(true);setError('');
    try{
      const listings=rows(await api.get('/my/listings')).filter(item=>item.vertical==='job');
      const appResults=await Promise.all(listings.map(async job=>{
        try{return rows(await api.get('/listings/'+encodeURIComponent(job.pid)+'/applications/list')).map(app=>({...app,listing_title:job.title,job_pid:job.pid}));}
        catch{return [];}
      }));
      setJobs(listings);
      setApplications(appResults.flat());
    }catch(err){setError(err?.message||'Employer job data could not be loaded.');}
    finally{setLoading(false);}
  },[]);
  useEffect(()=>{load();},[load]);

  const updateStatus=async(application,status)=>{
    setBusy(application.pid);setError('');setNotice('');
    try{
      await api.post('/applications/'+encodeURIComponent(application.pid)+'/status',{status});
      setNotice('Application status updated and candidate notified by KHUB.');
      await load();
    }catch(err){setError(err?.message||'Application status could not be updated.');}
    finally{setBusy('');}
  };
  const selectNav=item=>{
    setActive(item);setNotice('');
    if(item==='Promotions')setNotice('Request sponsored placement review for one of your live job listings below.');
    else if(item==='Messages')onNavigate('messages');
    else if(item==='Support')onNavigate('support');
    else if(item==='Settings'||item==='Company profile')onNavigate('settings');
    else if(item==='Jobs')setNotice('Your job listings are shown below.');
    else if(item==='Applicants')setTab('New');
    else if(['Interviews','Talent shortlist','Team access','Billing'].includes(item))setNotice(item+' is not yet available as a dedicated backend workflow.');
  };
  const counts={
    New:applications.filter(a=>['applied'].includes(String(a.status).toLowerCase())).length,
    Review:applications.filter(a=>['viewed','in_review'].includes(String(a.status).toLowerCase())).length,
    Shortlisted:applications.filter(a=>String(a.status).toLowerCase()==='shortlisted').length,
    Hired:applications.filter(a=>String(a.status).toLowerCase()==='hired').length,
    Rejected:applications.filter(a=>String(a.status).toLowerCase()==='rejected').length,
  };
  const visible=applications.filter(a=>{
    const s=String(a.status||'').toLowerCase();
    return tab==='New'?['applied'].includes(s):tab==='Review'?['viewed','in_review'].includes(s):s===tab.toLowerCase();
  });

  return <div className={styles.shell}>
    <aside className={styles.sidebar} aria-label="Job poster navigation">{['Overview','Jobs','Applicants','Interviews','Talent shortlist','Promotions','Company profile','Team access','Billing','Messages','Support','Settings'].map(item=><button key={item} className={active===item?styles.activeNav:styles.navItem} onClick={()=>selectNav(item)}><span>{active===item?'◉':''}</span>{item}</button>)}</aside>
    <main className={styles.main}>
      <header className={styles.heading}><h1>{active==='Overview'?'Find the people who move you forward.':active}</h1><p>08 Role workspaces / Job-poster dashboard<br/>{user?.company||user?.name||'Employer account'} · Live recruitment workspace</p></header>
      {loading&&<p>Loading job listings and applications…</p>}{error&&<p className={styles.notice} role="alert">{error}</p>}{notice&&<p className={styles.notice} role="status">{notice}</p>}
      <section className={styles.stats} aria-label="Recruitment summary">
        <article className={styles.stat}><strong>{jobs.filter(job=>['active','live','published'].includes(String(job.status).toLowerCase())).length}</strong><span>Live roles</span><small>Published job listings</small></article>
        <article className={styles.stat}><strong>{applications.length}</strong><span>Applicants</span><small>Applications received</small></article>
        <article className={styles.stat}><strong>{counts.Shortlisted}</strong><span>Shortlisted</span><small>Backend status</small></article>
        <article className={styles.stat}><strong>{counts.New}</strong><span>New applications</span><small>Awaiting first review</small></article>
      </section>
      <section className={styles.columns}>
        <div className={styles.left}>
          <section className={styles.card}><h2>Your job listings</h2>
            {jobs.map(job=><div className={styles.job} key={job.pid}><p>{job.title} · {job.pid}</p><p>{job.location} · {job.status} · {applications.filter(a=>a.job_pid===job.pid).length} applications</p><button className={styles.inlineLink} onClick={()=>onNavigate('orders-bookings')}>View account activity</button></div>)}
            {!loading&&jobs.length===0&&<p>You have not published a job listing yet.</p>}
            <button className={styles.primary} onClick={()=>onNavigate('seller-listing')}>Create a job listing</button>
          </section>
          <section className={styles.card}><h2>Applicant pipeline</h2><div className={styles.tabs}>{stages.map(stage=><button key={stage} className={tab===stage?styles.activeTab:styles.tab} onClick={()=>{setTab(stage);setActive('Applicants');}}>{stage} ({counts[stage]})</button>)}</div>
            {visible.map(app=><div className={styles.person} key={app.pid}><strong>{app.applicant_name||app.applicant_pid||'KHUB applicant'}</strong><p>{app.listing_title} · {app.status} · {app.created_at?new Date(app.created_at).toLocaleDateString('en-NG'):''}</p>{app.cv_url&&<a href={app.cv_url} target="_blank" rel="noreferrer">View CV</a>}<div className={styles.actions}><button className={styles.inlineLink} disabled={busy===app.pid} onClick={()=>updateStatus(app,'viewed')}>Mark viewed</button><button className={styles.inlineLink} disabled={busy===app.pid} onClick={()=>updateStatus(app,'shortlisted')}>Shortlist</button><button className={styles.inlineLink} disabled={busy===app.pid} onClick={()=>updateStatus(app,'hired')}>Mark hired</button><button className={styles.inlineLink} disabled={busy===app.pid} onClick={()=>updateStatus(app,'rejected')}>Reject</button></div></div>)}
            {!loading&&visible.length===0&&<p>No applications in this stage.</p>}
          </section>
        </div>
        <aside className={styles.right}>
          <section className={styles.card}><h2>Recruitment workflow</h2><p>Review applicant records, update status through the backend workflow and keep candidate communication within KHUB.</p><p>CV access is limited to the job owner and authorised roles.</p><button className={styles.inlineLink} onClick={()=>onNavigate('messages')}>Open messages</button></section>
          <section className={styles.card}><h2>Employer profile</h2><p>{user?.company||user?.name||'Employer account'}</p><p>Update business identity and contact information in your account settings.</p><button className={styles.inlineLink} onClick={()=>onNavigate('settings')}>Open settings</button></section>
        </aside>
      </section>
      {active==='Promotions'&&<AdRequestPanel verticals={['job']} placements={['jobs','home']}/>}
      <button className={styles.inlineLink} onClick={load}>Refresh job listings and applicants</button>
    </main>
  </div>;
}
