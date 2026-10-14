import { useEffect } from 'react'
import Hero from '../components/home/Hero.jsx'
import Marquee from '../components/home/Marquee.jsx'
import CompanyCards from '../components/home/CompanyCards.jsx'
import HowWeWork from '../components/home/HowWeWork.jsx'
import ShopSection from '../components/home/ShopSection.jsx'
import SupportSection from '../components/home/SupportSection.jsx'
import ProjectsSection from '../components/home/ProjectsSection.jsx'
import ClosingCta from '../components/home/ClosingCta.jsx'

export default function Home() {
  useEffect(() => {
    document.title = 'Daystol Group Ltd. | Power, Systems, Property'
  }, [])

  return (
    <>
      <Hero />
      <Marquee />
      <CompanyCards />
      <HowWeWork />
      <ShopSection />
      <SupportSection />
      <ProjectsSection />
      <ClosingCta />
    </>
  )
}
