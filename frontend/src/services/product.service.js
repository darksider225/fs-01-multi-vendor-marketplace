import axios from '../services/api.service'

// Product service
export const useProduct = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchProducts = async (query) => {
    setLoading(true)
    try {
      const res = await axios.get(`/products?${query || ''}`)
      setProducts(res.data.products)
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }

  const fetchProduct = async (id) => {
    setLoading(true)
    try {
      const res = await axios.get(`/products/${id}`)
      return res.data.product
    } catch (err) {
      setError(err.message || 'Failed to fetch product')
    } finally {
      setLoading(false)
    }
  }

  const fetchProductsByCategory = async (category, query) => {
    setLoading(true)
    try {
      const res = await axios.get(`/products/category/${category}?q=${query}`)
      setProducts(res.data.products)
    } catch (err) {
      setError(err.message || 'Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }

  return { products, loading, error, fetchProducts, fetchProduct, fetchProductsByCategory }
}