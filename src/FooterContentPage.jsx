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
  'terms': { title: 'Terms & Conditions', intro: 'These terms explain expectations for using KHUB.', sections: [
    ['Using KHUB', 'Users are expected to provide accurate information, use the platform lawfully and respect other users.'],
    ['Service-specific conditions', 'Additional conditions may apply to purchases, listings, bookings, subscriptions and other services. Review applicable terms before proceeding.'],
    ['Questions', 'For the current complete terms, contact support@khub.com.ng.'],
  ] },
  'privacy': { title: 'Privacy Policy', intro: 'Information about how KHUB handles user information.', sections: [
    ['Your information', 'The current official Privacy Policy should explain what information is collected, how it is used, stored and shared, and the choices available to users.'],
    ['Privacy enquiries', 'For privacy questions or requests, contact support@khub.com.ng.'],
  ] },
  'refunds': { title: 'Refund & Return Policy', intro: 'Guidance for return and refund enquiries.', sections: [
    ['Eligibility', 'Return and refund eligibility may depend on the item, seller, transaction and applicable platform process.'],
    ['Request assistance', 'Keep your order details and contact KHUB support for guidance on a specific purchase.'],
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