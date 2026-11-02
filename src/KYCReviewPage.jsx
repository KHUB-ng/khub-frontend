
import React, { useMemo, useState } from 'react';
import styles from './KYCReviewPage.module.css';

const demoCases = [
  {
    id: 'KH-KYC-1042',
    name: 'Adaeze Okafor',
    email: 'adaeze.okafor@example.com',
    role: 'Business seller',
    submitted: '02 Nov 2026, 09:42 WAT',
    status: 'In review',
    identityStatus: 'Passed',
    businessStatus: 'Pending review',
    businessName: 'Ada Studio Limited',
    cacNumber: 'RC•••••482',
    documents: [
      {
        id: 'doc-1',
        name: 'Identity verification result',
        type: 'Identity result',
        format: 'Provider result'
      },
      {
        id: 'doc-2',
        name: 'CAC certificate.pdf',
        type: 'CAC certificate',
        format: 'PDF'
      }
    ],
    checklist: [
      ['identity', 'Identity result reviewed', 'Check authorized provider result and name match.'],
      ['consent', 'Consent and purpose recorded', 'Confirm consent record and privacy notice.'],
      ['cac', 'CAC details match the document', 'Check business name and number against an authoritative source.'],
      ['authority', 'Applicant is authorized to represent the business', 'Verify owner, director, or representative where applicable.'],
      ['quality', 'Documents are legible and complete', 'Check integrity and required pages.']
    ],
    audit: [
      {
        time: '02 Nov 2026 · 09:42 WAT',
        actor: 'System',
        action: 'Submission received',
        note: 'Case created; review not yet completed.'
      },
      {
        time: '02 Nov 2026 · 09:43 WAT',
        actor: 'Verification service',
        action: 'Identity check returned',
        note: 'Provider result: passed. No raw NIN displayed.'
      }
    ]
  },
  {
    id: 'KH-KYC-1038',
    name: 'Chidi Nwosu',
    email: 'chidi.nwosu@example.com',
    role: 'Rental owner',
    submitted: '01 Nov 2026, 16:18 WAT',
    status: 'Action required',
    identityStatus: 'Passed',
    businessStatus: 'Not required',
    businessName: '',
    cacNumber: '',
    documents: [
      {
        id: 'doc-3',
        name: 'Identity verification result',
        type: 'Identity result',
        format: 'Provider result'
      }
    ],
    checklist: [
      ['identity', 'Identity result reviewed', 'Check authorized provider result and name match.'],
      ['consent', 'Consent and purpose recorded', 'Confirm consent record and privacy notice.'],
      ['details', 'Required supporting details are complete', 'Review missing onboarding information.']
    ],
    audit: [
      {
        time: '01 Nov 2026 · 16:18 WAT',
        actor: 'System',
        action: 'Submission received',
        note: 'Individual rental-owner flow.'
      },
      {
        time: '01 Nov 2026 · 17:02 WAT',
        actor: 'Reviewer A•••',
        action: 'More information requested',
        note: 'Requested clarification on property-owner relationship.'
      }
    ]
  },
  {
    id: 'KH-KYC-1031',
    name: 'Mariam Bello',
    email: 'mariam.bello@example.com',
    role: 'Service provider',
    submitted: '31 Oct 2026, 11:06 WAT',
    status: 'Submitted',
    identityStatus: 'Pending',
    businessStatus: 'Not required',
    businessName: '',
    cacNumber: '',
    documents: [
      {
        id: 'doc-4',
        name: 'Identity verification result',
        type: 'Identity result',
        format: 'Provider result'
      }
    ],
    checklist: [
      ['identity', 'Identity result reviewed', 'Check authorized provider result and name match.'],
      ['consent', 'Consent and purpose recorded', 'Confirm consent record and privacy notice.'],
      ['details', 'Required supporting details are complete', 'Review required onboarding information.']
    ],
    audit: [
      {
        time: '31 Oct 2026 · 11:06 WAT',
        actor: 'System',
        action: 'Submission received',
        note: 'Identity provider check is still pending.'
      }
    ]
  }
].map((item) => ({
  ...item,
  checklist: item.checklist.map(([id, label, detail]) => ({
    id,
    label,
    detail,
    checked: false
  }))
}));

const statusClass = (status) =>
  ['Approved', 'Passed'].includes(status)
    ? styles.success
    : ['In review', 'Submitted', 'Pending review'].includes(status)
      ? styles.pending
      : ['Action required', 'Rejected', 'Suspended'].includes(status)
        ? styles.warning
        : styles.neutral;

