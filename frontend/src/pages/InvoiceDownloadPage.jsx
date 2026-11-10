import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useToast } from '../hooks/useToast'
import { useRef } from 'react'

export const InvoiceDownloadPage = () => {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const { toast } = useToast()
  const receiptid = useRef('receipt-' + Date.now())

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${id}`, { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          setOrder(data.order)
        }
      } catch (err) {
        toast({ title: 'Error', description: 'Failed to load order', variant: 'error' })
      }
    }
    fetchOrder()
  }, [id, toast])

  if (!order) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  // Generate and download PDF invoice
  useEffect(() => {
    if (order) {
      const generateInvoice = async () => {
        try {
          const pdfContent = generatePDF(order)
          const blob = new Blob([pdfContent], { type: 'application/pdf' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `invoice-${order.orderNumber}.pdf`
          a.click()
          URL.revokeObjectURL(url)
        } catch (err) {
          toast({ title: 'Error', description: 'Failed to generate invoice', variant: 'error' })
        }
      }
      generateInvoice()
    }
  }, [order])

  const generatePDF = (order) => {
    // Simple PDF content generation
    const { items, totalAmount, orderNumber, placedAt } = order
    let html = ''
    html += `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: A4;
      margin: 40px;
    }
    body {
      font-family: sans-serif;
      line-height: 1.6;
      color: #333;
    }
    .invoice {
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 2px solid #333;
      padding-bottom: 20px;
    }
    .header h1 {
      font-size: 24px;
      margin: 10px 0;
    }
    .header p {
      font-size: 14px;
      color: #666;
    }
    .order-info {
      margin: 20px 0;
    }
    .order-info div {
      margin-bottom: 10px;
    }
    .order-info span {
      font-weight: bold;
    }
    .items table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    .items th, .items td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    .items th {
      background-color: #f5f5f5;
    }
    .total {
      text-align: right;
      margin-top: 20px;
      font-size: 18px;
      font-weight: bold;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
<div class="invoice">
  <div class="header">
    <h1>Invoice</h1>
    <p>Nexvia Multi-Vendor Marketplace</p>
    <p>Order #${order.orderNumber}</p>
  </div>

  <div class="order-info">
    <div><span>Order Number:</span> ${order.orderNumber}</div>
    <div><span>Date:</span> ${new Date(order.placedAt).toLocaleDateString()}</div>
    <div><span>Status:</span> ${order.orderStatus}</div>
    <div><span>Customer:</span> ${order.customer ? order.customer.name : 'N/A'}</div>
  </div>

  <table class="items">
    <thead>
      <tr>
        <th>Product</th>
        <th>Quantity</th>
        <th>Price</th>
      </tr>
    </thead>
    <tbody>
      ${order.items.map((item) => `
        <tr>
          <td>${item.title}</td>
          <td>${item.quantity}</td>
          <td>$${item.price.toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="total">
    Total: $${totalAmount.toFixed(2)}
  </div>

  <div class="footer">
    <p>Thank you for your purchase!</p>
    <p>Nexvia Marketplace | https://nexvia-marketplace.com</p>
  </div>
</div>
</body>
</html>`

    return html
  }, [order])

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg p-8 shadow">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Invoice Download</h2>

          <div className="prose max-w-2xl">
            <p>Invoice for Order #{order.orderNumber}</p>
            <p>Total Amount: ${order.totalAmount.toFixed(2)}</p>
            <p>Status: {order.orderStatus}</p>
            <button
              onClick={() => window.print()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Print Invoice
            </button>
            {/* PDF download button would trigger the useEffect above */}
          </div>
        </div>
      </div>
    </section>
  )
}