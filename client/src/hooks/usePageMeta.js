import { useEffect } from 'react'

const SITE = 'Daystol Group Ltd.'
const DEFAULT_DESCRIPTION =
  'Daystol Group Ltd. is the parent company of Daystol Power Services, Daystol Innovation Systems and Daystol Properties.'

/** Set the browser tab title and the meta description for the current page. */
export function usePageMeta(title, description = DEFAULT_DESCRIPTION) {
  useEffect(() => {
    document.title = title ? `${title} | ${SITE}` : `${SITE} | Power, Systems, Property`
    let tag = document.querySelector('meta[name="description"]')
    if (!tag) {
      tag = document.createElement('meta')
      tag.setAttribute('name', 'description')
      document.head.appendChild(tag)
    }
    tag.setAttribute('content', description)
  }, [title, description])
}
