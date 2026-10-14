import { useEffect } from 'react'
import { Link } from 'react-router'

export default function NotFound() {
  useEffect(() => {
    document.title = 'Page not found | Daystol Group Ltd.'
  }, [])

  return (
    <section className="mx-auto flex max-w-xl flex-col items-center gap-4 px-6 py-24 text-center">
      <span className="pop-in font-display text-6xl font-extrabold text-at-innovation" aria-hidden="true">404</span>
      <h1 className="m-0 font-display text-2xl font-extrabold sm:text-[34px]">Page not found</h1>
      <p className="m-0 text-mist">The page you were looking for doesn't exist or has moved.</p>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <Link to="/" className="press rounded-full bg-action px-6 py-3 font-bold text-white hover:text-white">Go to the homepage</Link>
        <Link to="/shop" className="press rounded-full border border-line px-6 py-3 font-bold text-fg hover:text-fg">Visit the shop</Link>
      </div>
    </section>
  )
}
