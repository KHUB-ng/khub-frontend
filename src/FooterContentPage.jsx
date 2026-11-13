import React from 'react';
import styles from './FooterContentPage.module.css';

const pages = {
  'about-us': { title: 'About KHUB', intro: 'KHUB is an all-in-one digital business and commerce platform connecting people, businesses and opportunities.', sections: [
    ['What KHUB does', 'KHUB brings shopping, selling, rentals, jobs, services, rides and delivery opportunities together in one connected platform.'],
    ['Who we serve', 'The platform is designed for customers, sellers, entrepreneurs, service providers, job seekers, employers, property owners, drivers and logistics partners.'],
    ['Our commitment', 'We aim to make everyday commerce and business opportunities more accessible through technology, convenience and continuous improvement.'],
  ] },
  'mission-vision': { title: 'Mission & Vision', intro: 'Connecting people. Empowering businesses. Creating opportunities.', sections: [
    ['Our mission', 'To build an accessible, innovative and reliable digital ecosystem connecting people, businesses, products, services and opportunities.'],
    ['Our vision', 'To become a leading digital business and commerce platform connecting people and businesses to everyday opportunities.'],
    ['Our values', 'Innovation, accessibility, trust, transparency, empowerment, customer focus and sustainable growth guide our work.'],
  ] },
  'why-choose-khub': { title: 'Why Choose KHUB?', intro: 'Multiple services and opportunities in one connected platform.', sections: [
    ['One platform', 'Explore products, services, jobs, rentals, rides and delivery solutions in one place.'],
    ['Business visibility', 'KHUB gives businesses and professionals a place to showcase offerings and connect with potential customers.'],
    ['Convenience', 'Users can discover opportunities and manage relevant listings, orders, bookings and communications through their account.'],
  ] },
  'our-services': { title: 'Our Services', intro: 'Discover the different ways KHUB connects people and businesses.', sections: [
    ['KHUB Shop', 'Explore products from sellers across marketplace categories.'],
    ['Services marketplace', 'Find professionals and service providers offering different skills.'],
    ['Jobs & careers', 'Explore vacancies, apply for opportunities or publish job listings.'],
    ['Rentals', 'Discover homes, spaces, equipment and other rental opportunities.'],
    ['Rides & delivery', 'Access ride booking and connect with delivery and logistics providers.'],
  ] },
  'careers': { title: 'Careers at KHUB', intro: 'Help build a platform that connects people, businesses and opportunities.', sections: [
    ['Areas of opportunity', 'Potential roles may include software engineering, product design, marketing, business development, customer support, operations, finance and logistics.'],
    ['Applying', 'Check KHUB official channels for current vacancies and application instructions. KHUB does not authorise unofficial recruitment fees.'],
  ] },
  'become-a-partner': { title: 'Become a Partner', intro: 'Explore opportunities to work with KHUB.', sections: [
    ['Partnership opportunities', 'We welcome discussions with business, logistics, transportation, service-provider, technology, institutional and strategic partners.'],
    ['Start a conversation', 'Share your organisation details, proposed collaboration and objectives with our team for review.'],
  ] },
  'affiliate-programme': { title: 'Affiliate Programme', intro: 'Share KHUB and introduce others to its marketplace and services.', sections: [
    ['How it works', 'Approved affiliates can share KHUB using programme links or codes and may earn rewards for qualifying referrals under programme terms.'],
    ['Programme guidelines', 'Promotions must be honest and comply with programme rules. Rewards and eligibility are subject to official terms. Earnings are not guaranteed.'],
  ] },
  'advertise-with-us': { title: 'Advertise With KHUB', intro: 'Reach potential customers and increase awareness of your brand.', sections: [
    ['Advertising opportunities', 'Enquire about sponsored listings, banner placements, featured business promotion, category advertising and campaigns, subject to availability.'],
    ['Review and approval', 'Advertising requests are subject to review and must be accurate, lawful and consistent with KHUB requirements.'],
  ] },
  'business-enquiries': { title: 'Business Enquiries', intro: 'Contact KHUB about corporate, commercial and strategic opportunities.', sections: [
    ['Enquiry areas', 'Business development, investment, technology integration, enterprise solutions, strategic partnerships, media and public relations.'],
    ['Contact', 'Business enquiries: hello@khub.com.ng. General support: support@khub.com.ng.'],
  ] },
  'cookie-policy': { title: 'Cookie & Local Storage Policy', intro: 'How KHUB uses essential browser storage and embedded third-party services.', sections: [
    ['Essential storage', 'KHUB uses browser storage needed to maintain secure sessions and remember basic interface preferences. These technologies support sign-in, session renewal and user-selected display settings.'],
    ['Embedded services', 'Map previews and other embedded third-party tools may receive technical information such as your IP address and browser details under their own privacy and cookie policies.'],
    ['Your choices', 'You can manage cookies and local storage through your browser settings. Blocking essential storage may prevent sign-in or some platform features from working. Optional analytics and advertising cookies must not be enabled until KHUB has configured the required notice and consent controls.'],
  ] },
  'advertising-policy': { title: 'Sponsored Advertising Policy', intro: 'Standards for sponsored listings and paid promotional placements on KHUB.', sections: [
    ['Clear sponsored labels', 'Sponsored placements must be visibly labelled as Sponsored or Promoted. Payment or approval must not be presented as an independent endorsement or verification of the advertiser.'],
    ['Review and approval', 'Every sponsored listing request is subject to administrator review. KHUB may reject, pause or remove an ad that is inaccurate, misleading, unlawful, unsafe, irrelevant to the placement or inconsistent with platform rules.'],
    ['Advertiser responsibility', 'Advertisers must own or be authorised to promote the listing, provide accurate information and comply with applicable advertising and consumer-protection requirements.'],
    ['Campaign budgets and billing', 'A budget submitted with a placement request is a proposal for review only. The current request workflow records the proposed budget but does not collect advertising payment, issue invoices or guarantee delivery. KHUB must publish a separate rate card, billing, refund, campaign duration and reporting process before charging advertisers.'],
    ['Contact', 'For advertising enquiries, contact hello@khub.com.ng.'],
  ] },
  'buyer-protection': { title: 'Buyer Protection Policy', intro: 'Guidance for customers making purchases through KHUB.', sections: [
    ['Keep transactions on KHUB', 'Use official platform processes and keep order, payment and communication records. Payments made directly outside KHUB may not be covered by platform protection.'],
    ['Need assistance?', 'Contact support@khub.com.ng with relevant order details for guidance.'],
  ] },
  'seller-protection': { title: 'Seller Protection Policy', intro: 'Guidance for sellers using the KHUB marketplace.', sections: [
    ['Accurate listings', 'Provide truthful product descriptions, prices, availability and fulfilment information.'],
    ['Keep records', 'Use official platform processes where available and retain order and communication records. Contact support@khub.com.ng for assistance.'],
  ] },
  'secure-payments': { title: 'Secure Payments & Escrow', intro: 'Use official KHUB payment processes whenever they are available for your transaction.', sections: [
    ['Protect your transactions', 'Do not transfer money through unofficial channels on the assumption that the transaction is protected by KHUB.'],
    ['Payment questions', 'For current payment and escrow availability, contact support@khub.com.ng.'],
  ] },
  'terms': { title: 'Terms & Conditions', intro: 'Rules for accounts, listings, payments, marketplace activity and use of KHUB.', sections: [
    ['Accounts and eligibility', 'Provide accurate account information, keep access credentials confidential and use only accounts you are authorised to control. KHUB may require email verification, identity checks or additional approval for particular roles. Users must meet KHUB’s published minimum age and legal eligibility requirements.'],
    ['Listings and user conduct', 'Publish accurate descriptions, prices, availability, location and terms. You are responsible for the content you submit and for complying with applicable law. Fraud, impersonation, harassment, counterfeit goods, unlawful services, misleading claims and attempts to move protected transactions outside KHUB are prohibited.'],
    ['Marketplace responsibilities', 'Unless a page expressly says otherwise, sellers, landlords, employers and service providers remain responsible for the accuracy of their offers and their own fulfilment obligations. KHUB provides platform tools for discovery, communication, payment and dispute handling; a listing or badge is not a guarantee of quality, suitability or outcome.'],
    ['Payments, fees and escrow', 'Use only the payment methods shown in KHUB checkout. Any applicable price, fee or commission must be displayed or otherwise disclosed before confirmation. Where KHUB uses escrow, funds are held and released or refunded according to the applicable transaction workflow and dispute decision; escrow is not an unconditional guarantee against loss.'],
    ['Moderation and account action', 'KHUB may review, restrict, remove or suspend content and accounts where there is a safety, legal, fraud, policy or security concern. Users may contact support@khub.com.ng to request review of an account or moderation decision.'],
    ['Changes and contact', 'KHUB may update these terms as features and legal requirements change. Material changes should be communicated through the platform or other appropriate channel. Continued use after an effective update is subject to the revised terms. Contact support@khub.com.ng with questions.'],
    ['Publication requirement', 'KHUB must confirm its legal contracting entity, governing-law clause, dispute forum, liability wording, consumer-law disclosures and effective date with qualified Nigerian counsel before treating this draft as final legal terms.'],
  ] },
  'privacy': { title: 'Privacy Policy', intro: 'How KHUB collects, uses, protects and shares personal information when you use the platform.', sections: [
    ['Who is responsible', 'KHUB operates this marketplace and related services. Before publication, KHUB must insert its full registered legal entity name, registered address and the name or contact channel of its designated privacy lead. Privacy requests can be sent to support@khub.com.ng.'],
    ['Information we process', 'Depending on the features you use, KHUB may process account and contact details; profile information; listing, order, booking and application records; support requests and messages; payment references and transaction records; identity and business verification documents; location information for ride and delivery services; and technical, device, security and usage logs. Payment card and bank authentication data are handled by the relevant payment provider and should not be entered into KHUB messages.'],
    ['Why we use it and lawful grounds', 'We use information to create and secure accounts, provide marketplace and logistics features, process transactions, communicate about orders and applications, prevent fraud and abuse, meet legal obligations, resolve disputes and improve platform reliability. Depending on the activity, processing may be necessary to perform a contract, comply with a legal obligation, pursue a legitimate interest that does not override your rights, or rely on consent where consent is required.'],
    ['Sharing and service providers', 'Information may be shared with the other party to a transaction where needed to fulfil it, with payment, hosting, private-storage, email, mapping, support and security providers acting for KHUB, and with regulators or law-enforcement authorities where legally required. KHUB should maintain processor agreements, publish the relevant recipient categories and document safeguards for any transfer outside Nigeria. KHUB does not offer personal information for sale.'],
    ['Location and verification records', 'Location access is used for features that need it, such as pickup, route and driver or delivery-agent tracking. Live sharing should occur only while the relevant role is online or a trip is active. Identity documents are sensitive records and must be kept in private storage with access limited to authorised reviewers; administrator preview links are short-lived.'],
    ['Retention and security', 'KHUB retains information only for as long as needed for the stated purpose, account administration, transaction records, legal and accounting duties, safety investigations and dispute handling. The final retention schedule and deletion periods must be published by KHUB. Technical and organisational safeguards are used to protect information, but no online system can guarantee absolute security.'],
    ['Your privacy rights', 'Subject to applicable law and the circumstances, you may request access to your information, correction, deletion, restriction of processing, object to processing, receive portable information, or withdraw consent where processing relies on consent. You may also complain to the Nigeria Data Protection Commission. Send a request to support@khub.com.ng and identify the account concerned; KHUB may need to verify the request before acting.'],
    ['Cookies and external services', 'KHUB uses essential technical storage needed for account sessions and platform operation. Embedded maps and other third-party services may process technical data under their own terms. KHUB must disclose any optional analytics or advertising cookies and provide consent controls before enabling them where required.'],
    ['Children and account eligibility', 'KHUB must publish and enforce its minimum account age and any required parent or guardian authorisation before collecting personal information from children. Do not submit another person’s identity documents or personal information without lawful authority.'],
    ['Updates and contact', 'This notice may be updated when the platform or its processing changes. Last reviewed: 13 November 2026. For privacy questions, data requests or complaints, contact support@khub.com.ng. This draft must be reviewed against KHUB’s actual legal entity, processors, retention schedule, cross-border transfers and operating practices before production publication.'],
  ] },
  'refunds': { title: 'Refund & Return Policy', intro: 'How KHUB reviews eligible refund, return and transaction-dispute requests.', sections: [
    ['Scope', 'This policy covers purchases and platform-managed payment flows. Services, rentals, rides and deliveries may have additional terms shown during the relevant booking or request. The terms presented for a specific transaction take priority where they lawfully apply.'],
    ['When a refund may be considered', 'A refund may be considered where an order is cancelled in an eligible state, a seller cannot fulfil the order, the item materially differs from its listing, a transaction is duplicated, or a dispute is resolved in the buyer’s favour. Eligibility depends on the transaction status, evidence, applicable law and the terms shown when the order was placed.'],
    ['Returns and item condition', 'Where a return is appropriate, KHUB may ask for photographs, order details and information about the item’s condition. The seller and buyer should keep communications and evidence within KHUB. Do not return an item to an unconfirmed address or outside the agreed process.'],
    ['How to request help', 'Open the relevant order or booking, use the available cancellation or dispute process where shown, and contact support@khub.com.ng with the order reference and a clear description of the issue. KHUB may request supporting evidence from the parties before making a decision.'],
    ['Refund destination and timing', 'Where the backend approves a refund, the refund is processed through the applicable KHUB transaction flow and may be credited to the KHUB wallet or returned through the original payment route where supported. Processing times depend on the payment provider and financial institution. KHUB must publish confirmed service-level timeframes before promising a fixed number of days.'],
    ['What may not be covered', 'Payments made directly to another user outside KHUB, completed services, used or damaged goods, expired bookings, and transactions that violate platform rules may not qualify for a platform refund. This is not an exhaustive list; mandatory consumer rights under applicable law are not waived.'],
    ['Escalation', 'If you disagree with an outcome, reply to the support case with the order reference and relevant evidence. KHUB will review the request under its dispute process. Contact support@khub.com.ng.'],
  ] },
  'cancellation': { title: 'Cancellation Policy', intro: 'Cancellation conditions for KHUB transactions and bookings.', sections: [
    ['Conditions', 'Cancellation conditions may vary by transaction type, seller, service provider or booking.'],
    ['Before cancelling', 'Review terms shown during the transaction and contact support if you need assistance.'],
  ] },
  'delivery-policy': { title: 'Delivery Policy', intro: 'Information about delivery arrangements on KHUB.', sections: [
    ['Delivery arrangements', 'Delivery options, timing, fees and fulfilment responsibilities may vary by seller and delivery method.'],
    ['Order assistance', 'Keep order details and use available tracking and support channels for assistance.'],
  ] },
  'rental-terms': { title: 'Rental Terms', intro: 'Important considerations when exploring rental listings.', sections: [
    ['Confirm details', 'Confirm availability, pricing, dates, deposits and applicable conditions with the listing owner before making a commitment.'],
    ['Listing information', 'Rental arrangements are subject to details and conditions provided by the property or asset owner.'],
  ] },
  'job-policy': { title: 'Job Posting Policy', intro: 'Guidance for employers and job seekers using KHUB.', sections: [
    ['For employers', 'Publish genuine and accurate vacancies with clear role requirements and relevant details.'],
    ['For job seekers', 'Review listings carefully and be cautious of requests for unofficial recruitment fees.'],
  ] },
  'provider-policy': { title: 'Service Provider Policy', intro: 'Expectations for service providers and customers.', sections: [
    ['For providers', 'Describe skills, services, pricing and availability accurately, and communicate professionally.'],
    ['For customers', 'Confirm scope of work, pricing and service conditions before proceeding.'],
  ] },
  'prohibited-items': { title: 'Prohibited Items & Activities', intro: 'KHUB must not be used to facilitate unlawful or harmful activity.', sections: [
    ['Not permitted', 'Users must not list illegal, dangerous, counterfeit or otherwise prohibited goods or services, or use KHUB for fraud, harassment or deception.'],
    ['Report concerns', 'Report suspicious activity to support@khub.com.ng.'],
  ] },
  'disputes': { title: 'Dispute Resolution', intro: 'How to seek help when a transaction or interaction goes wrong.', sections: [
    ['Keep evidence', 'Retain relevant messages, receipts, order details and other information related to the issue.'],
    ['Contact support', 'Send KHUB support a clear description of the dispute and supporting information so it can be reviewed.'],
  ] },
  'account-appeals': { title: 'Account Suspension & Appeals', intro: 'Information for users seeking a review of an account restriction.', sections: [
    ['Request a review', 'Contact KHUB support using your registered contact details and explain the issue clearly.'],
    ['Review process', 'Account reviews are subject to KHUB platform procedures. Contact support@khub.com.ng.'],
  ] },
  'how-khub-works': { title: 'How KHUB Works', intro: 'Discover how to use KHUB marketplace and services.', sections: [
    ['Discover', 'Browse products, services, jobs, rentals and mobility opportunities.'],
    ['Choose a service', 'Open the relevant section, review available details and follow the steps shown.'],
    ['Manage your activity', 'Use your account to access relevant orders, bookings, messages, listings and available features.'],
  ] },
  'contact-us': { title: 'Contact KHUB', intro: 'We are here to help with questions about the platform.', sections: [
    ['General support', 'Email support@khub.com.ng.'],
    ['Business enquiries', 'Email hello@khub.com.ng.'],
    ['Website', 'Visit https://khub.com.ng.'],
  ] },
};

