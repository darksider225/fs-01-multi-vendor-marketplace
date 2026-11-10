import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useProduct } from '../services/product.service'
import { useToast } from '../hooks/useToast'

export const ProductDetailPage = () => {
  const { id } = useParams()
  const { product, loading, error } = useProduct(id)
  const { toast } = useToast()

  useEffect(() => {
    if (product) {
      const loadProduct = async () => {
        try {
          await product.fetchDetail()
        } catch (err) {
          toast({ title: 'Error', description: 'Failed to load product', variant: 'error' })
        }
      }
      loadProduct()
    }
  }, [product, toast])

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (error) return <div className="p-8">Error: {error}</div>
  if (!product) return <div className="p-8">Product not found</div>

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <img
              src={`/uploads/${product.image}`}
              alt={product.title}
              className="w-full h-80 object-cover rounded-lg"
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{product.title}</h1>
            <p className="mt-2 text-xl text-blue-600">${product.price.toFixed(2)}</p>
            <p className="mt-4 text-gray-600">{product.description}</p>
            <div className="mt-6">
              <button
                onClick={() => navigator.clipboard.writeText(`/product/${product._id}`)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-300 transition"
                title="Copy product link"
              >
                Copy Link
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}