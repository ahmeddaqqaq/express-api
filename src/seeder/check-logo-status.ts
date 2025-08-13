import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkLogoStatus() {
  try {
    const brands = await prisma.brand.findMany({
      select: { name: true, logoUrl: true },
      orderBy: { name: 'asc' }
    });
    
    const withLogos = brands.filter(brand => brand.logoUrl && brand.logoUrl.startsWith('/brand-logos/'));
    const withoutLogos = brands.filter(brand => !brand.logoUrl || !brand.logoUrl.startsWith('/brand-logos/'));
    const skipped = ['Crossover', 'LCV', 'MPV', 'SUV', 'Sedan', 'Van'];
    const actualWithoutLogos = withoutLogos.filter(brand => !skipped.includes(brand.name));
    
    console.log('🎯 FINAL LOGO STATUS:');
    console.log('='.repeat(40));
    console.log(`✅ Brands with local logos: ${withLogos.length}`);
    console.log(`❌ Brands without logos: ${actualWithoutLogos.length}`);
    console.log(`⏭️  Generic types (skipped): ${withoutLogos.filter(brand => skipped.includes(brand.name)).length}`);
    console.log(`📊 Total brands: ${brands.length}`);
    
    const successRate = ((withLogos.length / (brands.length - skipped.length)) * 100).toFixed(1);
    console.log(`📈 Success rate: ${successRate}%`);
    
    if (actualWithoutLogos.length > 0) {
      console.log('\n❌ Still missing logos:');
      actualWithoutLogos.forEach(brand => console.log(`  • ${brand.name}`));
    }
    
    console.log('\n✅ Sample brands with logos:');
    withLogos.slice(0, 10).forEach(brand => {
      const filename = brand.logoUrl?.split('/').pop();
      console.log(`  • ${brand.name}: ${filename}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLogoStatus();