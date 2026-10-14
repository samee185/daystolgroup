/**
 * One page per Daystol company, all from the same template (pages/ServicePage.jsx).
 * Services on each page come from the admin (Website content → Services, filtered by company);
 * everything here is the fixed text around them.
 */
const steps = (list) => list.map(([title, text]) => ({ title, text }))

export const COMPANY_PAGES = {
  power: {
    company: 'power',
    companyName: 'Daystol Power Services Ltd.',
    title: 'Power solutions',
    h1: ['Reliable power,', 'installed and maintained.'],
    intro: 'Power solution management, electrical installations and mechanical engineering, plus sales, installation and maintenance of diesel generators, solar power systems and servo central industrial stabilizers.',
    primary: { label: 'Shop power equipment', to: '/shop' },
    secondary: { label: 'Get a quote', to: '/contact?type=quote' },
    enquiryType: 'quote',
    pillars: ['Sales', 'Installation', 'Maintenance'],
    chips: ['Diesel generators', 'Solar power systems', 'Servo stabilizers'],
    heroPhoto: 'powerHero',
    servicesTitle: 'Power for homes, businesses and industry',
    processTitle: 'From load assessment to aftercare',
    steps: steps([
      ['Assess your load', 'We look at what you need to power and how you use it.'],
      ['Recommend and quote', 'The right generator, solar or stabilizer size, with a clear quote.'],
      ['Supply and install', 'Our engineers deliver and install the equipment safely.'],
      ['Service and support', 'Maintenance contracts and a 24/7 fault line.'],
    ]),
    cta: { title: 'Need reliable power?', text: 'Tell us about your site and our engineers will recommend the right setup and send you a quote.', label: 'Get a quote', to: '/contact?type=quote' },
  },
  innovation: {
    company: 'innovation',
    companyName: 'Daystol Innovation Systems Ltd.',
    title: 'Innovation systems',
    h1: ['Smart systems that', 'run, watch and connect.'],
    intro: 'Electrical design and installation, power and home automation, surveillance systems, and ICT services: ICT installations, software engineering, web solutions and professional programming.',
    primary: { label: 'Request a consultation', to: '/contact?type=consultation' },
    secondary: { label: 'Report a fault', to: '/support' },
    enquiryType: 'consultation',
    pillars: ['Design', 'Installation', 'Support'],
    chips: ['Home automation', 'Surveillance systems', 'Software and web'],
    heroPhoto: 'innovationHero',
    servicesTitle: 'Automation, security and technology',
    processTitle: 'From the first idea to a system that works',
    steps: steps([
      ['Consultation', 'We learn what you want to automate, secure or build.'],
      ['Design', 'A clear plan and quote for the system or software.'],
      ['Install or build', 'We install the hardware or develop the software.'],
      ['Support', 'Training, maintenance and help when you need it.'],
    ]),
    cta: { title: 'Planning a smart home, security or software project?', text: 'Book a consultation and our team will help you plan it, then give you a clear quote.', label: 'Request a consultation', to: '/contact?type=consultation' },
  },
  property: {
    company: 'property',
    companyName: 'Daystol Properties Ltd.',
    title: 'Property services',
    h1: ['Property, developed', 'and well looked after.'],
    intro: 'Property development, sales and leasing, facility management, short-let apartments and real-estate consultancy.',
    primary: { label: 'Make a property enquiry', to: '/contact?type=property' },
    secondary: { label: 'Talk to our team', to: '/contact' },
    enquiryType: 'property',
    pillars: ['Develop', 'Sell and lease', 'Manage'],
    chips: ['Sales and leasing', 'Short-let apartments', 'Facility management'],
    heroPhoto: 'propertyHero',
    servicesTitle: 'Everything property, from plan to upkeep',
    processTitle: 'Simple from first viewing to move-in',
    steps: steps([
      ['Tell us what you need', 'Buying, renting, a short stay or managing a building.'],
      ['Options and viewings', 'We shortlist properties or plans that fit.'],
      ['Paperwork handled', 'Clear terms, agreements and handover.'],
      ['Ongoing care', 'Facility management keeps everything running.'],
    ]),
    cta: { title: 'Looking to buy, rent or develop?', text: 'Tell us what you are looking for and our property team will get back to you.', label: 'Make a property enquiry', to: '/contact?type=property' },
  },
}

/** Daystol Innovation Systems: who the systems are built for */
export const AUDIENCES = [
  { title: 'Homes', photo: 'homes', items: ['Home automation', 'CCTV', 'Power automation'] },
  { title: 'Offices', photo: 'offices', items: ['ICT and networks', 'Access and CCTV', 'Software'] },
  { title: 'Estates', photo: 'estates', items: ['Estate CCTV', 'Electrical design', 'Power automation'] },
]

/** Daystol Properties: quick starts. `topic` matches an option on the Contact page's property form. */
export const PROPERTY_INTENTS = [
  { label: 'Buy a property', topic: 'Buying property' },
  { label: 'Rent or lease', topic: 'Renting or leasing' },
  { label: 'Book a short-let', topic: 'Short-let apartment' },
  { label: 'Develop a site', topic: 'Property development' },
  { label: 'Manage my building', topic: 'Facility management' },
]
