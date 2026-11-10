import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useToast } from '../hooks/useToast'
import { useAnalytics } from '../services/analytics.service'
import Chart from 'react-chartjs-2'

export const AdminDashboard = () => {
  const navigate = useNavigate()
  const { stats, loading, error } = useAnalytics()
  const { toast } = useToast()

  useEffect(() => {
    const loadStats = async () => {
      try {
        await stats.fetchStats()
      } catch (err) {
        toast({ title: 'Error', description: 'Failed to load analytics', variant: 'error' })
      }
    }
    loadStats()
  }, [stats, toast])

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (error) return <div className="p-8">Error: {error}</div>

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-lg p-8 shadow mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Dashboard Overview</h2>

          {/* Revenue Chart */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Revenue</h3>
            <Chart
              data={{
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [
                  {
                    label: 'Revenue',
                    data: stats.monthlyRevenue || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                    borderColor: 'blue',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.1,
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    mode: 'index',
                    intersect: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: (value) => `$${value}`,
                    },
                  },
                },
              }}
              type='line'
            />
          </div>

          {/* Top Products */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Products</h3>
            <ul className="space-y-2 text-gray-700">
              {stats.topProducts && stats.topProducts.length > 0 ? (
                stats.topProducts.map((product) => (
                  <li key={product.id} className="flex items-center justify-between">
                    <span>{product.name}</span>
                    <span>${product.revenue.toFixed(2)}</span>
                  </li>
                ))
              ) : (
                <li>No data available</li>
              )}
            </ul>
          </div>

          {/* Top Vendors */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Vendors</h3>
            <ul className="space-y-2 text-gray-700">
              {stats.topVendors && stats.topVendors.length > 0 ? (
                stats.topVendors.map((vendor) => (
                  <li key={vendor.id} className="flex items-center justify-between">
                    <span>{vendor.name}</span>
                    <span>${vendor.revenue.toFixed(2)}</span>
                  </li>
                ))
              ) : (
                <li>No data available</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}