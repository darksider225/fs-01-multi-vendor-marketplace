import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useToast } from '../hooks/useToast'

export const ProfilePage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const userId = searchParams.get('id') || 'me'
  const [user, setUser] = useState(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/users/${userId}`, { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
        }
      } catch (err) {
        toast({ title: 'Error', description: 'Failed to load profile', variant: 'error' })
      }
    }
    fetchUser()
  }, [userId, toast])

  if (!user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg p-8 shadow">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-gray-600">{user.email}</p>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Order History</h3>
            {user.orders && user.orders.length > 0 ? (
              <ul className="space-y-3 text-gray-700">
                {user.orders.map((order) => (
                  <li key={order._id}>
                    <a href={`/order/${order._id}`} className="hover:text-blue-600 transition">
                      Order {order.orderNumber} - ${order.totalAmount.toFixed(2)}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No orders found</p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}