import { useEffect } from 'react'

const SITE = 'Daystol Group Ltd.'
const DEFAULT_DESCRIPTION =
  'Daystol Group Ltd. is the parent of Daystol Power Services, Innovation Systems, Property and Development Concept, serving Lagos, Abuja and all of Nigeria.'

/**
 * Set the browser tab title and the meta description for the current page.
 * A title that already contains " | " is used as it is; others get " | Daystol Group Ltd." added.
 * Keep these in step with the titles the server sends (server/src/lib/seo.js).
 */
export function usePageMeta(title, description = DEFAULT_DESCRIPTION) {
  useEffect(() => {
    document.title = !title ? `${SITE} | Power, ICT, Property and Construction in Nigeria` : title.includes(' | ') ? title : `${title} | ${SITE}`
    let tag = document.querySelector('meta[name="description"]')
    if (!tag) {
      tag = document.createElement('meta')
      tag.setAttribute('name', 'description')
      document.head.appendChild(tag)
    }
    tag.setAttribute('content', description)
  }, [title, description])
}
