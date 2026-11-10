const pdf = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3 = new S3Client({});
const BUCKET_NAME = process.env.S3_BUCKET_NAME;

const generateInvoicePDF = (order) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new pdf({
        margin: 50,
        size: 'A4',
      });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('error', (err) => reject(err));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });

      // Build invoice content
      doc.fontSize(10);
      doc.text('INVOICE', { align: 'center', underline: true });
      doc.text(`Invoice Number: ${order.invoiceNumber || 'N/A'}`);
      doc.text(`Order Number: ${order.orderNumber}`);
      doc.text(`Date: ${order.placedAt ? new Date(order.placedAt).toLocaleDateString() : 'N/A'}`);

      doc.ln(20);
      doc.text('Customer Information:', { bold: true });
      doc.text(`Full Name: ${order.shippingAddress.fullName}`);
      doc.text(`Phone: ${order.shippingAddress.phone}`);
      doc.text(`Email: ${order.customer.email || 'N/A'}`);

      doc.ln(20);
      doc.text('Order Details:', { bold: true });
      doc.text(`Order ID: ${order.orderNumber}`);
      doc.text(`Payment ID: ${order.payment ? order.payment.stripePaymentIntentId || order.payment.razorpayPaymentId : 'N/A'}`);
      doc.text(`Payment Status: ${order.paymentStatus}`);
      doc.text(`Order Status: ${order.orderStatus}`);

      doc.ln(20);
      doc.text('Items:', { bold: true });
      let y = doc.cursor.y;
      order.items.forEach((item, index) => {
        doc.text(`${index + 1}. ${item.title} (x${item.quantity}) - $${item.unitPrice.toFixed(2)}`);
        y = doc.cursor.y;
      });

      doc.ln(20);
      doc.text('Financial Summary:', { bold: true });
      doc.text(`Subtotal: $${order.subtotal.toFixed(2)}`);
      doc.text(`Discount: -$${order.discountAmount.toFixed(2)}`);
      doc.text(`Shipping Fee: $${order.shippingFee.toFixed(2)}`);
      doc.text(`Tax: $${order.taxAmount.toFixed(2)}`);
      doc.text(`---`);
      doc.text(`Total Amount: $${order.totalAmount.toFixed(2)}`);

      if (order.coupon) {
        doc.text(`Coupon: ${order.couponCode || 'N/A'}`);
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

const uploadToS3 = async (pdfBuffer, fileName) => {
  const key = `invoices/${fileName}`;
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: pdfBuffer,
    ContentType: 'application/pdf',
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 86400 }); // 24 hours
  return url;
};

const generateInvoice = async (orderId) => {
  const order = await require('../models').Order.findById(orderId).populate('customer', 'email name');
  if (!order) {
    throw new Error('Order not found');
  }

  // ISSUE 1 FIX: Skip invoice generation if already generated (duplicate protection)
  if (order.invoiceUrl) {
    // Invoice already exists; return existing invoice info
    return {
      invoiceNumber: order.invoiceNumber,
      invoiceUrl: order.invoiceUrl,
      invoiceGeneratedAt: order.invoiceGeneratedAt,
    };
  }

  // ISSUE 1 FIX: Generate invoice only if payment is successful
  // (Callers should ensure paymentStatus === 'paid' before calling this)
  if (order.paymentStatus !== 'paid') {
    throw new Error('Invoice can only be generated for paid orders');
  }

  try {
    // Generate PDF buffer
    const pdfBuffer = await generateInvoicePDF(order);

    // Upload to S3
    const fileName = `${order.invoiceNumber || `invoice-${order._id}`}.pdf`;
    const s3Url = await uploadToS3(pdfBuffer, fileName);

    // Update order with invoice info
    order.invoiceUrl = s3Url;
    order.invoiceGeneratedAt = new Date();
    await order.save();

    return {
      invoiceNumber: order.invoiceNumber,
      invoiceUrl: s3Url,
      invoiceGeneratedAt: order.invoiceGeneratedAt,
    };
  } catch (error) {
    // ISSUE 4 FIX: If PDF generation or S3 upload fails,
    // do NOT throw - allow payment success to proceed
    // Log the failure and return what we can
    console.error('Invoice generation failure (non-fatal):', error.message);
    
    // Return whatever invoice info we have (may be incomplete)
    return {
      invoiceNumber: order.invoiceNumber,
      invoiceUrl: order.invoiceUrl,
      invoiceGeneratedAt: order.invoiceGeneratedAt,
      _generationError: error.message,
    };
  }
};

module.exports = { generateInvoice };