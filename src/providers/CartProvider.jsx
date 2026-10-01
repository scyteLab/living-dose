import { useCallback, useEffect, useMemo, useState } from 'react'
import { CartContext } from '@/context/CartContext'
import { addToBasket, basketTotals, setQuantity } from '@/lib/shop/cart'
import { storage } from '@/lib/storage'

const KEY = 'ld.basket'

function readBasket() {
  try {
    return JSON.parse(storage.get(KEY)) ?? {}
  } catch {
    return {}
  }
}

/** The basket, shared by every page and kept on this device between visits. */
export default function CartProvider({ children }) {
  const [basket, setBasket] = useState(readBasket)

  useEffect(() => {
    storage.set(KEY, JSON.stringify(basket))
  }, [basket])

  // Keep several open tabs in step
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === KEY) setBasket(readBasket())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const add = useCallback((id, qty = 1) => setBasket((b) => addToBasket(b, id, qty)), [])
  const setQty = useCallback((id, qty) => setBasket((b) => setQuantity(b, id, qty)), [])
  const remove = useCallback((id) => setBasket((b) => setQuantity(b, id, 0)), [])
  const clear = useCallback(() => setBasket({}), [])
  const addMany = useCallback((items) => setBasket((b) => items.reduce((acc, it) => addToBasket(acc, it.productId, it.qty), b)), [])

  const value = useMemo(
    () => ({ basket, totals: basketTotals(basket), quantityOf: (id) => basket[id] ?? 0, add, setQty, remove, clear, addMany }),
    [basket, add, setQty, remove, clear, addMany],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
