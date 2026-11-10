import { BrowserRouter as Router, Routes, Route, Link, Outlet } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FormProvider } from 'react-hook-form'
import { authInterceptor } from './services/api.service'
import { useSession } from './contexts/auth.context'
import { CartProvider } from './contexts/cart.context'
import './index.css'

// Configure React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
    },
    mutations: {
      retry: 2,
    },
  },
})

// Set up Axios interceptor for auth
const setupApi = () => {
  authInterceptor()
}

setupApi()

export default function App() {
  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <CartProvider>

          <nav className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4">
              <div className="h-16 flex items-center justify-between">
                <Link to="/" className="text-2xl font-bold text-gray-800">
                  Nexvia Marketplace
                </Link>
                <div className="hidden sm:flex items-center gap-8">
                  <Link to="/products" className="text-gray-600 hover:text-gray-800 transition">
                    Products
                  </Link>
                  <Link to="/cart" className="text-gray-600 hover:text-gray-800 transition">
                    Cart
                  </Link>
                  {/* Auth links will be shown based on session */}
                </div>
              </div>
            </div>
          </nav>

          <main className="min-h-screen">
            <div className="max-w-7xl mx-auto p-4">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/products" element={<ProductListingPage />} />
                <Route path="/product/:id" element={<ProductDetailPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/category/:slug" element={<CategoryPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/orders" element={<OrderHistoryPage />} />
                <Route path="/order/:id" element={<OrderDetailPage />} />
                <Route path="/invoice/:id" element={<InvoiceDownloadPage />} />
                <Route path="/vendor/dashboard" element={<VendorDashboard />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
              </Routes>
            </div>
          </main>
        </CartProvider>
      </QueryClientProvider>
    </Router>
  )
}