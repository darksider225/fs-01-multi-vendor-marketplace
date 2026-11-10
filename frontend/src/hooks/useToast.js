import { useEffect, useState } from 'react'

export const useToast = () => {
  const [toasts, setToasts] = useState([])

  const toast = (options) => {
    const id = Date.now()
    const { title, description, variant = 'default' } = options
    const newToast = { id, title, description, variant }
    setToasts((prev) => [...prev, newToast])

    // Auto-remove after 5 seconds
    const timeout = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)

    return () => clearTimeout(timeout)
  }

  const dismiss = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return { toasts, toast, dismiss }
}