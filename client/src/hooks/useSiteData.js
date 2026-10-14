import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiGet } from '../lib/api.js'

/** Contact details from Site Settings in the admin. Used by the header, footer and quick actions. */
export const useSettings = () =>
  useQuery({ queryKey: ['settings'], queryFn: () => apiGet('/settings'), staleTime: 5 * 60_000 })

export const useCategories = () =>
  useQuery({ queryKey: ['categories'], queryFn: () => apiGet('/categories'), staleTime: 5 * 60_000 })

/** Product lists keep showing the previous page while the next one loads (no flashing). */
export const useProducts = (params = {}) =>
  useQuery({ queryKey: ['products', params], queryFn: () => apiGet('/products', params), placeholderData: keepPreviousData })

/** One product. Re-checked every minute so price and stock stay current while the page is open. */
export const useProduct = (slug) =>
  useQuery({ queryKey: ['product', slug], queryFn: () => apiGet(`/products/${slug}`), enabled: Boolean(slug), refetchInterval: 60_000 })

/** Services of one Daystol company: 'power', 'innovation' or 'property'. */
export const useServices = (company) =>
  useQuery({ queryKey: ['services', company], queryFn: () => apiGet('/services', { company }) })

export const useProjects = (params = {}) =>
  useQuery({ queryKey: ['projects', params], queryFn: () => apiGet('/projects', params), placeholderData: keepPreviousData })

export const useProject = (slug) =>
  useQuery({ queryKey: ['project', slug], queryFn: () => apiGet(`/projects/${slug}`), enabled: Boolean(slug) })

export const useTeam = () => useQuery({ queryKey: ['team'], queryFn: () => apiGet('/team') })

/** Turn "+234 801 234 5678" into a tel: link. */
export const telHref = (phone) => (phone ? `tel:${phone.replace(/[^+\d]/g, '')}` : null)

export const whatsappHref = (number, text = 'Hello Daystol, I would like to make an enquiry.') =>
  number ? `https://wa.me/${number}?text=${encodeURIComponent(text)}` : null

export const usePmcPackages = () =>
  useQuery({ queryKey: ['pmc-packages'], queryFn: () => apiGet('/pmc-packages'), staleTime: 5 * 60_000 })
