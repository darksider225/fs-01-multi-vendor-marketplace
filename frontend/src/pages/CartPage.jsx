import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../contexts/cart.context'
import { useToast } from '../hooks/useToast'

export const CartPage = () => {
  const navigate = useNavigate()
  const { items, total, addItem, removeItem, updateQuantity, clearCart } = useCart()
  const { toast } = useToast()

  const handleRemove = (productId) => {
    removeItem(productId)
    toast({ title: 'Removed', description: 'Item removed from cart', variant: 'success' })
  }

  const handleUpdate = (productId, quantity) => {
    updateQuantity(productId, quantity)
  }

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg p-8 shadow">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Cart</h2>

          {items.length === 0 ? (
            <p className="text-gray-500">Your cart is empty</p>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.productId} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img
                      src={`/uploads/${item.image}`}
                      alt={item.title}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div>
                      <h4 className="font-medium text-gray-900">{item.title}</h4>
                      <p className="text-sm text-gray-500">${item.price.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdate(item.productId, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="bg-white p-2 rounded hover:bg-gray-100 transition"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdate(item.productId, item.quantity + 1)}
                      className="bg-white p-2 rounded hover:bg-gray-100 transition"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-right font-medium">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}

              <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                <span className="text-lg font-medium text-gray-900">Total</span>
                <span className="text-lg font-bold text-blue-600">${total.toFixed(2)}</span>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => navigate('/checkout')}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium text-sm"
                >
                  Proceed to Checkout
                </button>
                <button
                  onClick={() => clearCart()}
                  className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition font-medium text-sm mt-3"
                >
                  Clear Cart
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => clearCart()}
            className="mt-6 w-full bg-red-100 text-red-800 py-3 rounded-lg hover:bg-red-200 transition font-medium text-sm"
            disabled={items.length === 0}
          >
            Clear Cart
          </button>
        </div>
      </div>
    </section>
  )
}