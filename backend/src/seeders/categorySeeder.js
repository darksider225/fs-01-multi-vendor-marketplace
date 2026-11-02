const { Category } = require('../models');

const CATEGORIES = [
  { name: 'Electronics', slug: 'electronics' },
  { name: 'Fashion', slug: 'fashion' },
  { name: 'Books', slug: 'books' },
  { name: 'Sports', slug: 'sports' },
  { name: 'Home', slug: 'home' },
  { name: 'Beauty', slug: 'beauty' },
];

const seedCategories = async () => {
  for (const cat of CATEGORIES) {
    await Category.findOneAndUpdate(
      { slug: cat.slug },
      { $setOnInsert: { name: cat.name, slug: cat.slug, isActive: true } },
      { upsert: true, new: true }
    );
  }
  console.log(`✅ Categories seeded: ${CATEGORIES.length} categories`);
};

module.exports = { seedCategories, CATEGORIES };
