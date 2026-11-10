import axios from '../services/api.service'

// Analytics service
export const useAnalytics = () => {
  const [stats, setStats] = useState({
    monthlyRevenue: [],
    topProducts: [],
    topVendors: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/analytics/dashboard')
      setStats(res.data.stats)
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to fetch analytics')
    } finally {
      setLoading(false)
    }
  }

  return { stats, loading, error, fetchStats }
}