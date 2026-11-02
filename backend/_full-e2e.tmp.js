const mongoose = require('mongoose');
const http = require('http');
const { User } = require('./src/models');
const { Vendor } = require('./src/models');
const { Category } = require('./src/models');
const { Product } = require('./src/models');
const app = require('./src/app');
const { ROLES } = require('./src/constants/statusCodes');
const { signToken } = require('./src/utils/token');

const PORT = 0;
let server;
let failures = 0;
function check(l, o) { console.log((o ? 'OK  ' : 'FAIL ') + l); if (!o) failures++; }

function req(method, path, token, body) {
  return new Promise((resolve) => {
    const r = http.request({
      host: '127.0.0.1', port: server.address().port, path, method,
      headers: { 'Content-Type': 'application/json', Authorization: token ? 'Bearer ' + token : '' }
    }, (rs) => { let b = ''; rs.on('data', c => b += c); rs.on('end', () => resolve({ status: rs.statusCode, body: b })); });
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

server = app.listen(PORT, '127.0.0.1', async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/full_e2e', { serverSelectionTimeoutMS: 5000 });
    await User.deleteMany({ email: /^.*@full.test$/ });
    await Vendor.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});

    const cat1 = await Category.create({ name: 'Electronics', slug: 'electronics' });

    // 1. Register customer - role param should be ignored
    const regRes = await req('POST', '/api/v1/auth/register', null, {
      name: 'Test User', email: 'customer@full.test', password: 'Password123!', role: 'admin'
    });
    check('REGISTER ignores role → 201', regRes.status === 201);
    const regBody = JSON.parse(regRes.body);
    check('REGISTER role is customer', regBody.data.user.role === 'customer');
    const customerToken = regBody.data.token;

    // 2. Customer applies to become vendor
    const applyRes = await req('POST', '/api/v1/vendor/apply', customerToken, {
      storeName: 'Test Store', slug: 'test-store', contactEmail: 'customer@full.test'
    });
    check('VENDOR APPLY → 201', applyRes.status === 201);
    const applyBody = JSON.parse(applyRes.body);
    check('VENDOR APPLY pending', applyBody.data.vendor.approvalStatus === 'pending');

    // 3. Unapproved vendor tries to create product → 403
    const prodRes = await req('POST', '/api/v1/vendor/products', customerToken, {
      title: 'Test Product', category: cat1._id, price: 19.99, stock: 10
    });
    check('Unapproved CREATE → 403', prodRes.status === 403);

    // 4. Admin approves vendor
    const admin = await User.create({ name: 'Admin', email: 'admin@full.test', password: 'Password123!', role: 'admin' });
    const adminToken = signToken({ sub: admin._id.toString(), role: 'admin' });

    const listRes = await req('GET', '/api/v1/admin/vendors', adminToken);
    check('ADMIN LIST → 200', listRes.status === 200);
    const listBody = JSON.parse(listRes.body);
    check('ADMIN LIST finds vendor', listBody.data.vendors.length === 1);

    const vendorDoc = await Vendor.findOne({ user: regBody.data.user.id });
    const approveRes = await req('PUT', '/api/v1/admin/vendors/' + vendorDoc.id + '/approve', adminToken, { status: 'approved' });
    check('ADMIN APPROVE → 200', approveRes.status === 200);

  const updatedUser = await User.findById(regBody.data.user.id);
  check('User role → vendor', updatedUser.role === 'vendor');

  const vendorToken = signToken({ sub: regBody.data.user.id, role: 'vendor' });

    // 5. Vendor creates product
    const createRes = await req('POST', '/api/v1/vendor/products', vendorToken, {
      title: 'Test Product', category: cat1._id, price: 19.99, stock: 100,
      description: 'A test product', images: ['http://example.com/img1.jpg']
    });
    check('Vendor CREATE → 201', createRes.status === 201);
    const createBody = JSON.parse(createRes.body);
    const productId = createBody.data.product.id;
    check('Product slug auto-generated', !!createBody.data.product.slug && createBody.data.product.slug.includes('test-product'));

    // 6. Customer tries to create product → 403
    const custProd = await req('POST', '/api/v1/vendor/products', customerToken, {
      title: 'Hack Product', category: cat1._id, price: 1.00, stock: 1
    });
    check('Customer CREATE → 403', custProd.status === 403);

    // 7. List products with pagination
    const listProdRes = await req('GET', '/api/v1/vendor/products?page=1&limit=10', vendorToken);
    check('LIST products → 200', listProdRes.status === 200);
    const listProdBody = JSON.parse(listProdRes.body);
    check('LIST has pagination', !!listProdBody.data.pagination);

    // 8. Get single product
    const getRes = await req('GET', '/api/v1/vendor/products/' + productId, vendorToken);
    check('GET product → 200', getRes.status === 200);

    // 9. Update product
    const updateRes = await req('PUT', '/api/v1/vendor/products/' + productId, vendorToken, {
      title: 'Updated Product', price: 29.99
    });
    check('UPDATE product → 200', updateRes.status === 200);
    const updateBody = JSON.parse(updateRes.body);
    check('UPDATE title changed', updateBody.data.product.title === 'Updated Product');

    // 10. Delete product
    const deleteRes = await req('DELETE', '/api/v1/vendor/products/' + productId, vendorToken);
    check('DELETE product → 200', deleteRes.status === 200);

    const afterDelete = await req('GET', '/api/v1/vendor/products/' + productId, vendorToken);
    check('Deleted product → 404', afterDelete.status === 404);

    await Product.deleteMany({});
    await Vendor.deleteMany({});
    await Category.deleteMany({});
    await User.deleteMany({ email: /^.*@full.test$/ });

    console.log(failures === 0 ? '\\nALL E2E CHECKS PASSED' : '\\n' + failures + ' FAILED');
    server.close();
    await mongoose.connection.close();
    process.exit(failures === 0 ? 0 : 1);
  } catch (e) {
    console.error('UNEXPECTED', e.message);
    server.close();
    process.exit(1);
  }
});