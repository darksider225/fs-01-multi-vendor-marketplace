const { connectDB, disconnectDB } = require('../config/db');
const { User } = require('../models');
const env = require('../config/env');

/**
 * Ensures a default admin exists. Admin cannot (and must not) self-register
 * through the public /register route (role is locked to customer/vendor),
 * so provisioning happens here.
 */
const seedAdmin = async () => {
  const { name, email, password } = env.ADMIN;

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`↷ Admin already exists — skipped: ${existing.email}`);
    return false;
  }

  const user = await User.create({
    name,
    email,
    password,
    role: 'admin',
    isEmailVerified: true,
    isActive: true,
  });

  console.log(`✅ Admin created: ${user.email} (role: ${user.role})`);
  return true;
};

const run = async () => {
  await connectDB();
  try {
    await seedAdmin();
  } finally {
    await disconnectDB();
  }
};

// Run directly only via `npm run seed` / `node src/seeders/admin.seeder.js`
if (require.main === module) {
  run()
    .then(() => {
      console.log('Admin seeding completed.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Admin seeding failed:', err.message);
      process.exit(1);
    });
}

module.exports = { seedAdmin, run };
