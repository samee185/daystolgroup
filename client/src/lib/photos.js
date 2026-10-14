/**
 * Fixed website photos. Save each photo in client/public/images/ under the name shown,
 * then rebuild. Until a file exists, its spot shows a labelled placeholder.
 * Landscape JPGs around 1600px wide (under 500 KB) work best.
 */
export const PHOTOS = {
  // Home page: hero collage and the three company cards
  power: { src: '/images/power.jpg', label: 'Photo: generator or solar installation' },
  innovation: { src: '/images/innovation.jpg', label: 'Photo: smart home, CCTV or control panel' },
  property: { src: '/images/property.jpg', label: 'Photo: modern building or estate' },

  // Company page heroes
  powerHero: { src: '/images/power-hero.jpg', label: 'Photo: generator room or solar roof' },
  innovationHero: { src: '/images/innovation-hero.jpg', label: 'Photo: smart panel, CCTV or server rack' },
  propertyHero: { src: '/images/property-hero.jpg', label: 'Photo: apartment or estate exterior' },

  // Shop categories (used when a category has no image in the admin)
  generators: { src: '/images/shop-generators.jpg', label: 'Photo: diesel generator' },
  solar: { src: '/images/shop-solar.jpg', label: 'Photo: solar panels' },
  stabilizers: { src: '/images/shop-stabilizers.jpg', label: 'Photo: stabilizer or electrical panel' },

  // Innovation Systems "Built for" cards
  homes: { src: '/images/for-homes.jpg', label: 'Photo: smart home' },
  offices: { src: '/images/for-offices.jpg', label: 'Photo: office network' },
  estates: { src: '/images/for-estates.jpg', label: 'Photo: estate gate or control room' },

  // About page
  team: { src: '/images/about-team.jpg', label: 'Photo: team on site or the office' },
}