export const footerRoutes = {
  'Cookie & Local Storage Policy': 'footer-cookie-policy',
  'Sponsored Advertising Policy': 'footer-advertising-policy',
  'About Us': 'footer-about-us',
  'Mission & Vision': 'footer-mission-vision',
  'Why Choose KHUB?': 'footer-why-choose-khub',
  'Our Services': 'footer-our-services',
  'Careers': 'footer-careers',
  'Become a Partner': 'footer-become-a-partner',
  'Affiliate Programme': 'footer-affiliate-programme',
  'Advertise With Us': 'footer-advertise-with-us',
  'Business Enquiries': 'footer-business-enquiries',
  'Contact Us': 'footer-contact-us',
  'Buyer Protection Policy': 'footer-buyer-protection',
  'Seller Protection Policy': 'footer-seller-protection',
  'Secure Payments & Escrow': 'footer-secure-payments',
  'Terms & Conditions': 'footer-terms',
  'Privacy Policy': 'footer-privacy',
  'Refund & Return Policy': 'footer-refunds',
  'Cancellation Policy': 'footer-cancellation',
  'Delivery Policy': 'footer-delivery-policy',
  'Rental Terms': 'footer-rental-terms',
  'Job Posting Policy': 'footer-job-policy',
  'Service Provider Policy': 'footer-provider-policy',
  'Prohibited Items & Activities': 'footer-prohibited-items',
  'Dispute Resolution': 'footer-disputes',
  'Account Suspension & Appeals': 'footer-account-appeals',
  'How KHUB Works': 'footer-how-khub-works',
};

