import React, { useMemo, useState } from 'react';
import { Heart, Check, ChevronDown, Search } from 'lucide-react';
import styles from './JobListingsPage.module.css';

const jobs = [
  { id:'KH-JB-3107', title:'Product designer', company:'Cedar Digital', location:'Lagos', arrangement:'Hybrid', salaryMin:450000, salaryMax:650000, salary:'₦450,000–₦650,000 / month', type:'Full-time', level:'Mid-level · 3+ years', note:'Health cover · Portfolio required', posted:'10 Oct', closes:'25 Oct 2026', verified:true, category:'Design' },
  { id:'KH-JB-3112', title:'Operations coordinator', company:'Riverline Commerce', location:'Abuja', arrangement:'On-site', salaryMin:250000, salaryMax:350000, salary:'₦250,000–₦350,000 / month', type:'Full-time', level:'2+ years', note:'Monday–Friday · Transport allowance', posted:'10 Oct', closes:'25 Oct 2026', verified:true, category:'Operations' },
  { id:'KH-JB-3104', title:'Customer support associate', company:'Delta Connect', location:'Port Harcourt', arrangement:'On-site', salaryMin:180000, salaryMax:240000, salary:'₦180,000–₦240,000 / month', type:'Full-time', level:'Entry level', note:'Shift allowance · Paid training', posted:'10 Oct', closes:'25 Oct 2026', verified:false, category:'Operations' },
  { id:'KH-JB-3118', title:'Frontend engineer', company:'Cedar Digital', location:'Lagos', arrangement:'Remote', salaryMin:600000, salaryMax:850000, salary:'₦600,000–₦850,000 / month', type:'Contract', level:'6 months · 4+ years', note:'React / TypeScript · Equipment stipend', posted:'10 Oct', closes:'25 Oct 2026', verified:true, category:'Technology' },
];
const nigerianStates = [
  'Abia',
  'Adamawa',
  'Akwa Ibom',
  'Anambra',
  'Bauchi',
  'Bayelsa',
  'Benue',
  'Borno',
  'Cross River',
  'Delta',
  'Ebonyi',
  'Edo',
  'Ekiti',
  'Enugu',
  'Gombe',
  'Imo',
  'Jigawa',
  'Kaduna',
  'Kano',
  'Katsina',
  'Kebbi',
  'Kogi',
  'Kwara',
  'Lagos',
  'Nasarawa',
  'Niger',
  'Ogun',
  'Ondo',
  'Osun',
  'Oyo',
  'Plateau',
  'Rivers',
  'Sokoto',
  'Taraba',
  'Yobe',
  'Zamfara',
  'FCT'
];
export default function JobListingsPage({ onViewJob, onBack = () => {}, savedJobs = [], onToggleSave }) {
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('Nigeria · All cities');
  const [tab, setTab] = useState('All jobs');
  const [salary, setSalary] = useState('₦180,000 – ₦850,000');
  const [fullTime, setFullTime] = useState(true);
  const [contract, setContract] = useState(false);
  const [hybrid, setHybrid] = useState(true);
  const [remote, setRemote] = useState(true);
  const [onsite, setOnsite] = useState(true);
  const [experience, setExperience] = useState('All levels');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({});
  const [sort, setSort] = useState('Newest');
  const [alertMessage, setAlertMessage] = useState('');
  const saved = savedJobs;

  const visibleJobs = useMemo(() => {
    let result = jobs.filter(job => {
      const query = keyword.trim().toLowerCase();
      const matchesQuery = !query || `${job.title} ${job.company} ${job.category} ${job.id}`.toLowerCase().includes(query);
      const matchesTab = tab === 'All jobs' || (tab === 'Saved' ? saved.includes(job.id) : job.category === tab);
      const matchesLocation = location === 'Nigeria · All cities' || job.location === location;
      const filterSet = Object.keys(appliedFilters).length ? appliedFilters : null;
      const matchesType = !filterSet || ((job.type === 'Full-time' && filterSet.fullTime) || (job.type === 'Contract' && filterSet.contract));
      const matchesMode = !filterSet || ((job.arrangement === 'Hybrid' && filterSet.hybrid) || (job.arrangement === 'Remote' && filterSet.remote) || (job.arrangement === 'On-site' && filterSet.onsite));
      const matchesVerified = !filterSet || !filterSet.verifiedOnly || job.verified;
      const matchesSalary = !filterSet || job.salaryMax >= filterSet.minSalary && job.salaryMin <= filterSet.maxSalary;
      const matchesExperience = !filterSet || filterSet.experience === 'All levels' || (filterSet.experience === 'Entry level' ? job.level.toLowerCase().includes('entry') : filterSet.experience === 'Experienced' ? !job.level.toLowerCase().includes('entry') : true);
      return matchesQuery && matchesTab && matchesLocation && matchesType && matchesMode && matchesVerified && matchesSalary && matchesExperience;
    });
    if (sort === 'Salary: high to low') result = [...result].sort((a,b)=>b.salaryMax-a.salaryMax);
    if (sort === 'Salary: low to high') result = [...result].sort((a,b)=>a.salaryMin-b.salaryMin);
    return result;
  }, [keyword, location, tab, saved, appliedFilters, sort]);

  const applyFilters = () => {
    const parts = salary.replace(/[₦,\s]/g, '').split(/[–-]/).map(Number);
    setAppliedFilters({ fullTime, contract, hybrid, remote, onsite, verifiedOnly, experience, minSalary: parts[0] || 0, maxSalary: parts[1] || 100000000 });
    setAlertMessage('');
  };
  const createAlert = () => setAlertMessage(`Job alert created for ${keyword.trim() || 'all roles'} in ${location}. This demo keeps the alert in this session.`);
  const clearSalary = () => { setSalary('₦0 – ₦1,000,000'); setAppliedFilters(prev => ({...prev, minSalary:0, maxSalary:1000000})); setAlertMessage('Salary filter cleared.'); };

  return <main className={styles.page}>
    <div className={styles.wrap}>
      <div style={{ marginBottom: 18 }}><button type="button" onClick={onBack} aria-label="Go back to the previous page" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid #dce8df', background: '#fff', color: '#176b43', borderRadius: 999, padding: '10px 16px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(20,60,35,.06)' }}><span aria-hidden="true">←</span> Back</button></div>
      <header className={styles.header}>
        <h1>Make your next move count.</h1>
        <p>05 Jobs / Job listings</p>
        <p>Work with clear pay, location and employment terms. Never pay to apply.</p>
      </header>
      <div className={styles.searchRow}>
        <label className={styles.searchField}><span>Role or keyword</span><input value={keyword} onChange={e=>setKeyword(e.target.value)} placeholder="Design, operations, engineering..." aria-label="Role or keyword" /></label>
        <label className={styles.selectField}>
  <span>Location</span>
      <select
        value={location}
        onChange={e => setLocation(e.target.value)}
        aria-label="Location"
      >
        <option value="Nigeria · All cities">All states in Nigeria</option>
        {nigerianStates.map(state => (
          <option key={state} value={state}>
            {state === 'FCT' ? 'Federal Capital Territory (FCT)' : state}
          </option>
        ))}
      </select>
      <ChevronDown size={13}/>
    </label>
      </div>
      <nav className={styles.tabs} aria-label="Job categories">{['All jobs','Design','Technology','Operations',`Saved (${saved.length})`].map((item,i)=>{const value=i===4?'Saved':item;return <button key={item} className={tab===value?styles.activeTab:''} onClick={()=>setTab(value)}>{item}</button>})}</nav>
      <div className={styles.content}>
        <aside className={styles.filters}>
          <section className={styles.filterCard}>
            <h2>Job filters</h2>
            <label className={styles.boxField}><span>Monthly salary</span><input value={salary} onChange={e=>setSalary(e.target.value)} aria-label="Monthly salary range" /></label>
            <label className={styles.check}><input type="checkbox" checked={fullTime} onChange={e=>setFullTime(e.target.checked)}/> Full-time</label>
            <label className={styles.check}><input type="checkbox" checked={contract} onChange={e=>setContract(e.target.checked)}/> Contract</label>
            <div className={styles.checkGroup}><label className={styles.check}><input type="checkbox" checked={hybrid} onChange={e=>setHybrid(e.target.checked)}/> Hybrid</label><label className={styles.check}><input type="checkbox" checked={remote} onChange={e=>setRemote(e.target.checked)}/> Remote</label><label className={styles.check}><input type="checkbox" checked={onsite} onChange={e=>setOnsite(e.target.checked)}/> On-site</label></div>
            <label className={styles.boxField}><span>Experience</span><select value={experience} onChange={e=>setExperience(e.target.value)}><option>All levels</option><option>Entry level</option><option>Experienced</option></select></label>
            <label className={styles.check}><input type="checkbox" checked={verifiedOnly} onChange={e=>setVerifiedOnly(e.target.checked)}/> Verified employers only</label>
            <button className={styles.primary} onClick={applyFilters}>Apply filters</button>
            <button className={styles.linkButton} onClick={createAlert}>Create job alert</button>
          </section>
          <section className={styles.safety}><p>Application safety</p><p>Employers must not ask for fees or bank PINs. Report suspicious requests to KHUB.</p></section>
        </aside>
        <section className={styles.results}>
          <div className={styles.resultMeta}><span>{visibleJobs.length} curated opportunities</span><span> · </span><label>Sort by <select value={sort} onChange={e=>setSort(e.target.value)}><option>Newest</option><option>Salary: high to low</option><option>Salary: low to high</option></select></label></div>
          {visibleJobs.map(job=><article className={styles.jobCard} key={job.id}>
            <p className={styles.status}>{job.verified ? <><Check size={12}/> Employer verified</> : '◷ Verification pending'}</p>
            {job.verified && <p className={styles.advertised}>{job.id==='KH-JB-3112'?'Advertised · Employer verified':''}</p>}
            <h2>{job.title}</h2><p>{job.company} · {job.location} / {job.arrangement}</p><h3>{job.salary}</h3><p>{job.type} · {job.level}</p><p>{job.note} · Posted {job.posted} · Closes {job.closes}</p>
            <div className={styles.cardActions}><button className={styles.primary} onClick={()=>onViewJob(job)}>View job</button><button className={styles.linkButton} onClick={()=>onToggleSave?.(job.id)}><Heart size={13} fill={saved.includes(job.id)?'currentColor':'none'}/> {saved.includes(job.id)?'Saved':'Save job'}</button></div>
          </article>)}
          {visibleJobs.length===0 && <section className={styles.empty}><p>State example · No jobs match these filters</p><p>No jobs match your current search. Your criteria are saved; widen the location or create an alert.</p><button className={styles.linkButton} onClick={clearSalary}>Clear salary filter</button></section>}
          {alertMessage && <section className={styles.alert}>{alertMessage}</section>}
        </section>
      </div>
    </div>
  </main>;
}
