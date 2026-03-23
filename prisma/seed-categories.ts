import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  { slug: 'processors', name: 'Processors' },
  { slug: 'graphics-cards', name: 'Graphics Cards' },
  { slug: 'motherboards', name: 'Motherboards' },
  { slug: 'memory', name: 'Memory (RAM)' },
  { slug: 'storage', name: 'Storage' },
  { slug: 'power-supplies', name: 'Power Supplies' },
  { slug: 'cases', name: 'Computer Cases' },
  { slug: 'cooling', name: 'Cooling Solutions' },
  { slug: 'monitors', name: 'Monitors' },
  { slug: 'keyboards', name: 'Keyboards' },
  { slug: 'mice', name: 'Mice' },
  { slug: 'audio', name: 'Audio Equipment' },
  { slug: 'networking', name: 'Networking' },
  { slug: 'laptops', name: 'Laptops' },
  { slug: 'desktops', name: 'Desktop Computers' },
];

async function seedCategories() {
  console.log('🌱 Seeding categories...');

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: category,
    });
    console.log(`✅ Created/updated category: ${category.name}`);
  }

  console.log('🎉 Categories seeding completed!');
}

async function main() {
  try {
    await seedCategories();
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { seedCategories };
