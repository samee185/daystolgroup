import { Link } from 'react-router'
import LegalLayout, { ContactLine } from '../components/LegalLayout.jsx'
import { POLICY } from '../lib/policies.js'
import { usePageMeta } from '../hooks/usePageMeta.js'

const sections = [
  {
    id: 'about',
    heading: 'About these terms',
    body: (
      <>
        <p>
          These terms apply when you buy from the online shop on this website. Products are sold by <strong>{POLICY.seller}</strong>,
          part of {POLICY.group} ({POLICY.rc}). By placing an order you agree to these terms and to our{' '}
          <Link to="/returns">Returns and refunds</Link> policy.
        </p>
        <p>Nothing in these terms affects your rights under the Federal Competition and Consumer Protection Act 2018 or other Nigerian law.</p>
      </>
    ),
  },
  {
    id: 'prices',
    heading: 'Prices',
    body: (
      <ul>
        <li>Prices are in Nigerian naira (₦) and include VAT.</li>
        <li>Sale prices apply only during the dates shown on the product page.</li>
        <li>The price you pay is the total shown on the checkout page when you pay. If a price changes while you are checking out, we show you the new total before you pay.</li>
        <li>Delivery is charged as shown at checkout. Where no delivery fee is shown, we agree the delivery cost with you after payment, and it is paid separately.</li>
        <li>Installation is not included in the product price unless the product page says so. We will quote for it separately.</li>
      </ul>
    ),
  },
  {
    id: 'orders',
    heading: 'Orders and payment',
    body: (
      <ul>
        <li>Your order is confirmed when your payment is confirmed. You will see a confirmation page and receive a receipt by email.</li>
        <li>Payments are processed securely by Paystack (card, bank transfer or USSD). We never see your card details.</li>
        <li>Stock is shown live, but in rare cases an item can sell out at the same moment you pay. If that happens we will contact you and offer a full refund or a new delivery date.</li>
        <li>If there is an obvious error in a price or description, we will contact you before processing the order and you may cancel for a full refund.</li>
        <li>Some high-value products are sold by quote only. Those orders are agreed directly with our team, not through the online checkout.</li>
      </ul>
    ),
  },
  {
    id: 'delivery',
    heading: 'Pickup and delivery',
    body: (
      <ul>
        <li>You can collect your order from our office or choose delivery at checkout. We will call you to arrange a time.</li>
        <li>Delivery dates we give are estimates. We will tell you promptly about any delay.</li>
        <li>Please check your items when you receive them. Report anything damaged, wrong or missing within {POLICY.damageReportHours} hours (see <Link to="/returns">Returns and refunds</Link>).</li>
        <li>Responsibility for the goods passes to you when they are delivered to you or collected.</li>
      </ul>
    ),
  },
  {
    id: 'warranty',
    heading: 'Warranty and installation',
    body: (
      <ul>
        <li>Products come with the manufacturer's warranty where one is provided. We will help you make a warranty claim.</li>
        <li>Warranties usually require correct installation and use. We recommend installation by Daystol engineers or another qualified technician.</li>
        <li>Faults caused by wrong installation by others, misuse, power surges, accidents or normal wear are not covered.</li>
      </ul>
    ),
  },
  {
    id: 'liability',
    heading: 'Our responsibility to you',
    body: (
      <p>
        We are responsible for losses that are a foreseeable result of us breaking these terms or failing to use reasonable care.
        As far as the law allows, we are not responsible for indirect losses such as lost business or profit. Nothing in these
        terms limits our responsibility where the law does not allow it to be limited.
      </p>
    ),
  },
  {
    id: 'law',
    heading: 'Law, changes and contact',
    body: (
      <p>
        These terms are governed by the laws of the Federal Republic of Nigeria. We may update them; the version on this page when
        you place your order applies to that order. Questions? <ContactLine />.
      </p>
    ),
  },
]

export default function Terms() {
  usePageMeta('Terms of sale', 'Terms for buying from the Daystol Group online shop.')
  return <LegalLayout title="Terms of sale" intro="The terms that apply when you buy from the Daystol online shop." sections={sections} />
}
