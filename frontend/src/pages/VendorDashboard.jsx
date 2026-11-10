import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useToast } from '../hooks/useToast'

export const VendorDashboard = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const vendorId = searchParams.get('id')
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
  })
  const { toast } = useToast()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/vendors/${vendorId}/stats`, {
          credentials: 'include',
        })
        if (res.ok) {
          const data = await res.json()
          setStats(data.stats)
        }
      } catch (err) {
        toast({ title: 'Error', description: 'Failed to load vendor stats', variant: 'error' })
      }
    }
    fetchStats()
  }, [vendorId, toast])

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-lg p-8 shadow">
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Total Orders</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.totalOrders}</p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Pending Orders</h3>
              <p className="text-3xl font-bold text-yellow-600">{stats.pendingOrders}</p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Completed Orders</h3>
              <p className="text-3xl font-bold text-green-600">{stats.completedOrders}</p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Total Revenue</h3>
              <p className="text-3xl font-bold text-green-600">${stats.totalRevenue.toFixed(2)}</p>
            </div>
          </div>

          {/* Orders table would go here */}
          {/* Products management would go here */}
        </div>
      </div>
    </section>
  )
}