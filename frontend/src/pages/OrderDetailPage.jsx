import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useToast } from '../hooks/useToast'

export const OrderDetailPage = () => {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${id}`, { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          setOrder(data.order)
        }
      } catch (err) {
        toast({ title: 'Error', description: 'Failed to load order', variant: 'error' })
      }
    }
    fetchOrder()
  }, [id, toast])

  if (!order) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg p-8 shadow">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Details</h2>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div>
              <p className="text-sm text-gray-500">Order Number</p>
              <p className="font-medium text-gray-900">{order.orderNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-medium text-gray-900">
                {new Date(order.placedAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <span
                className={`px-2 py-1 rounded text-sm ${
                  order.orderStatus === 'delivered'
                    ? 'bg-green-100 text-green-800'
                    : order.orderStatus === 'cancelled'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-blue-100 text-blue-800'
                }`}
              >
                {order.orderStatus}
              </span>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500">Items</p>
            <ul className="space-y-2 text-gray-700">
              {order.items.map((item) => (
                <li key={item._id} className="flex justify-between">
                  <span className="font-medium">{item.title}</span>
                  <span className="text-right">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-right font-medium">Total: ${order.totalAmount.toFixed(2)}</p>
          </div>

          <div className="mt-8">
            <button
              onClick={() => window.print()}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition"
            >
              Print Invoice
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}