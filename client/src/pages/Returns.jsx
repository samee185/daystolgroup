import { Link } from 'react-router'
import LegalLayout, { ContactLine } from '../components/LegalLayout.jsx'
import { POLICY } from '../lib/policies.js'
import { usePageMeta } from '../hooks/usePageMeta.js'

const sections = [
  {
    id: 'cancel',
    heading: 'Cancelling an order',
    body: (
      <p>
        You can cancel a paid order at any time before it is delivered or collected, for a full refund. <ContactLine /> with your
        order number (it starts with OR-).
      </p>
    ),
  },
  {
    id: 'damaged',
    heading: 'Damaged, wrong or missing items',
    body: (
      <>
        <p>
          Please check your order when you receive it and tell us within <strong>{POLICY.damageReportHours} hours</strong> if anything is
          damaged, wrong or missing. Photos help us sort it out quickly. We will repair, replace or refund, at no cost to you, including
          collection.
        </p>
      </>
    ),
  },
  {
    id: 'faulty',
    heading: 'Faulty products',
    body: (
      <p>
        If a product develops a fault, <Link to="/support">report it on our Support page</Link> or contact us. We will inspect it and,
        if it is covered by the warranty or the law, repair it, replace it or give you a refund. See our{' '}
        <Link to="/terms#warranty">warranty terms</Link>.
      </p>
    ),
  },
  {
    id: 'change',
    heading: 'Changed your mind',
    body: (
      <ul>
        <li>You can return an item within <strong>{POLICY.changeOfMindDays} days</strong> of delivery or collection if it is unused, uninstalled and in its original, undamaged packaging.</li>
        <li>You pay the cost of returning it to us, or we can collect it for an agreed fee.</li>
        <li>Items that have been installed or used, or that were specially ordered for you, cannot be returned for a change of mind. Your rights for faulty items are not affected.</li>
      </ul>
    ),
  },
  {
    id: 'refunds',
    heading: 'How refunds are paid',
    body: (
      <ul>
        <li>Refunds go back to the card or account you paid with, through Paystack.</li>
        <li>We send refunds within <strong>{POLICY.refundWorkingDays} working days</strong> of approving them. Your bank may take a few more days to show the money.</li>
        <li>For a change-of-mind return, we refund once we have received and checked the item.</li>
      </ul>
    ),
  },
  {
    id: 'contact',
    heading: 'Start a return',
    body: (
      <p>
        To start a return or ask about a refund, <ContactLine />, quoting your order number. These terms sit alongside our{' '}
        <Link to="/terms">Terms of sale</Link> and do not affect your legal rights as a consumer.
      </p>
    ),
  },
]

export default function Returns() {
  usePageMeta('Returns and refunds', 'How returns, cancellations and refunds work for orders from the Daystol Group online shop.')
  return <LegalLayout title="Returns and refunds" intro="How cancellations, returns and refunds work for shop orders." sections={sections} />
}
