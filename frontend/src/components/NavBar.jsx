import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/auth.context'

export const NavBar = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="h-16 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-gray-800">
            Nexvia Marketplace
          </Link>

          <div className="flex items-center gap-3 sm:hidden">
            {user ? (
              <>
                <span className="text-gray-700">Welcome, {user.name}</span>
                <button
                  onClick={() => navigate('/profile')}
                  className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm"
                >
                  Profile
                </button>
                <button
                  onClick={() => {
                    // Logout - handled by API
                    window.location.href = '/api/auth/logout'
                  }}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="bg-blue-600 text-white px-4 py-1 rounded text-sm hover:bg-blue-700">
                  Sign In
                </Link>
                <Link to="/register" className="text-blue-600 hover:text-blue-800 text-sm">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-8">
            {user ? (
              <div>
                <a href="/cart" className="text-gray-600 hover:text-gray-800 transition">
                  <svg
                    className="inline-block align-middle -mr-1 h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      d="M13.59 3.69a.75.75 0 0 0-1.06 0l-3.5 3.5a.75.75 0 1 0 1.06 1.06L11 6.07l2.29 2.29a.75.75 0 0 0 1.05-.66l3.5-3.5a.75.75 0 0 0-.64-1.06z"
                    />
                    <path
                      fillRule="evenodd"
                      d="M0 3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V3zM0 4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Cart
                </a>
                {user.cartTotal > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center ml-2">
                    {user.cartTotal}
                  </span>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  )
}