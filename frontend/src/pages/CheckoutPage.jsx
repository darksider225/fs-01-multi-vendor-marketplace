import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/cart.context';
import { useAuth } from '../contexts/auth.context';
import { useToast } from '../hooks/useToast';

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();

  const [form, setForm] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
    phone: '',
    line2: '',
    paymentMethod: 'razorpay',
  });

  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [razorpayPaymentId, setRazorpayPaymentId] = useState('');
  const [razorpaySignature, setRazorpaySignature] = useState('');

  const shippingAddress = {
    fullName: form.fullName,
    phone: form.phone || '',
    line1: form.address,
    line2: form.line2 || '',
    city: form.city,
    state: form.state,
    pincode: form.postalCode,
    country: form.country,
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleCouponChange = (e) => {
    setCouponCode(e.target.value);
  };

  const calculateTotal = () => Math.max(total - discount, 0).toFixed(2);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);

      // Step 1: Create order from Cart (backend reads cart items from DB)
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingAddress,
          paymentMethod: form.paymentMethod,
        }),
        credentials: 'include',
      });

      if (!orderRes.ok) {
        const err = await orderRes.json();
        throw new Error(err.message || 'Failed to create order');
      }

      const orderData = await orderRes.json();
      const order = orderData.order;

      // Step 2: If Razorpay, create Razorpay order
      if (form.paymentMethod === 'razorpay') {
        const razorpayRes = await fetch('/api/payments/checkout/razorpay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: Math.round(order.totalAmount * 100), // amount in paise
            currency: 'INR',
          }),
          credentials: 'include',
        });

        if (!razorpayRes.ok) {
          const err = await razorpayRes.json();
          throw new Error(err.message || 'Failed to create Razorpay order');
        }

        const razorpayData = await razorpayRes.json();

        // Step 3: Open Razorpay Checkout
        if (typeof window.Razorpay !== 'undefined') {
          const rzp = new window.Razorpay({
            key: razorpayData.key,
            amount: razorpayData.amount,
            currency: razorpayData.currency,
            order_id: razorpayData.razorpayOrderId,
            name: 'Nexvia Marketplace',
            description: `Order #${order.orderNumber}`,
            image: '',
            handler: async function (response) {
              setRazorpayPaymentId(response.razorpay_payment_id);
              setRazorpaySignature(response.razorpay_signature);

              // Verify payment
              const verifyRes = await fetch('/api/payments/verify/razorpay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
                credentials: 'include',
              });

              if (verifyRes.ok) {
                toast({
                  title: 'Payment Verified',
                  description: 'Payment successful. Order placed.',
                  variant: 'success',
                });
                clearCart();
                navigate(`/orders/${order._id}`);
              } else {
                toast({
                  title: 'Payment Failed',
                  description: 'Payment verification failed.',
                  variant: 'error',
                });
              }
            },
            prefill: {
              name: form.fullName,
              email: form.email,
              contact: form.phone || '',
            },
            theme: { color: '#2563eb' },
          });
          rzp.open();
        } else {
          throw new Error('Razorpay SDK not loaded');
        }
      } else {
        // Stripe or other payment - no Razorpay flow
        toast({
          title: 'Order Placed',
          description: 'Order created successfully.',
          variant: 'success',
        });
        clearCart();
        navigate(`/orders/${order._id}`);
      }
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const applyCoupon = async () => {
    if (!couponCode) return;
    try {
      const res = await fetch('/api/coupons/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ couponCode: couponCode }),
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setDiscount(data.orderDiscount || 0);
        toast({ title: 'Coupon Applied', description: `Discount: ₹${data.orderDiscount}`, variant: 'success' });
      } else {
        const err = await res.json();
        toast({ title: 'Invalid Coupon', description: err.message || 'Coupon not valid', variant: 'error' });
      }
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'error' });
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setDiscount(0);
  };

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg p-8 shadow">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Cart Summary */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Cart Summary</h3>
              {items.length === 0 ? (
                <p className="text-gray-500">Your cart is empty</p>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.productId} className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{item.title}</h4>
                        <p className="text-sm text-gray-500">₹{item.price.toFixed(2)} × {item.quantity}</p>
                      </div>
                      <p className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                    <span className="text-lg font-medium text-gray-900">Subtotal</span>
                    <span className="text-lg font-medium text-gray-900">₹{total.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-green-600">Coupon Discount</span>
                      <span className="text-sm text-green-600">-₹{discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xl font-bold text-gray-900">Grand Total</span>
                    <span className="text-xl font-bold text-blue-600">₹{calculateTotal()}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Shipping Address */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Shipping Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input id="fullName" type="text" required value={form.fullName} onChange={handleChange} name="fullName" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Full name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input id="phone" type="tel" required value={form.phone || ''} onChange={handleChange} name="phone" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Phone number" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
                  <input id="address" type="text" required value={form.address} onChange={handleChange} name="address" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="123 Main Street" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                  <input id="line2" type="text" value={form.line2 || ''} onChange={handleChange} name="line2" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Apartment, suite, etc." />
                </div>
              </div>
              <div className="md:grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input id="city" type="text" required value={form.city} onChange={handleChange} name="city" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="City" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input id="state" type="text" required value={form.state} onChange={handleChange} name="state" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="State" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                <input id="postalCode" type="text" required value={form.postalCode} onChange={handleChange} name="postalCode" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Postal code" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input id="country" type="text" required value={form.country} onChange={handleChange} name="country" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Country" />
              </div>
            </div>

            {/* Coupon */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Coupon</h3>
              <div className="flex gap-2">
                <input id="couponCode" type="text" placeholder="Enter coupon code" value={couponCode} onChange={handleCouponChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                <button type="button" onClick={applyCoupon} disabled={!couponCode || isLoading} className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">Apply</button>
              </div>
              {couponCode && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm text-gray-500">Applied: {couponCode} (-₹{discount.toFixed(2)})</span>
                  <button type="button" onClick={removeCoupon} className="text-sm text-red-600 hover:underline">Remove</button>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Method</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center cursor-pointer">
                    <input type="radio" name="paymentMethod" value="razorpay" checked={form.paymentMethod === 'razorpay'} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} className="rounded text-blue-600" />
                    <span className="ml-2">Razorpay</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center cursor-pointer">
                    <input type="radio" name="paymentMethod" value="stripe" checked={form.paymentMethod === 'stripe'} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} className="rounded text-blue-600" />
                    <span className="ml-2">Stripe</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" disabled={isLoading || items.length === 0} className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition">{isLoading ? 'Processing Order...' : 'Place Order'}</button>
          </form>
        </div>
      </div>
    </section>
  );
