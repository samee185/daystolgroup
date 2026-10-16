import { Link } from 'react-router'
import LegalLayout, { ContactLine } from '../components/LegalLayout.jsx'
import { POLICY } from '../lib/policies.js'
import { usePageMeta } from '../hooks/usePageMeta.js'

const sections = [
  {
    id: 'who',
    heading: 'Who we are',
    body: (
      <>
        <p>
          This website is run by <strong>{POLICY.group}</strong> ({POLICY.rc}), the parent company of Daystol Power Services Ltd.,
          Daystol Innovation Systems Ltd., Daystol Property Ltd. and Daystol Development Concept Ltd. ("Daystol", "we", "us"). We are the data controller for the
          personal data collected through this website.
        </p>
        <p>
          We handle personal data in line with the <strong>Nigeria Data Protection Act 2023</strong> (NDPA). This policy explains
          what we collect, why, who we share it with and the rights you have.
        </p>
      </>
    ),
  },
  {
    id: 'collect',
    heading: 'What we collect',
    body: (
      <>
        <p>We only collect what you give us through our forms and what we need to run the website safely:</p>
        <ul>
          <li><strong>Enquiries</strong> (Contact page): your name, phone number, email, organisation, the subject and your message, and how you'd like us to reply.</li>
          <li><strong>Fault reports</strong> (Support page): your name, phone number, email, the site address, details of the equipment and the fault, and any photos you upload.</li>
          <li><strong>Orders</strong> (Shop): your name, email, phone number, delivery address, what you bought and your payment status.</li>
          <li><strong>Technical information</strong>: your IP address and basic request details, kept briefly in server logs to protect the website from abuse.</li>
        </ul>
        <p>
          <strong>Card details:</strong> payments are processed by Paystack on their own secure page. We never see or store your card
          number, PIN or bank login.
        </p>
      </>
    ),
  },
  {
    id: 'why',
    heading: 'Why we use it',
    body: (
      <ul>
        <li><strong>To do what you asked</strong>: reply to enquiries, send engineers for fault reports, and process, deliver and support your orders. The legal basis is the contract with you, or the steps you asked us to take before one.</li>
        <li><strong>To keep records</strong> of sales, as tax and accounting law requires (legal obligation).</li>
        <li><strong>To keep the website secure</strong> and prevent fraud and spam (our legitimate interests).</li>
        <li><strong>Marketing</strong>: we do not send marketing messages unless you have agreed to receive them, and you can opt out at any time (consent).</li>
      </ul>
    ),
  },
  {
    id: 'share',
    heading: 'Who we share it with',
    body: (
      <>
        <p>We do not sell your personal data. We share it only with service providers who help us run the website, under contracts that require them to protect it:</p>
        <ul>
          <li><strong>Paystack</strong>: to take payments.</li>
          <li><strong>MongoDB Atlas</strong>: secure database hosting for our records.</li>
          <li><strong>Cloudinary</strong>: storage for photos uploaded with fault reports and product images.</li>
          <li><strong>Hostinger</strong>: website hosting and our email service.</li>
        </ul>
        <p>
          Some of these providers store data on servers outside Nigeria. Where that happens, we rely on the safeguards the NDPA allows,
          such as the provider's contractual and security commitments. We may also disclose information where the law requires it,
          for example to a court or regulator.
        </p>
      </>
    ),
  },
  {
    id: 'keep',
    heading: 'How long we keep it',
    body: (
      <ul>
        <li>Enquiries and fault reports: {POLICY.enquiryRetention}.</li>
        <li>Orders and payment records: {POLICY.orderRetention}.</li>
        <li>Server logs: a short period, for security only.</li>
      </ul>
    ),
  },
  {
    id: 'storage',
    heading: 'Cookies and browser storage',
    body: (
      <>
        <p>
          We don't use advertising or tracking cookies. Your shopping cart is saved in your own browser (local storage) so it is still
          there when you come back; it only contains product IDs and quantities, and you can clear it by emptying your cart or your
          browser data. Our staff dashboard uses a login cookie, which is only set for Daystol staff.
        </p>
      </>
    ),
  },
  {
    id: 'rights',
    heading: 'Your rights',
    body: (
      <>
        <p>Under the NDPA you can ask us to:</p>
        <ul>
          <li>give you a copy of the personal data we hold about you;</li>
          <li>correct data that is wrong or incomplete;</li>
          <li>delete your data, where we no longer need to keep it;</li>
          <li>restrict or stop certain uses of it, or object to them;</li>
          <li>send your data to you or another organisation in a common format;</li>
          <li>withdraw consent you have given, at any time.</li>
        </ul>
        <p>
          To make a request, <ContactLine />. We will reply within the time the law sets. If you are unhappy with how we handled your
          data, you can complain to the <strong>Nigeria Data Protection Commission</strong> (NDPC).
        </p>
      </>
    ),
  },
  {
    id: 'security',
    heading: 'How we protect it',
    body: (
      <p>
        The website uses encrypted connections (HTTPS). Staff access to records is password-protected and limited by role, and our
        providers secure the data they hold for us. No system is perfectly secure, but we work to protect your data and will tell you
        and the NDPC about a serious breach as the law requires.
      </p>
    ),
  },
  {
    id: 'changes',
    heading: 'Changes and contact',
    body: (
      <p>
        We may update this policy; the date at the top shows the latest version. Questions about your data? <ContactLine />.
        For orders, see also our <Link to="/terms">Terms of sale</Link> and <Link to="/returns">Returns and refunds</Link>.
      </p>
    ),
  },
]

export default function Privacy() {
  usePageMeta('Privacy policy', 'How Daystol Group Ltd. collects, uses and protects your personal data under the Nigeria Data Protection Act 2023.')
  return <LegalLayout title="Privacy policy" intro="What personal data we collect through this website, why, and the rights you have." sections={sections} />
}
