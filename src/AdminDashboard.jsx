import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, RefreshCw, ShieldCheck } from 'lucide-react';
import styles from './AdminDashboard.module.css';
import { api } from './lib/api.js';

const sections = ['Operations', 'Listing moderation', 'Sponsored ads', 'Disputes', 'Identity verification', 'Driver & agent review', 'Payout approvals', 'Users & roles', 'Audit log', 'Reports', 'Commission settings'];
const modules = ['product', 'service', 'job', 'rental', 'ride', 'delivery'];
const asArray = value => Array.isArray(value) ? value : (value?.items || []);

export default function AdminDashboard({ onNavigate }) {
  const [active, setActive] = useState('Operations');
  const [data, setData] = useState({});
  const [rules, setRules] = useState([]);
  const [adStatus, setAdStatus] = useState('pending');
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await api.get('/admin/heartbeat');
      const endpoints = {
        withdrawals: '/admin/withdrawals?status=requested',
        ads: `/admin/ads?status=${encodeURIComponent(adStatus)}`,
        listings: '/admin/listings',
        drivers: '/admin/drivers',
        agents: '/admin/delivery-agents',
        kyc: '/admin/kyc',
        users: '/admin/users',
        audit: '/admin/audit',
        stats: '/admin/stats',
        escrows: '/admin/escrows',
        wallets: '/admin/wallets',
        commissionRules: '/admin/commission-rules',
        commissionAccruals: '/admin/commission-accruals',
      };
      const entries = await Promise.all(Object.entries(endpoints).map(async ([key, path]) => {
        try { return [key, await api.get(path)]; }
        catch (err) { return [key, { __error: err?.message || 'Unable to load this resource.' }]; }
      }));
      const next = Object.fromEntries(entries);
      setData(next);
      const loadedRules = asArray(next.commissionRules);
      setRules(loadedRules);
      setDrafts(Object.fromEntries(loadedRules.map(rule => [rule.module, {
        rate_bps: String(rule.rate_bps ?? 0),
        fixed_fee_kobo: String(rule.fixed_fee_kobo ?? 0),
        min_fee_kobo: rule.min_fee_kobo == null ? '' : String(rule.min_fee_kobo),
        max_fee_kobo: rule.max_fee_kobo == null ? '' : String(rule.max_fee_kobo),
        enabled: Boolean(rule.enabled),
      }])));
    } catch (err) {
      setError(err?.message || 'Administrator access could not be verified.');
    } finally {
      setLoading(false);
    }
  }, [adStatus]);

  useEffect(() => { load(); }, [load]);

  const saveRule = async module => {
    const draft = drafts[module];
    if (!draft) return;
    setSaving(module);
    setError('');
    setNotice('');
    try {
      const payload = {
        rate_bps: Number(draft.rate_bps),
        fixed_fee_kobo: Number(draft.fixed_fee_kobo),
        min_fee_kobo: draft.min_fee_kobo === '' ? null : Number(draft.min_fee_kobo),
        max_fee_kobo: draft.max_fee_kobo === '' ? null : Number(draft.max_fee_kobo),
        enabled: draft.enabled,
      };
      await api.put(`/admin/commission-rules/${module}`, payload);
      setNotice(`Commission rule for ${module} saved and audit-logged.`);
      await load();
    } catch (err) {
      setError(err?.message || 'Commission rule could not be saved.');
    } finally {
      setSaving('');
    }
  };

  const withdrawalAction = async (pid, decision) => {
    setSaving(pid);
    setError('');
    try {
      await api.post(`/admin/withdrawals/${pid}/${decision}`, decision === 'reject' ? { note: 'Rejected by administrator after review.' } : {});
      setNotice(`Withdrawal ${decision} action completed.`);
      await load();
    } catch (err) { setError(err?.message || 'Withdrawal action failed.'); }
    finally { setSaving(''); }
  };



  const performAction = async (path, method = 'post', body = {}, success = 'Administrator action completed.') => {
    setSaving(path); setError(''); setNotice('');
    try {
      if (method === 'delete') await api.delete(path);
      else await api.post(path, body);
      setNotice(success);
      await load();
    } catch (err) { setError(err?.message || 'The administrator action failed.'); }
    finally { setSaving(''); }
  };

  const listPanel = (title, value, renderRow) => {
    const rows = asArray(value);
    if (value?.__error) return <section className={styles.panel}><h2>{title}</h2><p role="alert">{value.__error}</p></section>;
    return <section className={styles.panel}><h2>{title}</h2>{rows.length === 0 ? <p>No records returned by the backend.</p> : rows.map((row, index) => <div className={styles.queueItem} key={row.pid || row.id || index}>{renderRow ? renderRow(row) : <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{JSON.stringify(row, null, 2)}</pre>}</div>)}</section>;
  };

  return <div className={styles.shell}>
    <aside className={styles.sidebar} aria-label="Admin navigation">
      {sections.map(section => <button key={section} className={active === section ? styles.activeSide : ''} onClick={() => { setActive(section); setNotice(''); }}><span>{active === section ? '◉' : ''}</span>{section}</button>)}
    </aside>
    <main className={styles.main}>
      <h1>Trust &amp; platform operations.</h1>
      <p className={styles.kicker}>Protected administrator workspace</p>
      <p className={styles.subhead}>Data and actions below are retrieved from the KHUB API. Backend permissions and audit logging remain authoritative.</p>
      <div className={styles.actions}><button className={styles.primary} onClick={load} disabled={loading}><RefreshCw size={15}/> Refresh live data</button><button className={styles.link} onClick={() => onNavigate?.('home')}>Return to KHUB</button></div>
      {loading && <div className={styles.notice}>Loading protected administrator data…</div>}
      {error && <div className={styles.notice} role="alert">{error}</div>}
      {notice && <div className={styles.notice} role="status"><CheckCircle2 size={16}/> {notice}</div>}

      {!loading && active === 'Commission settings' && <section className={styles.panel}>
        <h2>Configurable platform commissions</h2>
        <p>Changes require the configured superadmin identity. Rates use basis points (100 bps = 1%). All amounts are integer kobo. Existing orders retain their original quote.</p>
        {rules.length === 0 && <p>No commission rules exist yet. Saving a module creates its rule; new rules are disabled by default.</p>}
        {modules.map(module => {
          const draft = drafts[module] || { rate_bps: '0', fixed_fee_kobo: '0', min_fee_kobo: '', max_fee_kobo: '', enabled: false };
          return <div className={styles.compactItem} key={module}>
            <h3>{module.charAt(0).toUpperCase() + module.slice(1)}</h3>
            <label>Rate (basis points)<input type="number" min="0" max="10000" value={draft.rate_bps} onChange={e => setDrafts(old => ({ ...old, [module]: { ...draft, rate_bps: e.target.value } }))}/></label>
            <label>Fixed fee (kobo)<input type="number" min="0" value={draft.fixed_fee_kobo} onChange={e => setDrafts(old => ({ ...old, [module]: { ...draft, fixed_fee_kobo: e.target.value } }))}/></label>
            <label>Minimum fee (kobo)<input type="number" min="0" value={draft.min_fee_kobo} onChange={e => setDrafts(old => ({ ...old, [module]: { ...draft, min_fee_kobo: e.target.value } }))}/></label>
            <label>Maximum fee (kobo)<input type="number" min="0" value={draft.max_fee_kobo} onChange={e => setDrafts(old => ({ ...old, [module]: { ...draft, max_fee_kobo: e.target.value } }))}/></label>
            <label><input type="checkbox" checked={draft.enabled} onChange={e => setDrafts(old => ({ ...old, [module]: { ...draft, enabled: e.target.checked } }))}/> Enable this commission rule</label>
            <button className={styles.primary} disabled={saving === module} onClick={() => saveRule(module)}>{saving === module ? 'Saving…' : 'Save commission rule'}</button>
          </div>;
        })}
      </section>}

      {!loading && active === 'Disputes' && listPanel('Open escrow disputes', {items:asArray(data.escrows).filter(row=>row.status==='dispute_open')}, row => { const ref= row.ref_pid; const table=row.ref_table; const route=table==='orders'?'/admin/orders/'+ref+'/resolve':table==='rides'?'/admin/rides/'+ref+'/resolve':table==='deliveries'?'/admin/deliveries/'+ref+'/resolve':null; const key=table==='orders'?'for_seller':table==='rides'?'for_driver':'for_agent'; const winner=table==='orders'?'seller':table==='rides'?'driver':'delivery agent'; const loser=table==='orders'?'buyer':table==='rides'?'passenger':'requester'; return <><strong>{table} dispute · {row.pid}</strong><p>Amount · {row.amount_display} · Buyer/requester · {row.buyer_pid} · Seller/driver/agent · {row.seller_pid}</p><p>Reference · {ref}</p>{route?<div className={styles.actions}><button className={styles.primary} disabled={Boolean(saving)} onClick={()=>performAction(route,'post',{[key]:true},'Dispute resolved in favour of the '+winner+'.')}>Resolve for {winner}</button><button className={styles.link} disabled={Boolean(saving)} onClick={()=>performAction(route,'post',{[key]:false},'Dispute resolved in favour of the '+loser+'.')}>Refund {loser}</button></div>:<p>Unsupported dispute reference type. Escalate to engineering.</p>}</>; })}
      {!loading && active === 'Sponsored ads' && <><section className={styles.panel}><label>Campaign status <select value={adStatus} onChange={event=>setAdStatus(event.target.value)}><option value="pending">Awaiting review</option><option value="approved">Approved / live</option><option value="rejected">Rejected</option><option value="paused">Paused</option></select></label><p>Only approved campaigns attached to active listings are eligible for public placement. Budget values are proposals; this workflow does not charge advertisers.</p></section>{listPanel(`Sponsored placement requests · ${adStatus}`, data.ads, row => <><strong>{row.listing?.title || row.ad_pid}</strong><p>Placement · {row.placement} · Budget submitted · ₦{(Number(row.budget_kobo||0)/100).toLocaleString('en-NG')} · Status · {row.status}</p><p>Listing reference · {row.listing?.pid || 'Source listing unavailable'}</p><div className={styles.actions}>{row.status==='pending'&&<><button className={styles.primary} disabled={Boolean(saving)||!row.listing} onClick={()=>performAction('/admin/ads/'+row.ad_pid+'/approve','post',{},'Sponsored placement approved and now eligible for public display.')}>Approve ad</button><button className={styles.link} disabled={Boolean(saving)} onClick={()=>performAction('/admin/ads/'+row.ad_pid+'/reject','post',{},'Sponsored placement rejected.')}>Reject</button></>}{row.status==='approved'&&<button className={styles.link} disabled={Boolean(saving)} onClick={()=>performAction('/admin/ads/'+row.ad_pid+'/pause','post',{},'Sponsored placement paused.')}>Pause campaign</button>}{row.status==='paused'&&<button className={styles.primary} disabled={Boolean(saving)} onClick={()=>performAction('/admin/ads/'+row.ad_pid+'/resume','post',{},'Sponsored placement resumed.')}>Resume campaign</button>}<button className={styles.link} disabled={Boolean(saving)} onClick={()=>performAction('/admin/ads/'+row.ad_pid,'delete',{},'Sponsored placement deleted.')}>Delete</button></div></>)}</>}
      {!loading && active === 'Listing moderation' && listPanel('All marketplace listings', data.listings, row => <><strong>{row.title}</strong><p>{row.vertical} · {row.category} · {row.status} · {row.location || 'Location not set'}</p><p>Listing ID · {row.pid} · Owner · {row.owner_pid || 'Unknown'}</p>{row.removed_reason&&<p>Removal reason · {row.removed_reason}</p>}<div className={styles.actions}>{row.status==='removed'?<button className={styles.primary} disabled={Boolean(saving)} onClick={()=>performAction('/admin/listings/'+row.pid+'/reactivate','post',{},'Listing reactivated.')}>Reactivate listing</button>:<button className={styles.link} disabled={Boolean(saving)} onClick={()=>performAction('/admin/listings/'+row.pid+'/remove','post',{reason:'Removed after administrator moderation review.'},'Listing removed from public marketplace.')}>Remove listing</button>}</div></>)}
      {!loading && active === 'Driver & agent review' && <>{listPanel('Driver verification queue',data.drivers,row=><><strong>{row.name||row.pid||row.user_pid}</strong><p>{row.vehicle_type||'Vehicle'} · {row.vehicle_number||''} · {row.status}</p><div className={styles.actions}><button className={styles.primary} disabled={Boolean(saving)} onClick={()=>performAction('/admin/drivers/'+row.pid+'/verify','post',{},'Driver approved.')}>Approve</button><button className={styles.link} disabled={Boolean(saving)} onClick={()=>performAction('/admin/drivers/'+row.pid+'/reject','post',{},'Driver rejected.')}>Reject</button><button className={styles.link} disabled={Boolean(saving)} onClick={()=>performAction('/admin/drivers/'+row.pid+'/suspend','post',{},'Driver suspended.')}>Suspend</button></div></>)}{listPanel('Delivery-agent verification queue',data.agents,row=><><strong>{row.name||row.pid||row.user_pid}</strong><p>{row.vehicle_type||'Vehicle'} · {row.vehicle_number||''} · {row.status}</p><div className={styles.actions}><button className={styles.primary} disabled={Boolean(saving)} onClick={()=>performAction('/admin/delivery-agents/'+row.pid+'/verify','post',{},'Delivery agent approved.')}>Approve</button><button className={styles.link} disabled={Boolean(saving)} onClick={()=>performAction('/admin/delivery-agents/'+row.pid+'/reject','post',{},'Delivery agent rejected.')}>Reject</button><button className={styles.link} disabled={Boolean(saving)} onClick={()=>performAction('/admin/delivery-agents/'+row.pid+'/suspend','post',{},'Delivery agent suspended.')}>Suspend</button></div></>)}</>}
      {!loading && active === 'Payout approvals' && listPanel('Pending withdrawal approvals', data.withdrawals, row => <><strong>{row.pid}</strong><p>Amount: {row.amount_display || row.amount_kobo} · Status: {row.status}</p><div className={styles.actions}><button className={styles.primary} disabled={Boolean(saving)} onClick={() => withdrawalAction(row.pid, 'approve')}>Approve via Flutterwave</button><button className={styles.link} disabled={Boolean(saving)} onClick={() => withdrawalAction(row.pid, 'reject')}>Reject</button></div></>)}
      {!loading && active === 'Identity verification' && listPanel('KYC review queue', data.kyc, row => <><strong>{row.user_name || row.name || row.user_pid}</strong><p>{row.user_email || ''} · {row.doc_type} · {row.status}</p>{row.document_url ? <p><a href={row.document_url} target="_blank" rel="noreferrer">Open protected document preview</a> <small>Signed link expires after five minutes.</small></p> : <p>Protected preview unavailable. Confirm the private KYC bucket is configured and the legacy migration is complete.</p>}<div className={styles.actions}><button className={styles.primary} disabled={Boolean(saving)||!row.document_url} onClick={()=>performAction('/admin/kyc/'+encodeURIComponent(row.user_pid)+'/'+encodeURIComponent(row.doc_type)+'/approve','post',{},'KYC document approved.')}>Approve document</button><button className={styles.link} disabled={Boolean(saving)} onClick={()=>performAction('/admin/kyc/'+encodeURIComponent(row.user_pid)+'/'+encodeURIComponent(row.doc_type)+'/reject','post',{note:'Rejected after administrator review.'},'KYC document rejected.')}>Reject</button></div></>)}
      {!loading && active === 'Users & roles' && listPanel('User directory', data.users, row => <><strong>{row.name} · {row.email}</strong><p>Role · {row.role} · Email verified · {String(row.email_verified)} · {row.blocked_at?'Blocked':'Active'}</p><label>Change role <select defaultValue={row.role} onChange={e=>performAction('/admin/users/'+row.pid+'/role','post',{role:e.target.value},'User role updated.')}><option value="buyer">Buyer</option><option value="seller">Seller</option><option value="service_provider">Service provider</option><option value="jobposter">Job poster</option><option value="driver">Driver</option><option value="logistics_agent">Logistics agent</option><option value="admin">Admin</option></select></label><div className={styles.actions}>{row.blocked_at?<button className={styles.primary} disabled={Boolean(saving)} onClick={()=>performAction('/admin/users/'+row.pid+'/unblock','post',{},'User account unblocked.')}>Unblock account</button>:<button className={styles.link} disabled={Boolean(saving)} onClick={()=>performAction('/admin/users/'+row.pid+'/block','post',{},'User account blocked.')}>Block account</button>}</div></>)}
      {!loading && active === 'Audit log' && listPanel('Administrative audit events', data.audit)}
      {!loading && active === 'Reports' && <><section className={styles.panel}><h2>Daily platform statistics</h2>{listPanel('Stats', data.stats)}</section>{listPanel('Commission accruals', data.commissionAccruals)}{listPanel('Escrow oversight', data.escrows)}{listPanel('Wallet oversight', data.wallets)}</>}
      {!loading && active === 'Operations' && <><section className={styles.metrics}><article><strong>{asArray(data.withdrawals).length}</strong><span>Pending withdrawals</span></article><article><strong>{asArray(data.kyc).length}</strong><span>KYC records</span></article><article><strong>{asArray(data.users).length}</strong><span>Users returned</span></article><article><strong>{asArray(data.ads).length}</strong><span>Pending ad requests</span></article><article><strong>{asArray(data.audit).length}</strong><span>Audit events returned</span></article></section>{listPanel('Latest audit events', data.audit)}</>}
    </main>
  </div>;
}
