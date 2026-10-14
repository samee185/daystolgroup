/**
 * Business terms used on the Terms, Returns and Privacy pages.
 * These are sensible defaults for a Nigerian equipment seller. Confirm each one with Daystol
 * (and ideally a lawyer) before launch; change them here and every page updates.
 */
export const POLICY = {
  lastUpdated: '12 October 2026',
  seller: 'Daystol Power Services Ltd.',
  group: 'Daystol Group Ltd.',
  rc: 'RC 9511880',

  damageReportHours: 48, // report damaged, wrong or missing items within this time of delivery or pickup
  changeOfMindDays: 7, // unused items in original packaging can be returned within this many days
  refundWorkingDays: 10, // refunds are sent within this many working days of approval

  // How long records are kept
  enquiryRetention: 'two years after the enquiry or fault report is closed',
  orderRetention: 'for as long as Nigerian tax and accounting law requires',
}
