import { createContext, useContext, useState } from 'react'

const CartContext = createContext()

const useCart = () => {
  const { items, setItems, total, addItem, removeItem, updateQuantity, clearCart } = useContext(CartContext)
  return { items, setItems, total, addItem, removeItem, updateQuantity, clearCart }
}

const CartProvider = ({ children }) => {
  const [items, setItems] = useState([])

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const addItem = (product) => {
    const existing = items.find((item) => item.productId === product._id)
    if (existing) {
      setItems(
        items.map((item) =>
          item.productId === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      )
    } else {
      setItems([...items, { productId: product._id, title: product.title, price: product.price, quantity: 1 }])
    }
  }

  const removeItem = (productId) => {
    setItems(items.filter((item) => item.productId !== productId))
  }

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      setItems(items.filter((item) => item.productId !== productId))
    } else {
      setItems(
        items.map((item) =>
          item.productId === productId ? { ...item, quantity } : item
        )
      )
    }
  }

  const clearCart = () => setItems([])

  return (
    <CartContext.Provider value={{ items, setItems, total, addItem, removeItem, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  )
)

export { useCart, CartProvider }