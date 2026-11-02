# KHUB Marketplace Frontend

A responsive React + Vite implementation of the supplied KHUB homepage reference. The UI uses function components, CSS Modules, local image crops from the supplied screenshot, and client-side interactions.

## Run locally

1. Install Node.js 18+.
2. In this directory run `npm install`.
3. Run `npm run dev` and open the local URL printed by Vite.
4. Run `npm run build` for a production build.

## Implemented interactions

- Responsive navigation and scroll-to-section links
- Listing search and category filters
- Save/unsave listings
- Action dialogs for listing, rentals, services, jobs, rides, delivery, referrals and help
- Local demo form validation and success state
- Responsive mobile navigation and reduced-motion support

Forms are frontend-only and do not send data to a backend. Product names, prices, jobs, and marketplace claims are illustrative content matching the reference layout.




# KHUB Administrator KYC Review Page

## Installation

Copy these files into the folder containing your other React pages:

- `KYCReviewPage.jsx`
- `KYCReviewPage.module.css`

Make sure both files are in the same folder because the JSX imports the CSS Module.

## Integration

Import the component into your existing admin dashboard or routing component.

```jsx
import KYCReviewPage from './KYCReviewPage';

<KYCReviewPage
  onBack={() => setCurrentPage('admin-dashboard')}
/>
```

Adjust the import path and `onBack` callback to match KHUB's existing routing.

The page accepts two optional props:

- `onBack`: callback used when the administrator clicks Back to admin dashboard.
- `cases`: optional array of cases to display instead of the built-in demo cases.

If `cases` is omitted, fictional demonstration data is displayed.

## Features

- Search and filter KYC cases.
- View identity and business verification statuses.
- Review the document list.
- Complete a verification checklist.
- Approve eligible cases.
- Reject cases with a reason.
- Request additional information.
- View the case audit timeline.
- Responsive layout for desktop and mobile screens.

## Prototype limitations

This component is a frontend prototype.

- Cases are fictional.
- Checklist updates, decisions, and audit entries are stored in React state and disappear on refresh.
- Document access only logs a demo request; it does not retrieve an actual file.
- Approval and rejection do not update a backend.
- Applicants are not notified.
- No actual NIN or CAC verification is performed.

Do not use the demo implementation to make real identity-verification decisions.

## Production security requirements

Before processing real NIN or CAC data, KHUB must implement the following:

1. **Administrator authorization:** Use KHUB's existing authentication system and enforce reviewer permissions on the server. A frontend route or hidden button is not sufficient authorization.

2. **Private document storage:** Store identity and business documents in private storage. Authorize every document request on the backend and return a short-lived signed URL or stream the document through an authorized endpoint. Never expose identity documents through public URLs.

3. **Secure uploads:** Validate file size, file signature, actual file type, and allowed formats on the server. Apply malware scanning where available.

4. **Persistent case records:** Store case information, checklist results, statuses, and decisions in the backend database. Enforce approval requirements on the server rather than trusting React state.

5. **Audit logging:** Record the administrator ID, case ID, action, timestamp, reason, and relevant case version. Restrict alteration and deletion of audit records.

6. **NIN verification:** Integrate an authorized identity-verification provider. Do not expose or log raw NIN values unnecessarily. Store only the information required for the verification purpose.

7. **CAC verification:** Verify business registration details against an authoritative source and check whether the applicant is authorized to represent the business when applicable.

8. **Backend validation:** Validate every request, enforce rate limits, check permissions, handle concurrent reviews, and monitor suspicious document access.

9. **Privacy and retention:** Establish consent, data-retention, deletion, access-review, and appeal policies before collecting real documents.

10. **Verified status:** Award verified badges or enable seiller, rental-owner, and service-provider permissions only after the backend confirms that all required checks have passed.

## Suggested API contract

These endpoints are suggestions and are not implemented by this component.

- `GET /admin/kyc/cases?status=...`
- `GET /admin/kyc/cases/:id`
- `POST /admin/kyc/cases/:id/documents/:documentId/access`
- `PATCH /admin/kyc/cases/:id/checklist`
- `POST /admin/kyc/cases/:id/decision`
- `GET /admin/kyc/cases/:id/audit`

Each endpoint must authenticate the request and verify that the administrator is authorized to access the requested case.

## Recommended production workflow

1. A user submits their identity-verification information.
2. The backend sends the required identity data to an authorized verification provider.
3. Business users submit CAC details and supporting documents when required by KHUB policy.
4. The backend stores the case and documents securely.
5. An authorized administrator reviews the verification result and applicable documents.
6. The administrator completes the checklist and approves, rejects, or requests more information.
7. The backend validates the decision, updates the case status, and appends an audit event.
8. KHUB notifies the applicant and updates verification permissions only after the backend confirms the final status.
