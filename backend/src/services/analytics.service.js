const Order = require('../models/order.model');
const Product = require('../models/product.model');
const User = require('../models/user.model');
const Vendor = require('../models/vendor.model');

const getRevenueStats = async () => {
  const stats = await Order.aggregate([
    {
      $match: {
        paymentStatus: 'paid',
        orderStatus: { $ne: 'cancelled' }
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalAmount' },
        totalOrders: { $sum: 1 }
      }
    }
  ]);

  if (stats.length === 0) {
    return { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0 };
  }

  // Calculate averageOrderValue = totalRevenue / totalOrders
  // Handle division by zero and round to 2 decimal places
  const averageOrderValue = Math.round((stats[0].totalRevenue / stats[0].totalOrders) * 100) / 100;

  return {
    totalRevenue: stats[0].totalRevenue,
    totalOrders: stats[0].totalOrders,
    averageOrderValue: averageOrderValue
  };
};

const getOrderStats = async () => {
  const stats = await Order.aggregate([
    {
      $group: {
        _id: '$orderStatus',
        count: { $sum: 1 }
      }
    }
  ]);

  const result = {};
  stats.forEach(item => {
    result[item._id] = item.count;
  });

  // Ensure all statuses are present
  const allStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  allStatuses.forEach(status => {
    if (!result[status]) {
      result[status] = 0;
    }
  });

  return result;
};

const getPaymentStats = async () => {
  const stats = await Order.aggregate([
    {
      $group: {
        _id: '$paymentStatus',
        count: { $sum: 1 }
      }
    }
  ]);

  const result = {};
  stats.forEach(item => {
    result[item._id] = item.count;
  });

  // Ensure all payment statuses are present
  const allPaymentStatuses = ['pending', 'paid', 'failed', 'refunded'];
  allPaymentStatuses.forEach(status => {
    if (!result[status]) {
      result[status] = 0;
    }
  });

  return result;
};

const getTopSellingProducts = async (limit = 10) => {
  const products = await Order.aggregate([
    {
      $unwind: '$items'
    },
    {
      $group: {
        _id: '$items.product',
        totalQuantity: { $sum: '$items.quantity' },
        orderCount: { $sum: 1 }
      }
    },
    {
      $sort: { totalQuantity: -1 }
    },
    {
      $limit: limit
    },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'productDetails'
      }
    },
    {
      $unwind: '$productDetails'
    },
    {
      $project: {
        _id: 0,
        productId: '$_id',
        title: '$productDetails.title',
        totalQuantity: 1,
        orderCount: 1
      }
    }
  ]);

  return products;
};

const getTopVendors = async (limit = 10) => {
  const vendors = await Order.aggregate([
    {
      $unwind: '$vendorSplits'
    },
    {
      $group: {
        _id: '$vendorSplits.vendor',
        totalSales: { $sum: '$vendorSplits.subtotal' },
        totalOrders: { $sum: 1 }
      }
    },
    {
      $sort: { totalSales: -1 }
    },
    {
      $limit: limit
    },
    {
      $lookup: {
        from: 'vendors',
        localField: '_id',
        foreignField: '_id',
        as: 'vendorDetails'
      }
    },
    {
      $unwind: '$vendorDetails'
    },
    {
      $project: {
        _id: 0,
        vendorId: '$_id',
        storeName: '$vendorDetails.storeName',
        totalSales: 1,
        totalOrders: 1
      }
    }
  ]);

  return vendors;
};

const getMonthlyRevenue = async (year) => {
  const yearFilter = year ? { $year: '$placedAt' } : {};
  const stats = await Order.aggregate([
    {
      $match: {
        paymentStatus: 'paid',
        orderStatus: { $ne: 'cancelled' }
      }
    },
    {
      $group: {
        _id: { month: { $month: '$placedAt' } },
        totalRevenue: { $sum: '$totalAmount' },
        orderCount: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.month': 1 }
    }
  ]);

  // Fill in missing months
  const monthlyData = {};
  for (let i = 1; i <= 12; i++) {
    monthlyData[i] = { totalRevenue: 0, orderCount: 0 };
  }

  stats.forEach(item => {
    monthlyData[item._id.month] = {
      totalRevenue: item.totalRevenue,
      orderCount: item.orderCount
    };
  }

  return monthlyData;
};

const getRecentOrders = async (limit = 10, page = 1) => {
  const skip = (page - 1) * limit;
  const orders = await Order.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('customer', 'name email')
    .populate('vendorSplits.vendor', 'storeName');

  const total = await Order.countDocuments();

  return { orders, total };
};

const getCustomerCount = async () => {
  // Count active customers, excluding admin and vendor roles
  const count = await User.countDocuments({
    role: 'customer',
    isActive: true
  });
  return count;
};

const getVendorCount = async () => {
  // Count approved vendors only (approved status)
  const count = await Vendor.countDocuments({
    approvalStatus: 'approved'
  });
  return count;
};

module.exports = {
  getRevenueStats,
  getOrderStats,
  getPaymentStats,
  getTopSellingProducts,
  getTopVendors,
  getMonthlyRevenue,
  getRecentOrders,
  getCustomerCount,
  getVendorCount
};

// Required database indexes for analytics queries:
// db.orders.createIndex({ paymentStatus: 1, orderStatus: 1 });
// db.orders.createIndex({ placedAt: -1 });
// db.orders.createIndex({ "items.product": 1 });
// db.orders.createIndex({ "vendorSplits.vendor": 1 });
// db.users.createIndex({ role: 1, isActive: 1 });
// db.vendors.createIndex({ approvalStatus: 1 });