export default function KYCReviewPage({
  onBack = () => {},
  cases: suppliedCases
}) {
  const [cases, setCases] = useState(() =>
    (suppliedCases || demoCases).map((item) => ({
      ...item,
      checklist: item.checklist.map((check) => ({ ...check })),
      audit: [...item.audit]
    }))
  );

  const [selectedId, setSelectedId] = useState(
    (suppliedCases || demoCases)[0]?.id
  );
  const [filter, setFilter] = useState('All cases');
  const [search, setSearch] = useState('');
  const [activeDoc, setActiveDoc] = useState(null);
  const [decision, setDecision] = useState('');
  const [reason, setReason] = useState('');
  const [requestText, setRequestText] = useState('');
  const [showRequest, setShowRequest] = useState(false);
  const [notice, setNotice] = useState('');

  const selected =
    cases.find((item) => item.id === selectedId) || cases[0];

  const visible = useMemo(
    () =>
      cases.filter(
        (item) =>
          `${item.id} ${item.name} ${item.email} ${item.role}`
            .toLowerCase()
            .includes(search.toLowerCase()) &&
          (filter === 'All cases' || item.status === filter)
      ),
    [cases, filter, search]
  );

  if (!selected) {
    return (
      <div className={styles.page}>
        No verification cases available.
      </div>
    );
  }

  const audit = (id, action, note) => {
    const time =
      new Date().toLocaleString('en-GB', {
        timeZone: 'Africa/Lagos',
        dateStyle: 'medium',
        timeStyle: 'short'
      }) + ' WAT';

    setCases((previous) =>
      previous.map((item) =>
        item.id === id
          ? {
              ...item,
              audit: [
                ...item.audit,
                {
                  time,
                  actor: 'Current admin (demo)',
                  action,
                  note
                }
              ]
            }
          : item
      )
    );
  };

  const toggle = (id, checked) => {
    setCases((previous) =>
      previous.map((item) =>
        item.id === selectedId
          ? {
              ...item,
              checklist: item.checklist.map((check) =>
                check.id === id ? { ...check, checked } : check
              )
            }
          : item
      )
    );

    setNotice('');
  };

  const allChecked = selected.checklist.every(
    (item) => item.checked
  );

  const identityPassed = selected.identityStatus === 'Passed';

  const businessPassed = [
    'Not required',
    'Approved',
    'Passed'
  ].includes(selected.businessStatus);

  const canApprove =
    allChecked &&
    identityPassed &&
    businessPassed &&
    selected.status !== 'Approved';

  const openDoc = (document) => {
    setActiveDoc(document);

    audit(
      selectedId,
      'Document access requested',
      `${document.type}; demo placeholder only.`
    );
  };

  const confirmDecision = () => {
    if (decision === 'Approved' && !canApprove) {
      setNotice(
        'Approval blocked: complete every checklist item and confirm required identity/business checks have passed.'
      );
      return;
    }

    if (
      decision !== 'Approved' &&
      reason.trim().length < 10
    ) {
      setNotice(
        'Enter a clear reason of at least 10 characters. Do not include sensitive identity numbers.'
      );
      return;
    }

    const note =
      decision === 'Approved'
        ? 'Required checks completed in demo UI.'
        : reason.trim();

    setCases((previous) =>
      previous.map((item) =>
        item.id === selectedId
          ? { ...item, status: decision }
          : item
      )
    );

    audit(
      selectedId,
      decision === 'Approved'
        ? 'Case approved'
        : 'Case rejected',
      note
    );

    setDecision('');
    setReason('');

    setNotice(
      `${decision} recorded in this local demo only. No backend record or user notification was created.`
    );
  };

  const sendRequest = () => {
    if (requestText.trim().length < 10) {
      setNotice(
        'Describe the requested correction in at least 10 characters.'
      );
      return;
    }

    setCases((previous) =>
      previous.map((item) =>
        item.id === selectedId
          ? { ...item, status: 'Action required' }
          : item
      )
    );

    audit(
      selectedId,
      'More information requested',
      requestText.trim()
    );

    setRequestText('');
    setShowRequest(false);

    setNotice('Request recorded in this local demo only.');
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <button className={styles.back} onClick={onBack}>
            ← Back to admin dashboard
          </button>

          <p className={styles.eyebrow}>
            KHUB / ADMINISTRATION / TRUST &amp; SAFETY
          </p>

          <h1>KYC review center</h1>

          <p className={styles.subtitle}>
            Review identity and business verification cases
            with a traceable decision history.
          </p>
        </div>

        <div className={styles.adminBadge}>
          <span />
          Admin review workspace
        </div>
      </header>

      <div className={styles.demoBanner}>
        <strong>
          Prototype mode — no real documents or decisions are connected.
        </strong>
        <p>
          Changes remain in React state and disappear on refresh.
          Production needs server-side authorization, private storage,
          persistent audit logging, and verified identity-provider results.
        </p>
      </div>

      <section className={styles.stats}>
        {[
          [
            'All cases',
            cases.length,
            'Across demo queue'
          ],
          [
            'Needs review',
            cases.filter((item) =>
              ['Submitted', 'In review', 'Pending review'].includes(
                item.status
              )
            ).length,
            'Awaiting a decision'
          ],
          [
            'Action required',
            cases.filter(
              (item) => item.status === 'Action required'
            ).length,
            'Applicant follow-up'
          ],
          [
            'Approved',
            cases.filter(
              (item) => item.status === 'Approved'
            ).length,
            'In this demo queue'
          ]
        ].map(([label, count, description]) => (
          <div className={styles.stat} key={label}>
            <span>{label}</span>
            <strong>{count}</strong>
            <small>{description}</small>
          </div>
        ))}
      </section>

      <div className={styles.workspace}>
        <aside className={styles.queue}>
          <div className={styles.queueHead}>
            <div>
              <h2>Review queue</h2>
              <p>Select a case to inspect.</p>
            </div>
            <b>{visible.length}</b>
          </div>

          <label className={styles.field}>
            Search cases
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name, case ID, role"
            />
          </label>

          <label className={styles.field}>
            Filter by status
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              {[
                'All cases',
                'Submitted',
                'In review',
                'Action required',
                'Approved',
                'Rejected'
              ].map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>

          <div className={styles.caseList}>
            {visible.map((item) => (
              <button
                key={item.id}
                className={`${styles.case} ${
                  selectedId === item.id ? styles.selected : ''
                }`}
                onClick={() => {
                  setSelectedId(item.id);
                  setNotice('');
                  setActiveDoc(null);
                  setDecision('');
                }}
              >
                <div className={styles.caseTop}>
                  <strong>{item.name}</strong>
                  <span
                    className={`${styles.pill} ${statusClass(
                      item.status
                    )}`}
                  >
                    {item.status}
                  </span>
                </div>

                <span>{item.role}</span>
                <b>{item.id}</b>
                <small>{item.submitted}</small>
              </button>
            ))}

            {!visible.length && (
              <p className={styles.empty}>No matching cases.</p>
            )}
          </div>
        </aside>

        <main className={styles.detail}>
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <div>
                <p className={styles.eyebrow}>
                  CASE {selected.id}
                </p>
                <h2>{selected.name}</h2>
                <p className={styles.subtitle}>
                  {selected.email} · {selected.role}
                </p>
              </div>

              <span
                className={`${styles.pill} ${statusClass(
                  selected.status
                )}`}
              >
                {selected.status}
              </span>
            </div>

            <div className={styles.facts}>
              {[
                ['Submitted', selected.submitted],
                ['Country', 'Nigeria'],
                ['Identity result', selected.identityStatus],
                ['Business check', selected.businessStatus]
              ].map(([label, value]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>

            {selected.businessName && (
              <div className={styles.business}>
                <div>
                  <span>Registered business</span>
                  <strong>{selected.businessName}</strong>
                </div>
                <div>
                  <span>CAC number</span>
                  <strong>{selected.cacNumber}</strong>
                </div>
              </div>
            )}
          </section>

          <section className={styles.panel}>
            <div className={styles.sectionHead}>
              <div>
                <h3>Secure document access</h3>
                <p>
                  Open a document only when needed for this case.
                </p>
              </div>
              <span className={styles.lock}>▣ Restricted</span>
            </div>

            <div className={styles.security}>
              ⓘ
              <p>
                Files are placeholders. Production must authorize
                reviewer access on the server and issue a short-lived
                signed URL or proxy the file. Never trust a
                frontend-only access check.
              </p>
            </div>

            {selected.documents.map((document) => (
              <div className={styles.document} key={document.id}>
                <div className={styles.fileIcon}>FILE</div>

                <div className={styles.fileInfo}>
                  <strong>{document.name}</strong>
                  <span>
                    {document.type} · {document.format}
                  </span>
                </div>

                <button
                  className={styles.secondary}
                  onClick={() => openDoc(document)}
                >
                  Request access
                </button>
              </div>
            ))}

            {activeDoc && (
              <div className={styles.docNotice}>
                <div>
                  <strong>Access request logged</strong>
                  <p>{activeDoc.name}</p>
                  <small>
                    This demo does not retrieve a real file.
                    Production should return a server-authorized,
                    expiring URL and log access.
                  </small>
                </div>

                <button
                  className={styles.textButton}
                  onClick={() => setActiveDoc(null)}
                >
                  Close
                </button>
              </div>
            )}
          </section>

          <section className={styles.panel}>
            <div className={styles.sectionHead}>
              <div>
                <h3>Review checklist</h3>
                <p>
                  Confirm every applicable check before approving.
                </p>
              </div>

              <span className={styles.lock}>
                {selected.checklist.filter((item) => item.checked).length}
                /{selected.checklist.length} complete
              </span>
            </div>

            {selected.checklist.map((item) => (
              <label className={styles.check} key={item.id}>
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={(event) =>
                    toggle(item.id, event.target.checked)
                  }
                />

                <span>
                  <strong>{item.label}</strong>
                  <small>{item.detail}</small>
                </span>
              </label>
            ))}

            <div className={styles.gate}>
              <b>{canApprove ? '✓' : '!'}</b>
              <div>
                <strong>
                  {canApprove
                    ? 'Approval requirements satisfied'
                    : 'Approval is currently blocked'}
                </strong>
                <p>
                  {canApprove
                    ? 'Checklist and required verification results are complete.'
                    : 'Complete the checklist and ensure identity and required business checks have passed.'}
                </p>
              </div>
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.sectionHead}>
              <div>
                <h3>Decision and applicant follow-up</h3>
                <p>
                  Record a clear reason for negative or incomplete decisions.
                </p>
              </div>
            </div>

            {!decision ? (
              <div className={styles.actions}>
                <button
                  className={styles.approve}
                  disabled={!canApprove}
                  onClick={() => setDecision('Approved')}
                >
                  ✓ Approve case
                </button>

                <button
                  className={styles.request}
                  onClick={() => setShowRequest((value) => !value)}
                >
                  Request information
                </button>

                <button
                  className={styles.reject}
                  onClick={() => setDecision('Rejected')}
                >
                  Reject case
                </button>
              </div>
            ) : (
              <div className={styles.decisionForm}>
                <h4>
                  {decision === 'Approved'
                    ? 'Confirm approval'
                    : 'Reject this case'}
                </h4>

                <p>
                  {decision === 'Approved'
                    ? 'This is a local demo action only. Production must re-check permissions and required checks on the server.'
                    : 'Provide a specific, respectful reason. Do not include NIN or other sensitive numbers.'}
                </p>

                {decision !== 'Approved' && (
                  <label className={styles.field}>
                    Reason
                    <textarea
                      rows="3"
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      placeholder="Explain the mismatch or unmet requirement..."
                    />
                  </label>
                )}

                <div className={styles.actions}>
                  <button
                    className={styles.secondary}
                    onClick={() => {
                      setDecision('');
                      setReason('');
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    className={
                      decision === 'Approved'
                        ? styles.approve
                        : styles.reject
                    }
                    onClick={confirmDecision}
                  >
                    Confirm {decision.toLowerCase()}
                  </button>
                </div>
              </div>
            )}

            {showRequest && (
              <div className={styles.decisionForm}>
                <label className={styles.field}>
                  What must the applicant provide?
                  <textarea
                    rows="3"
                    value={requestText}
                    onChange={(event) =>
                      setRequestText(event.target.value)
                    }
                    placeholder="Describe the specific correction or missing information..."
                  />
                </label>

                <div className={styles.actions}>
                  <button
                    className={styles.secondary}
                    onClick={() => setShowRequest(false)}
                  >
                    Cancel
                  </button>

                  <button
                    className={styles.request}
                    onClick={sendRequest}
                  >
                    Send request (demo)
                  </button>
                </div>
              </div>
            )}

            {notice && (
              <div className={styles.notice} role="status">
                {notice}
              </div>
            )}
          </section>

          <section className={styles.panel}>
            <div className={styles.sectionHead}>
              <div>
                <h3>Audit log</h3>
                <p>
                  Chronological case activity in this prototype.
                </p>
              </div>
              <span className={styles.lock}>Read-only view</span>
            </div>

            <ol className={styles.audit}>
              {[...selected.audit].reverse().map((entry, index) => (
                <li key={`${entry.time}-${index}`}>
                  <span className={styles.auditDot} />

                  <div>
                    <div className={styles.auditHead}>
                      <strong>{entry.action}</strong>
                      <time>{entry.time}</time>
                    </div>

                    <p>{entry.note}</p>
                    <small>Actor: {entry.actor}</small>
                  </div>
                </li>
              ))}
            </ol>

            <p className={styles.auditDisclaimer}>
              Production audit events must be appended by the backend,
              access-controlled, protected from alteration, and retained
              under KHUB policy.
            </p>
          </section>
        </main>
      </div>

      <footer className={styles.footer}>
        KHUB Trust &amp; Safety · Sensitive data access is restricted
        to authorized reviewers.
      </footer>
    </div>
  );
}
