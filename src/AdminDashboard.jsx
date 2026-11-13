import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, RefreshCw, ShieldCheck } from 'lucide-react';
import styles from './AdminDashboard.module.css';
import { api } from './lib/api.js';

const sections = ['Operations', 'Identity verification', 'Payout approvals', 'Users & roles', 'Audit log', 'Reports', 'Commission settings'];
const modules = ['product', 'service', 'job', 'rental', 'ride', 'delivery'];
const asArray = value => Array.isArray(value) ? value : (value?.items || []);

export default function AdminDashboard({ onNavigate }) {
  const [active, setActive] = useState('Operations');
  const [data, setData] = useState({});
  const [rules, setRules] = useState([]);
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
  }, []);

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

      {!loading && active === 'Payout approvals' && listPanel('Pending withdrawal approvals', data.withdrawals, row => <><strong>{row.pid}</strong><p>Amount: {row.amount_display || row.amount_kobo} · Status: {row.status}</p><div className={styles.actions}><button className={styles.primary} disabled={Boolean(saving)} onClick={() => withdrawalAction(row.pid, 'approve')}>Approve via Flutterwave</button><button className={styles.link} disabled={Boolean(saving)} onClick={() => withdrawalAction(row.pid, 'reject')}>Reject</button></div></>)}
      {!loading && active === 'Identity verification' && <>{listPanel('KYC metadata queue', data.kyc, row => <><strong>{row.name || row.user_name || row.user_pid}</strong><p>{row.doc_type || row.document_type} · {row.status}</p><p>Document review actions are disabled here until private KYC storage and authorised short-lived document access are in place.</p></>)}<section className={styles.panel}><h2>Security restriction</h2><p>Do not approve identity documents based only on public UUID-based file URLs. KHUB must complete private object storage and audited document access before administrators can review sensitive documents safely.</p></section></>}
      {!loading && active === 'Users & roles' && listPanel('User directory', data.users)}
      {!loading && active === 'Audit log' && listPanel('Administrative audit events', data.audit)}
      {!loading && active === 'Reports' && <><section className={styles.panel}><h2>Daily platform statistics</h2>{listPanel('Stats', data.stats)}</section>{listPanel('Commission accruals', data.commissionAccruals)}{listPanel('Escrow oversight', data.escrows)}{listPanel('Wallet oversight', data.wallets)}</>}
      {!loading && active === 'Operations' && <><section className={styles.metrics}><article><strong>{asArray(data.withdrawals).length}</strong><span>Pending withdrawals</span></article><article><strong>{asArray(data.kyc).length}</strong><span>KYC records</span></article><article><strong>{asArray(data.users).length}</strong><span>Users returned</span></article><article><strong>{asArray(data.audit).length}</strong><span>Audit events returned</span></article></section>{listPanel('Latest audit events', data.audit)}</>}
    </main>
  </div>;
}
