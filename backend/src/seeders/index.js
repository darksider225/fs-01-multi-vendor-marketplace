const { run: seedAdmin } = require('./admin.seeder');

/**
 * Seed dispatcher — add future seeders here (categories, demo vendors, etc.).
 * Run all: `npm run seed` (or `node src/seeders`).
 */
const runAll = async () => {
  console.log('Running seeders…');
  await seedAdmin();
  console.log('All seeders finished.');
};

if (require.main === module) {
  runAll()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding failed:', err.message);
      process.exit(1);
    });
}

module.exports = { runAll };
