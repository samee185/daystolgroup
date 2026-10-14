/** The three Daystol companies. Colours come from the logo: yellow, cyan, magenta. */
export const COMPANIES = [
  {
    id: 'power',
    company: 'Daystol Power Services',
    legalName: 'Daystol Power Services Ltd.',
    title: 'Light, every hour.',
    text: 'Power solution management, electrical installations and mechanical engineering. Sales, installation and maintenance of diesel generators, solar power systems and servo central industrial stabilizers.',
    cta: 'Power solutions and shop',
    to: '/power-solutions',
    bg: '#FFE52E',
    fg: '#0D1330',
    tint: '#EDD10A',
    tintText: '#5A4E00',
    glow: '#FFE52E',
    buttonBg: '#0D1330',
    buttonFg: '#FFFFFF',
  },
  {
    id: 'innovation',
    company: 'Daystol Innovation Systems',
    legalName: 'Daystol Innovation Systems Ltd.',
    title: 'Smart systems, built right.',
    text: 'Electrical design and installation, power and home automation, surveillance systems, and ICT services: ICT installations, software engineering, web solutions and professional programming.',
    cta: 'Innovation systems',
    to: '/innovation-systems',
    bg: '#01AFEE',
    fg: '#0D1330',
    tint: '#0096CE',
    tintText: '#E3F6FF',
    glow: '#01AFEE',
    buttonBg: '#0D1330',
    buttonFg: '#FFFFFF',
  },
  {
    id: 'property',
    company: 'Daystol Properties',
    legalName: 'Daystol Properties Ltd.',
    title: 'Buildings, managed properly.',
    text: 'Property development, sales and leasing, facility management, short-let apartments and real-estate consultancy.',
    cta: 'Property services',
    to: '/property-services',
    bg: '#D4157A',
    fg: '#FFFFFF',
    tint: '#B0105F',
    tintText: '#FFD6EA',
    glow: '#EB268F',
    buttonBg: '#FFFFFF',
    buttonFg: '#0D1330',
  },
]

/** Projects are grouped by the company that delivered them. */
export const PROJECT_TAG = {
  power: { label: 'Power Services', bg: '#FFE52E', fg: '#0D1330', enquiry: 'quote' },
  innovation: { label: 'Innovation Systems', bg: '#01AFEE', fg: '#0D1330', enquiry: 'consultation' },
  property: { label: 'Properties', bg: '#EB268F', fg: '#FFFFFF', enquiry: 'property' },
}

export const GROUP_SUMMARY =
  'Daystol Group Ltd. is the parent company of Daystol Power Services, Daystol Innovation Systems and Daystol Properties.'

export const NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/power-solutions', label: 'Power solutions' },
  { to: '/innovation-systems', label: 'Innovation systems' },
  { to: '/property-services', label: 'Properties' },
  { to: '/shop', label: 'Shop' },
  { to: '/projects', label: 'Projects' },
  { to: '/support', label: 'Support and maintenance' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]
