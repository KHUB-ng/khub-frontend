import React, { useEffect, useState } from 'react';
import { Heart, ArrowLeft, ArrowUpRight } from 'lucide-react';
import styles from './JobDetailPage.module.css';
import { listingsApi } from './lib/listings.js';

const mapJob = row => {
  const attrs = row.attributes || {};
  const min = attrs.salary_min_kobo != null ? Number(attrs.salary_min_kobo)/100 : Number(attrs.salary_min || 0);
  const max = attrs.salary_max_kobo != null ? Number(attrs.salary_max_kobo)/100 : Number(attrs.salary_max || 0);
  return { id:row.pid, pid:row.pid, title:row.title, company:attrs.company_name||attrs.company||'Employer on KHUB', location:row.location||'Location not specified', arrangement:attrs.work_mode||attrs.arrangement||'Not specified', salary:attrs.salary_display||(min||max?'₦'+min.toLocaleString('en-NG')+'–₦'+max.toLocaleString('en-NG'):'Salary not specified'), type:attrs.employment_type||attrs.type||'Not specified', level:attrs.experience_level||attrs.experience||'Not specified', closes:attrs.application_deadline||'Not specified', posted:row.created_at||'', category:row.category||'Other', description:row.description||'', };
};

export default function JobDetailPage({ job, onApply, onBack, onOpenJob }) {
  const [saved, setSaved] = useState(false);
  const [related, setRelated] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  useEffect(() => {
    if (!job?.pid) return undefined;
    let active = true; setRelatedLoading(true);
    listingsApi.browse({ vertical:'job', category:job.category, page:1, page_size:12 })
      .then(payload => { if(active){ const rows=Array.isArray(payload)?payload:(payload?.items||[]); setRelated(rows.map(mapJob).filter(row=>row.pid!==job.pid).slice(0,6)); } })
      .catch(()=>{ if(active)setRelated([]); })
      .finally(()=>{ if(active)setRelatedLoading(false); });
    return()=>{active=false;};
  },[job?.pid,job?.category]);
  if (!job) return <main className={styles.page}><div className={styles.wrap}><button className={styles.back} onClick={onBack}><ArrowLeft size={15}/> Back to jobs</button><p>Select a job listing to view its details.</p></div></main>;
  return <main className={styles.page}>
    <div className={styles.wrap}>
      <button className={styles.back} onClick={onBack}><ArrowLeft size={15}/> Back to jobs</button>
      <header className={styles.header}><h1>{job.title}</h1><p>05 Jobs / Job detail</p><p>{job.company} · {job.location} · {job.category||'Job opportunity'}</p></header>
      <div className={styles.layout}>
        <div className={styles.mainCol}>
          <section className={styles.card}><h2>Role overview</h2><h3 className={styles.salary}>{job.salary||'Salary not specified'}</h3><p>{job.type||'Employment type not specified'} · {job.arrangement||'Work arrangement not specified'} · {job.level||'Experience level not specified'}</p><p>Posted {job.posted?new Date(job.posted).toLocaleDateString('en-NG'):'date not supplied'} · Application deadline {job.closes||'not supplied'}</p><p>{job.description||'The employer has not supplied a full role description. Contact the employer through KHUB for further details before applying.'}</p></section>
          <section className={styles.card}><h2>Listing information</h2><p><strong>Employer:</strong> {job.company}</p><p><strong>Category:</strong> {job.category||'Not specified'}</p><p><strong>Location:</strong> {job.location||'Not specified'}</p><p><strong>Work arrangement:</strong> {job.arrangement||'Not specified'}</p><p><strong>Employment type:</strong> {job.type||'Not specified'}</p><p><strong>Experience:</strong> {job.level||'Not specified'}</p><p><strong>Reference:</strong> {job.reference||job.pid||job.id}</p></section>
          <section className={styles.safetyCard}><h3>Application safety</h3><p>Never pay an unofficial recruitment fee or share passwords, OTPs or bank PINs. Report suspicious requests to KHUB support.</p><a className={styles.textButton} href={`mailto:support@khub.com.ng?subject=${encodeURIComponent('Report job listing '+(job.pid||job.id))}`}>Report this job to KHUB</a></section>
        </div>
        <aside className={styles.sideCol}>
          <section className={`${styles.card} ${styles.applyCard}`}><h2>Interested in this role?</h2><button className={styles.primary} onClick={onApply}>Apply for this job</button><button className={styles.textButton} onClick={()=>setSaved(v=>!v)}><Heart size={14} fill={saved?'currentColor':'none'}/> {saved?'Saved job':'Save job'}</button>{saved&&<p className={styles.feedback}>Saved in this browsing session.</p>}<p>Review the role details and application requirements before submitting.</p></section>
          <section className={styles.card}><h2>About the employer</h2><p>{job.company}</p><p>Employer information and verification details should be reviewed on the listing and through KHUB before accepting an offer.</p></section>
        </aside>
      </div>
      <section className={styles.card} style={{marginTop:32}}><h2>Related opportunities</h2><p>Other current listings in {job.category||'the jobs marketplace'}.</p>{relatedLoading&&<p>Loading related jobs…</p>}<div className={styles.relatedGrid}>{related.map(item=><button type="button" className={styles.relatedCard} key={item.pid} onClick={()=>onOpenJob?.(item)}><strong>{item.title}</strong><span>{item.company} · {item.location}</span><span>{item.salary}</span><span>View details <ArrowUpRight size={13}/></span></button>)}</div>{!relatedLoading&&related.length===0&&<p>No related live listings are available at the moment.</p>}</section>
    </div>
  </main>;
}
