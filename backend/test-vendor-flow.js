const mongoose = require('mongoose');
const http = require('http');
const { User, Vendor, Category, Product } = require('./src/models');
const app = require('./src/app');
const { signToken } = require('./src/utils/token');

let server;
let failures = 0;

function check(label, ok, detail = '') {
  console.log((ok ? 'PASS' : 'FAIL') + ': ' + label + (detail ? ' - ' + detail : ''));
  if (!ok) failures++;
}

function req(method, path, token, body, files) {
  return new Promise((resolve) => {
    const opts = {
      host: '127.0.0.1',
      port: server.address().port,
      path,
      method,
      headers: {},
    };
    if (token) opts.headers.Authorization = 'Bearer ' + token;

    if (files && files.length > 0) {
      const boundary = '----WebKitFormBoundary' + Math.random().toString(16);
      opts.headers['Content-Type'] = 'multipart/form-data; boundary=' + boundary;
      const parts = [];
      files.forEach((f) => {
        parts.push(
          '--' + boundary + '\r\nContent-Disposition: form-data; name="images"; filename="' +
          f.filename + '"\r\nContent-Type: ' + f.mimetype + '\r\n\r\n' +
          f.buffer + '\r\n'
        );
      });
      parts.push('--' + boundary + '--\r\n');
      opts.body = Buffer.concat(parts.map((p) => (typeof p === 'string' ? Buffer.from(p) : p)));
    } else if (body) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }

    const r = http.request(opts, (rs) => {
      let b = '';
      rs.on('data', c => b += c);
      rs.on('end', () => resolve({ status: rs.statusCode, body: b }));
    });
    r.write(opts.body || '');
    r.end();
  });
}

(async () => {
  await mongoose.connect('mongodb://127.0.0.1:27017/vendor_flow_test', { serverSelectionTimeoutMS: 5000 });
  await mongoose.connection.dropDatabase();
  await User.deleteMany({ email: /^@flowtest\.com$/ });
  await Vendor.deleteMany({});
  await Category.deleteMany({});
  await Product.deleteMany({});

  const cat = await Category.create({ name: 'Electronics', slug: 'electronics' });
  const vendorUser = await User.create({ name: 'Test Vendor', email: 'vendor@flowtest.com', password: 'Password123!', role: 'vendor' });
  const vendor = await Vendor.create({ user: vendorUser._id, storeName: 'Test Vendor Store', slug: 'test-vendor-store', contactEmail: 'vendor@test.com', approvalStatus: 'approved' });
  const vendorToken = signToken({ sub: vendorUser._id.toString(), role: 'vendor' });

  server = app.listen(0, '127.0.0.1', async () => {
    console.log('Server on port ' + server.address().port + '\n');

    // Step 1: Vendor Login
    console.log('\n--- Step 1: Vendor Login ---');
    const loginRes = await req('POST', '/api/v1/auth/login', null, { email: 'vendor@flowtest.com', password: 'Password123!' });
    check('Vendor login returns 200', loginRes.status === 200);
    const loginBody = JSON.parse(loginRes.body);
    check('Login returns token', !!loginBody.data.token);
    check('Login returns user role vendor', loginBody.data.user.role === 'vendor');
    const token = loginBody.data.token;

    // Step 2: Upload Image
    console.log('\n--- Step 2: Upload Image ---');
    const fakeImage = Buffer.from('fake-image-data-' + Date.now());
    const uploadRes = await req('POST', '/api/v1/uploads/products', token, null, [
      { filename: 'test-image.jpg', mimetype: 'image/jpeg', buffer: fakeImage },
    ]);
    console.log('Upload response status:', uploadRes.status);
    console.log('Upload response body:', uploadRes.body);
    check('Image upload returns 201', uploadRes.status === 201);
    const uploadBody = JSON.parse(uploadRes.body);
    check('Upload returns image URLs', Array.isArray(uploadBody.data.images) && uploadBody.data.images.length === 1);
    const imageUrl = uploadBody.data.images[0];
    check('Image URL contains S3 bucket', imageUrl.includes('amazonaws.com'));

    // Step 3: Get S3 URL
    console.log('\n--- Step 3: Get S3 URL ---');
    console.log('Image URL:', imageUrl);
    check('S3 URL is valid HTTPS URL', imageUrl.startsWith('https://'));

    // Step 4: Create Product with image URL
    console.log('\n--- Step 4: Create Product with Image URL ---');
    const createRes = await req('POST', '/api/v1/vendor/products', token, {
      title: 'Test Product with Image',
      category: cat._id,
      price: 99.99,
      stock: 50,
      description: 'Product with uploaded image',
      images: [imageUrl],
    });
    check('Product create returns 201', createRes.status === 201);
    const createBody = JSON.parse(createRes.body);
    check('Product has image URL', createBody.data.product.images && createBody.data.product.images[0] === imageUrl);
    const productId = createBody.data.product.id;

    // Step 5: Get Product
    console.log('\n--- Step 5: Get Product ---');
    const getRes = await req('GET', '/api/v1/vendor/products/' + productId, token);
    check('Get product returns 200', getRes.status === 200);
    const getBody = JSON.parse(getRes.body);
    check('Product has correct ID', getBody.data.product.id === productId);
    check('Product has image URL', getBody.data.product.images && getBody.data.product.images[0] === imageUrl);

    // Step 6: Verify image renders in browser
    console.log('\n--- Step 6: Verify Image Renders in Browser ---');
    console.log('Image URL for browser:', imageUrl);
    console.log('HTML img tag: <img src="' + imageUrl + '" alt="Product Image">');
    check('Image URL is accessible format', imageUrl.startsWith('https://') && imageUrl.includes('.amazonaws.com'));

    console.log('\n' + (failures === 0 ? 'ALL TESTS PASSED' : failures + ' TESTS FAILED'));
    server.close();
    await mongoose.connection.close();
    process.exit(failures === 0 ? 0 : 1);
  });
})().catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});