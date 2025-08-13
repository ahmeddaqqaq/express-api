import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

const prisma = new PrismaClient();

// Updated mapping for the missing brands
const missingBrandFixes: Record<string, string> = {
  'GAC': 'gac-group', // Found in repository as gac-group.png
  'Hunaghai': 'huanghai', // Correct spelling in repository
  'Iran Khodro': 'iran-khodro', // Try this variant
  'CMC': 'cmc', // Commercial Motor Corporation
  'Dorcen': 'dorcen', // Chinese truck brand
  'Jetour': 'jetour', // Chery sub-brand
  'Jinbei': 'jinbei', // Chinese automotive company
  'Kaiyi': 'kaiyi', // Chinese brand
  'NETA': 'neta', // Chinese EV brand
  'Samsung': 'samsung', // Samsung Motors (historical)
  'Skywell': 'skywell', // Chinese EV brand
  'ZXAUTO': 'zxauto', // Chinese brand
};

// Alternative URLs for brands not in the main repository
const alternativeLogos: Record<string, string> = {
  'CMC': 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/cmc.png',
  'Iran Khodro': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Iran_Khodro_logo.svg/240px-Iran_Khodro_logo.svg.png',
  'Samsung': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Samsung_Logo.svg/240px-Samsung_Logo.svg.png',
  'NETA': 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/neta.png',
};

// Function to download a file from URL
function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      } else if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirect
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          https.get(redirectUrl, (redirectResponse) => {
            if (redirectResponse.statusCode === 200) {
              redirectResponse.pipe(file);
              file.on('finish', () => {
                file.close();
                resolve();
              });
            } else {
              file.close();
              fs.unlinkSync(destPath);
              reject(new Error(`Failed to download: ${response.statusCode}`));
            }
          }).on('error', (err) => {
            file.close();
            fs.unlinkSync(destPath);
            reject(err);
          });
        }
      } else {
        file.close();
        fs.unlinkSync(destPath);
        reject(new Error(`Failed to download: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      file.close();
      fs.unlinkSync(destPath);
      reject(err);
    });
  });
}

// Function to check if a URL exists
function checkUrlExists(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    https.get(url, (response) => {
      resolve(response.statusCode === 200 || response.statusCode === 302 || response.statusCode === 301);
    }).on('error', () => {
      resolve(false);
    });
  });
}

async function fixMissingLogos() {
  try {
    console.log('🔧 Fixing missing brand logos...\n');
    
    const logosDir = path.join(process.cwd(), 'public', 'brand-logos');
    const frontendPath = path.join(process.cwd(), '..', 'express', 'public', 'brand-logos');
    
    // Get brands that need fixing
    const brandsToFix = Object.keys(missingBrandFixes);
    
    const results = {
      fixed: [] as string[],
      stillMissing: [] as string[],
    };
    
    for (const brandName of brandsToFix) {
      try {
        const brand = await prisma.brand.findFirst({
          where: { name: brandName }
        });
        
        if (!brand) {
          console.log(`⚠️  ${brandName} - Not found in database`);
          continue;
        }
        
        const fixedFileName = missingBrandFixes[brandName];
        let url = `https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/${fixedFileName}.png`;
        let localFileName = `${fixedFileName}.png`;
        
        // Check if the main URL exists
        let exists = await checkUrlExists(url);
        
        // If not found, try alternative URL
        if (!exists && alternativeLogos[brandName]) {
          url = alternativeLogos[brandName];
          exists = await checkUrlExists(url);
          console.log(`🔄 ${brandName} - Trying alternative source`);
        }
        
        if (exists) {
          const destPath = path.join(logosDir, localFileName);
          
          try {
            await downloadFile(url, destPath);
            console.log(`✅ ${brandName} - Downloaded as ${localFileName}`);
            
            // Copy to frontend
            try {
              const frontendDest = path.join(frontendPath, localFileName);
              fs.copyFileSync(destPath, frontendDest);
            } catch (err) {
              // Silent fail for frontend copy
            }
            
            // Update database
            await prisma.brand.update({
              where: { id: brand.id },
              data: { logoUrl: `/brand-logos/${localFileName}` }
            });
            
            results.fixed.push(brandName);
            
          } catch (err) {
            console.log(`❌ ${brandName} - Failed to download: ${err}`);
            results.stillMissing.push(brandName);
          }
        } else {
          console.log(`❌ ${brandName} - Logo not found in any source`);
          results.stillMissing.push(brandName);
        }
        
      } catch (error) {
        console.error(`❌ ${brandName} - Error: ${error}`);
        results.stillMissing.push(brandName);
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🔧 MISSING LOGOS FIX SUMMARY:');
    console.log('='.repeat(50));
    console.log(`✅ Fixed: ${results.fixed.length} brands`);
    console.log(`❌ Still missing: ${results.stillMissing.length} brands`);
    
    if (results.fixed.length > 0) {
      console.log('\n✅ Fixed brands:');
      results.fixed.forEach(brand => console.log(`  • ${brand}`));
    }
    
    if (results.stillMissing.length > 0) {
      console.log('\n❌ Still missing (will use fallback):');
      results.stillMissing.forEach(brand => console.log(`  • ${brand}`));
      
      // Set fallback for remaining missing logos
      for (const brandName of results.stillMissing) {
        try {
          const brand = await prisma.brand.findFirst({
            where: { name: brandName }
          });
          
          if (brand) {
            await prisma.brand.update({
              where: { id: brand.id },
              data: { logoUrl: null } // Will use fallback in frontend
            });
          }
        } catch (err) {
          console.error(`Failed to set fallback for ${brandName}:`, err);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
if (require.main === module) {
  fixMissingLogos()
    .then(() => {
      console.log('\n🎉 Missing logos fix completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Fix failed:', error);
      process.exit(1);
    });
}

export { fixMissingLogos };