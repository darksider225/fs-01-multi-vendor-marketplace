import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useProduct } from '../services/product.service'
import { useToast } from '../hooks/useToast'

export const SearchPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const { products, loading, error } = useProduct()
  const { toast } = useToast()

  useEffect(() => {
    const loadSearch = async () => {
      try {
        await products.fetchProducts(query)
      } catch (err) {
        toast({ title: 'Error', description: 'Search failed', variant: 'error' })
      }
    }
    loadSearch()
  }, [products, query, toast])

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (error) return <div className="p-8">Error: {error}</div>

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            Search results for{" "}
            <span className="text-blue-600">{query || 'nothing'}</span>
          </h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product._id}
              className="bg-white rounded-lg overflow-shadow-sm hover:shadow-md transition-shadow"
            >
              <img
                src={`/uploads/${product.image}`}
                alt={product.title}
                className="w-full h-48 object-cover rounded-t-lg"
              />
              <div className="p-4">
                <h3 className="text-lg font-medium text-gray-900 line-clamp-2">
                  {product.title}
                </h3>
                <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                  ${product.price.toFixed(2)}
                </p>
                <div className="mt-3">
                  <button
                    onClick={() => navigate(`/product/${product._id}`)}
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition text-sm font-medium"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}