export default function FooterContentPage({ page, onNavigate }) {
  const content = pages[page] || {
    title: page.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
    intro: 'KHUB is committed to providing a clear, reliable and user-focused experience across its digital marketplace.',
    sections: [['Information', 'For the latest details, requirements and applicable procedures for this topic, please contact KHUB support at support@khub.com.ng.'], ['Our commitment', 'KHUB may update its platform processes and guidelines as its services develop. Please refer to the latest official information before taking action.']],
  };
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <span>KHUB INFORMATION</span>
        <h1>{content.title}</h1>
        <p>{content.intro}</p>
        <div className={styles.actions}>
          <button onClick={() => onNavigate('home')}>Explore KHUB</button>
          <button className={styles.secondary} onClick={() => onNavigate('account')}>Create an Account</button>
        </div>
      </section>
      <div className={styles.body}>
        {content.sections.map(([heading, body]) => (
          <section key={heading}><h2>{heading}</h2><p>{body}</p></section>
        ))}
        <aside className={styles.contact}><strong>Need assistance?</strong><p>General support: <a href="mailto:support@khub.com.ng">support@khub.com.ng</a></p><p>Business enquiries: <a href="mailto:hello@khub.com.ng">hello@khub.com.ng</a></p><p><a href="https://khub.com.ng" target="_blank" rel="noreferrer">khub.com.ng</a></p></aside>
      </div>
    </main>
  );
}