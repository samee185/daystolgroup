import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiPost } from './api.js'

/**
 * The cart lives in this browser only: product ids and quantities, nothing else.
 * Names, prices and stock always come fresh from the server (useCartQuote).
 */

const STORAGE_KEY = 'daystol-cart-v1'
const MAX_QTY = 20

function load() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(parsed)
      ? parsed.filter((i) => /^[a-f0-9]{24}$/.test(i?.id) && Number.isInteger(i?.qty) && i.qty > 0).map((i) => ({ id: i.id, qty: Math.min(MAX_QTY, i.qty) }))
      : []
  } catch {
    return []
  }
}

function save(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // Private browsing or storage full: the cart still works until the tab is closed
  }
}

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState(load)

  useEffect(() => save(items), [items])

  // Keep several open tabs in step
  useEffect(() => {
    const onStorage = (e) => e.key === STORAGE_KEY && setItems(load())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const add = useCallback((id, qty = 1) => {
    setItems((list) => {
      const found = list.find((i) => i.id === id)
      if (found) return list.map((i) => (i.id === id ? { ...i, qty: Math.min(MAX_QTY, i.qty + qty) } : i))
      return [...list, { id, qty: Math.min(MAX_QTY, qty) }]
    })
  }, [])

  const setQty = useCallback((id, qty) => {
    setItems((list) => (qty < 1 ? list.filter((i) => i.id !== id) : list.map((i) => (i.id === id ? { ...i, qty: Math.min(MAX_QTY, qty) } : i))))
  }, [])

  const remove = useCallback((id) => setItems((list) => list.filter((i) => i.id !== id)), [])
  const clear = useCallback(() => setItems([]), [])

  const value = useMemo(() => ({
    items,
    count: items.reduce((n, i) => n + i.qty, 0),
    add,
    setQty,
    remove,
    clear,
  }), [items, add, setQty, remove, clear])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>')
  return ctx
}

/** Live prices, stock and delivery options for the current cart. Re-checked every minute. */
export function useCartQuote(items) {
  return useQuery({
    queryKey: ['cart-quote', items],
    queryFn: () => apiPost('/cart/quote', { items }),
    enabled: items.length > 0,
    refetchInterval: 60_000,
    placeholderData: (previous) => previous,
  })
}

export { MAX_QTY }
