import React from 'react';
import styles from './FooterInfoPopup.module.css';

const content = {
  'About Us': { intro: 'Connecting Businesses, People and Opportunities.', sections: [
    ['What Is KHUB?', 'KHUB is an all-in-one digital business and commerce platform designed to make buying, selling, renting, finding jobs, accessing services and connecting with opportunities easier. We are building a connected digital marketplace where individuals, entrepreneurs, small businesses, established companies, service providers, job seekers, property owners, drivers and logistics operators can interact, discover opportunities and grow their businesses.'],
    ['What You Can Do on KHUB', 'Shop: Discover products, connect with sellers and purchase goods. Sell: Create business listings, showcase products and reach potential customers. Find Services: Discover professionals and service providers. Find Jobs and Post Jobs: Explore vacancies or advertise openings. Explore Rentals: Discover properties, shops, offices, halls, equipment and other rental opportunities. Book Rides: Connect with available drivers. Access Logistics: Connect with dispatch riders and delivery providers.'],
    ['Why We Are Building KHUB', 'We recognise that people and businesses often rely on multiple platforms to accomplish everyday activities. KHUB aims to bring these opportunities together in one connected ecosystem. We believe businesses of every size deserve visibility, individuals deserve access to opportunities, and technology should make everyday commercial activities simpler and more accessible.'],
    ['Who Can Use KHUB?', 'Individual shoppers and customers; small and medium-sized businesses; entrepreneurs and business owners; online and physical retailers; freelancers and service professionals; job seekers and employers; landlords and property owners; shops, office and equipment owners; drivers and vehicle owners; dispatch riders and logistics operators; and businesses seeking growth and visibility.'],
    ['Our Commitment', 'We are committed to continuously improving KHUB through technology, innovation, accessibility and user-focused services. Our ambition is to expand opportunities across Nigeria and beyond. KHUB — Your No. 1 Business Hub. Imagine Tomorrow, Creating Today.']
  ]},
  'Mission & Vision': { intro: 'Our Mission & Vision', sections: [
    ['Our Mission', 'To build an accessible, innovative and reliable digital business ecosystem that connects people, businesses, products, services and opportunities in one convenient platform. We aim to empower entrepreneurs, small businesses, professionals and individuals with the digital tools and visibility they need to grow, earn, connect and succeed. Through technology, we want to simplify commerce, improve access to opportunities and make everyday business activities easier for everyone.'],
    ['Our Vision', "To become one of Africa's leading all-in-one digital business and commerce platforms, connecting millions of people and businesses to products, services, employment, rentals, transportation and economic opportunities. We envision a future where anyone, regardless of business size or location, can access the digital opportunities needed to participate in the modern economy."],
    ['Our Core Values', 'Innovation: We embrace technology, creativity and continuous improvement. Accessibility: Opportunities should be accessible regardless of size or location. Trust & Transparency: We strive for responsible transactions, transparent policies and accountable operations. Empowerment: We help individuals earn and businesses reach customers. Customer Focus: Users remain at the centre of our decisions. Growth & Opportunity: We create an environment where people and businesses can discover possibilities and achieve more.'],
    ['Our Promise', 'We will continue building, improving and expanding KHUB to make business and everyday opportunities more accessible. KHUB — Connecting People. Empowering Businesses. Creating Opportunities.']
  ]},
  'Why Choose KHUB?': { intro: 'Everything You Need. One Connected Platform.', sections: [
    ['Multiple Services, One Platform', 'Discover products, services, employment opportunities, rental spaces, transportation and delivery solutions without depending on multiple platforms.'],
    ['More Visibility for Businesses', 'Small shops, online businesses and established companies can showcase products and services to potential customers.'],
    ['Opportunities to Earn', 'Sellers, service providers, drivers, dispatch riders and property owners can connect with potential customers.'],
    ['Convenient Shopping Experience', 'Discover products from different sellers, explore options and manage shopping activities through one platform.'],
    ['Employment Opportunities', 'Job seekers can explore vacancies while employers publish opportunities and connect with candidates.'],
    ['Discover Rental Opportunities', 'Find properties, shops, offices, halls, equipment and other rental listings.'],
    ['Transportation and Delivery Connections', 'Connect with drivers for rides and logistics providers for package delivery, subject to availability in your area.'],
    ['Business Growth and Account Management', 'KHUB supports business listings, visibility opportunities and subscription options. Users can manage applicable orders, bookings, listings, messages and transactions.'],
    ['Continuous Innovation', 'We are committed to improving the KHUB experience, accessibility and services. Customers, entrepreneurs, sellers, professionals, job seekers, employers, landlords, drivers and dispatch riders can all benefit.']
  ]},
  'Our Services': { intro: 'One Platform. Multiple Opportunities.', sections: [
    ['Online Shopping (KHUB Shop)', 'Discover products listed by sellers. Explore categories, compare options, connect with sellers and place orders. For buyers, retailers, wholesalers and online businesses.'],
    ['Business Marketplace', 'Businesses can establish an online presence, showcase offerings and connect with customers. For entrepreneurs, shop owners, retailers and business owners.'],
    ['Services Marketplace', 'Discover professionals and service providers, review offerings and connect with them. For freelancers, skilled professionals, service businesses and customers.'],
    ['Jobs & Careers', 'Employers can advertise vacancies and connect with candidates; job seekers can explore opportunities and apply.'],
    ['Rentals Marketplace', 'Discover houses and apartments, shops and commercial spaces, offices, halls and event spaces, equipment, machinery and other rental assets.'],
    ['Rides & Transportation', 'KHUB aims to connect passengers with available transportation providers, subject to availability and verification requirements.'],
    ['Logistics & Delivery', 'Connect businesses and customers with delivery providers for package transportation and order fulfilment.'],
    ['Business Subscription Plans', 'Available plans include FREE, VERIFIED and PREMIUM. Each plan provides different benefits, listing allowances and access privileges as outlined on the subscription page.'],
    ['Referral Programme', "KHUB's referral programme encourages users to introduce the platform to others. Eligible participants can earn rewards under the applicable programme terms."]
  ]},
  'Careers': { intro: 'Build the Future of Digital Commerce With Us.', sections: [
    ['Working With KHUB', 'We believe technology can transform how people do business, access opportunities and connect. We welcome talented, passionate and forward-thinking individuals who want to contribute to solutions that create meaningful impact.'],
    ['Why Work With KHUB?', 'Be part of innovation; make an impact; grow your skills in an environment that values learning, creativity, collaboration and continuous improvement; and help build a platform serving individuals and businesses across Nigeria and beyond.'],
    ['Areas of Opportunity', 'Software Engineering and Development; UI/UX and Product Design; Product Management; Digital Marketing and Social Media; Business Development; Sales and Customer Acquisition; Customer Support; Operations and Administration; Finance and Accounting; Logistics and Business Operations; Data Analysis and Technology; Content Creation and Communications.'],
    ['Who We Are Looking For', 'Individuals who demonstrate creativity, professionalism, accountability, strong communication, willingness to learn, teamwork and passion for technology and business development.'],
    ['How to Apply', 'Check this page for available vacancies and application instructions. Each vacancy will include its job description, qualifications, responsibilities, location and application process. Apply only through official recruitment channels. KHUB does not authorise individuals to collect unofficial recruitment fees.']
  ]},
  'Become a Partner': { intro: "Let's Build Opportunities Together.", sections: [
    ['Who Can Partner With KHUB?', 'Business partners: companies, brands, retailers and organisations. Logistics partners: delivery companies and dispatch operators. Transportation partners: transport companies, vehicle owners and mobility operators. Service providers: professionals, agencies and service businesses. Strategic and technology partners: technology companies and software providers. Institutional partners: business associations, training institutions and development organisations. Investment partners: investors and funding organisations.'],
    ['Why Partner With KHUB?', 'Access to a growing digital business ecosystem, opportunities to reach relevant audiences, potential business development collaborations, access to different marketplace categories, opportunities to support small businesses and long-term strategic growth.'],
    ['Partnership Opportunities', 'Strategic business partnerships, technology integrations, logistics and delivery collaborations, marketing and promotional partnerships, institutional collaborations, investment and funding opportunities, and business development agreements.'],
    ['Let’s Work Together', 'Submit a partnership enquiry through official contact channels with details about your organisation, proposed partnership and objectives. All proposals are subject to review, evaluation and mutual agreement.']
  ]},
  'Affiliate Programme': { intro: 'Share KHUB. Grow Your Network. Earn Eligible Rewards.', sections: [
    ['How It Works', 'Join the programme through your KHUB account, subject to eligibility and approval. Once approved, access your unique affiliate referral link or promotional code. Share KHUB through approved channels. Qualifying registrations or activities may be recorded in your affiliate account. Eligible rewards are provided according to published terms.'],
    ['Who Can Become an Affiliate?', 'Social media influencers, content creators, digital marketers, bloggers and website owners, entrepreneurs, students, business communities and individuals interested in promoting digital opportunities.'],
    ['Benefits of Joining', 'Unique referral tracking, opportunities to earn eligible rewards, promotional materials where available, the ability to promote KHUB to different audiences and an opportunity to grow your referral network.'],
    ['Affiliate Guidelines', 'Promote KHUB honestly and professionally; use approved links and materials; avoid misleading advertisements and false promises; never impersonate KHUB; avoid spam, fraudulent registrations and artificial referrals; and follow applicable affiliate policies.'],
    ['Important Programme Information', 'Commission rates, qualifying activities, payment thresholds, reward calculations and withdrawal conditions are governed by official programme terms. Participation does not guarantee earnings. Rewards are subject to verified qualifying activities. KHUB may review, suspend or terminate accounts involved in fraudulent or prohibited activities.']
  ]},
  'Advertise With Us': { intro: 'Put Your Brand in Front of More Potential Customers.', sections: [
    ['Why Advertise on KHUB?', 'Reach different audiences across shoppers, entrepreneurs, job seekers, service providers, businesses and property owners. Promote products and services, increase brand visibility, promote special offers and support business growth.'],
    ['Advertising Opportunities', 'Subject to inventory and approval, KHUB may offer homepage advertising, sponsored listings, banner advertising, category advertising, featured business promotion, campaign and promotional advertising, and brand partnerships.'],
    ['Who Can Advertise?', 'Retailers and wholesalers, small and medium-sized businesses, established companies and brands, service providers, educational institutions, property and rental businesses, technology companies, event organisers and other eligible organisations.'],
    ['Advertising Requirements', 'Advertisements must contain accurate and truthful information, comply with applicable laws and KHUB guidelines, avoid misleading claims and prohibited content, and use appropriate images and promotional materials. All requests are subject to review, availability and approval.']
  ]},
  'Business Enquiries': { intro: "Let's Talk Business.", sections: [
    ['What Can You Contact Us About?', 'Corporate enquiries; investment enquiries; strategic partnerships; technology and integration; commercial opportunities; enterprise solutions; media and public relations.'],
    ['Submit a Business Enquiry', 'Please provide your full name, company or organisation name, business email address, phone number, type of enquiry, subject and description of your proposal or enquiry. Our team will review submissions and respond through the contact details provided where appropriate.'],
    ['Contact KHUB', 'Website: https://khub.com.ng. Business Enquiries: hello@khub.com.ng. General Support: support@khub.com.ng. Location: Kano State, Nigeria.'],
    ['Let’s Create Something Valuable Together', 'We believe great opportunities begin with meaningful conversations. Reach out to KHUB and let’s explore how we can work together.']
  ]}
};

export default function FooterInfoPopup({ title, onClose }) {
  const data = content[title];
  if (!data) return null;
  return <div className={styles.backdrop} role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <article className={styles.dialog} role="dialog" aria-modal="true" aria-label={title}>
      <button className={styles.close} onClick={onClose} aria-label="Close">×</button>
      <span className={styles.eyebrow}>KHUB · INFORMATION</span><h2>{title}</h2><p className={styles.intro}>{data.intro}</p>
      <div className={styles.content}>{data.sections.map(([heading, body]) => <section key={heading}><h3>{heading}</h3><p>{body}</p></section>)}</div>
      <footer><span>KHUB — Your No. 1 Business Hub.</span><button onClick={onClose}>Close</button></footer>
    </article>
  </div>;
}
