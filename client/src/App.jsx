import { Navigate, Route, Routes } from 'react-router'
import SiteLayout from './components/layout/SiteLayout.jsx'
import Home from './pages/Home.jsx'
import ServicePage from './pages/ServicePage.jsx'
import Shop from './pages/Shop.jsx'
import Product from './pages/Product.jsx'
import Projects from './pages/Projects.jsx'
import ProjectDetail from './pages/ProjectDetail.jsx'
import About from './pages/About.jsx'
import Contact from './pages/Contact.jsx'
import Support from './pages/Support.jsx'
import Cart from './pages/Cart.jsx'
import Checkout from './pages/Checkout.jsx'
import Order from './pages/Order.jsx'
import Privacy from './pages/Privacy.jsx'
import Terms from './pages/Terms.jsx'
import Returns from './pages/Returns.jsx'
import NotFound from './pages/NotFound.jsx'
import SystemCheck from './pages/SystemCheck.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<Home />} />
        <Route path="power-solutions" element={<ServicePage key="power" companyId="power" />} />
        <Route path="innovation-systems" element={<ServicePage key="innovation" companyId="innovation" />} />
        <Route path="property-services" element={<ServicePage key="property" companyId="property" />} />
        {/* Older addresses, in case anyone saved them */}
        <Route path="electrical-automation" element={<Navigate to="/power-solutions" replace />} />
        <Route path="ict-services" element={<Navigate to="/innovation-systems" replace />} />
        <Route path="shop" element={<Shop />} />
        <Route path="shop/:slug" element={<Product />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="order/:reference" element={<Order />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:slug" element={<ProjectDetail />} />
        <Route path="about" element={<About />} />
        <Route path="support" element={<Support />} />
        <Route path="contact" element={<Contact />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="terms" element={<Terms />} />
        <Route path="returns" element={<Returns />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      {/* Developer check from Milestone 1 */}
      <Route path="system-check" element={<SystemCheck />} />
    </Routes>
  )
}
