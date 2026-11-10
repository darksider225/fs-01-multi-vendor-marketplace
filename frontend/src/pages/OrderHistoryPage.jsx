import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useToast } from '../hooks/useToast'

export const OrderHistoryPage = () => {
  const [searchParams] = useSearchParams()
  const userId = searchParams.get('id') || 'me'
  const [orders, setOrders] = useState([])
  const { toast } = useToast()

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch(`/api/orders/user/${userId}`, { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          setOrders(data.orders)
        }
      } catch (err) {
        toast({ title: 'Error', description: 'Failed to load orders', variant: 'error' })
      }
    }
    fetchOrders()
  }, [userId, toast])

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg p-8 shadow">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Order History</h2>
          {orders.length === 0 ? (
            <p className="text-gray-500">No orders found</p>
          ) : (
            <ul className="space-y-4">
              {orders.map((order) => (
                <li key={order._id} className="p-4 border-b border-gray-200 last:border-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">Order {order.orderNumber}</h4>
                      <p className="text-sm text-gray-500">Status: {order.orderStatus}</p>
                      <p className="text-sm text-gray-500">Total: ${order.totalAmount.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <a href={`/order/${order._id}`} className="text-blue-600 hover underline">
                        View Details
                      </a>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}