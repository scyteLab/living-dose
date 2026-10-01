import { useContext } from 'react'
import { CartContext } from '@/context/CartContext'

/** { basket, totals, quantityOf, add, setQty, remove, clear, addMany } */
export default function useCart() {
  const value = useContext(CartContext)
  if (!value) throw new Error('useCart must be used inside <CartProvider>')
  return value
}
