import { useToast } from '../hooks/useToast'

export const Toast = () => {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-6 py-3 rounded-xl max-w-xs shadow-lg ${
            toast.variant === 'success'
              ? 'bg-green-100 text-green-800'
              : toast.variant === 'error'
                ? 'bg-red-100 text-red-800'
                : 'bg-blue-100 text-blue-800'
          }`}
        >
          <div className="flex">
            <span className="mr-3 text-lg">{toast.title}</span>
            <button
              onClick={() => dismiss(toast.id)}
              className="ml-auto text-opacity-50 hover:text-opacity-100"
              aria-label="Dismiss toast"
            >
              &times;
            </button>
          </div>
          {toast.description && <p className="mt-1 text-sm">{toast.description}</p>}
        </div>
      ))}
    </div>
  )
}