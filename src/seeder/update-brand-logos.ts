import { PrismaClient } from '@prisma/client';
import { getBrandLogoUrl, brandLogos, DEFAULT_LOGO } from './brand-logos-data';

const prisma = new PrismaClient();

async function updateBrandLogos() {
  try {
    console.log('🚀 Starting brand logo update...');
    
    // Fetch all existing brands from database
    const brands = await prisma.brand.findMany({
      orderBy: { name: 'asc' }
    });
    
    console.log(`📊 Found ${brands.length} brands in database\n`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const brand of brands) {
      try {
        // Get the logo URL for this brand
        const logoUrl = getBrandLogoUrl(brand.name);
        
        // Update the brand with the logo URL
        await prisma.brand.update({
          where: { id: brand.id },
          data: { logoUrl: logoUrl }
        });
        
        if (logoUrl === DEFAULT_LOGO) {
          console.log(`⚠️  ${brand.name} - Updated with default logo`);
          skippedCount++;
        } else {
          console.log(`✅ ${brand.name} - Updated with specific logo`);
          updatedCount++;
        }
        
      } catch (error) {
        console.error(`❌ Failed to update ${brand.name}:`, error);
      }
    }
    
    console.log('\n📈 Summary:');
    console.log(`   ✅ ${updatedCount} brands updated with specific logos`);
    console.log(`   ⚠️  ${skippedCount} brands updated with default logo`);
    console.log(`   📊 Total: ${brands.length} brands processed`);
    
    // Display some examples
    console.log('\n📸 Sample updated brands:');
    const samples = await prisma.brand.findMany({
      take: 5,
      where: {
        logoUrl: {
          not: DEFAULT_LOGO
        }
      }
    });
    
    samples.forEach(brand => {
      console.log(`   - ${brand.name}: ${brand.logoUrl?.substring(0, 50)}...`);
    });
    
  } catch (error) {
    console.error('❌ Error updating brand logos:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
if (require.main === module) {
  updateBrandLogos()
    .then(() => {
      console.log('\n🎉 Brand logo update completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Brand logo update failed:', error);
      process.exit(1);
    });
}

export { updateBrandLogos };