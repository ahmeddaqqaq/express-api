import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { promisify } from 'util';

const prisma = new PrismaClient();
const mkdir = promisify(fs.mkdir);

// Comprehensive mapping for brands to their exact logo filenames in the GitHub repo
const brandLogoMapping: Record<string, string> = {
  // A
  'Abarth': 'abarth',
  'Acura': 'acura',
  'Alfa Romeo': 'alfa-romeo',
  'Alpine': 'alpine',
  'Aston Martin': 'aston-martin',
  'Audi': 'audi',
  
  // B
  'BMW': 'bmw',
  'BYD': 'byd',
  'Bentley': 'bentley',
  'Bestune': 'bestune',
  'Borgward': 'borgward',
  'Brilliance': 'brilliance',
  'Bugatti': 'bugatti',
  'Buick': 'buick',
  
  // C
  'CMC': 'cmc',
  'Cadillac': 'cadillac',
  'Changan': 'changan',
  'Chery': 'chery',
  'Chevrolet': 'chevrolet',
  'Chrysler': 'chrysler',
  'Citroen': 'citroen',
  'Cupra': 'cupra',
  
  // D
  'DS': 'ds',
  'Dacia': 'dacia',
  'Daewoo': 'daewoo',
  'Daihatsu': 'daihatsu',
  'Datsun': 'datsun',
  'Dayun': 'dayun',
  'Dodge': 'dodge',
  'Dongfeng': 'dongfeng',
  'Dorcen': 'dorcen',
  
  // F
  'FAW': 'faw',
  'Ferrari': 'ferrari',
  'Fiat': 'fiat',
  'Fisker': 'fisker',
  'Force': 'force-motors',
  'Ford': 'ford',
  'Foton': 'foton',
  'Freightliner': 'freightliner',
  
  // G
  'GAC': 'gac',
  'GMC': 'gmc',
  'Geely': 'geely',
  'Genesis': 'genesis',
  'Great Wall': 'great-wall',
  
  // H
  'Hafei': 'hafei',
  'Haval': 'haval',
  'Hawtai': 'hawtai',
  'Hino': 'hino',
  'Holden': 'holden',
  'Honda': 'honda',
  'Hongqi': 'hongqi',
  'Hummer': 'hummer',
  'Hunaghai': 'huanghai',
  'Hyundai': 'hyundai',
  
  // I
  'Infiniti': 'infiniti',
  'Iran Khodro': 'iran-khodro',
  'Isuzu': 'isuzu',
  'Iveco': 'iveco',
  
  // J
  'JAC': 'jac',
  'JMC': 'jmc',
  'Jaguar': 'jaguar',
  'Jeep': 'jeep',
  'Jetour': 'jetour',
  'Jinbei': 'jinbei',
  
  // K
  'Kaiyi': 'kaiyi',
  'Kenworth': 'kenworth',
  'Kia': 'kia',
  'Koenigsegg': 'koenigsegg',
  
  // L
  'Lada': 'lada',
  'Lamborghini': 'lamborghini',
  'Lancia': 'lancia',
  'Land Rover': 'land-rover',
  'Lexus': 'lexus',
  'Li Auto': 'li',
  'Lifan': 'lifan',
  'Lincoln': 'lincoln',
  'Lotus': 'lotus',
  'Lucid': 'lucid',
  
  // M
  'MAN': 'man',
  'MG': 'mg',
  'MINI': 'mini',
  'Mack': 'mack',
  'Mahindra': 'mahindra',
  'Maserati': 'maserati',
  'Maxus': 'maxus',
  'Maybach': 'maybach',
  'Mazda': 'mazda',
  'McLaren': 'mclaren',
  'Mercedes-Benz': 'mercedes',
  'Mercedes': 'mercedes',
  'Mercury': 'mercury',
  'Mini': 'mini',
  'Mitsubishi': 'mitsubishi',
  'Mitsuoka': 'mitsuoka',
  'Morgan': 'morgan',
  
  // N
  'NETA': 'neta',
  'NIO': 'nio',
  'Nio': 'nio',
  'Nissan': 'nissan',
  
  // O
  'Oldsmobile': 'oldsmobile',
  'Opel': 'opel',
  
  // P
  'Pagani': 'pagani',
  'Perodua': 'perodua',
  'Peterbilt': 'peterbilt',
  'Peugeot': 'peugeot',
  'Plymouth': 'plymouth',
  'Polestar': 'polestar',
  'Pontiac': 'pontiac',
  'Porsche': 'porsche',
  'Proton': 'proton',
  
  // R
  'RAM': 'ram',
  'Ram': 'ram',
  'Renault': 'renault',
  'Rivian': 'rivian',
  'Rolls-Royce': 'rolls-royce',
  'Rolls Royce': 'rolls-royce',
  'Rover': 'rover',
  
  // S
  'SAIPA': 'saipa',
  'SEAT': 'seat',
  'Saab': 'saab',
  'Samsung': 'samsung',
  'Saturn': 'saturn',
  'Scania': 'scania',
  'Scion': 'scion',
  'Seat': 'seat',
  'Skoda': 'skoda',
  'Skywell': 'skywell',
  'Smart': 'smart',
  'Soueast': 'soueast',
  'SsangYong': 'ssangyong',
  'Subaru': 'subaru',
  'Suzuki': 'suzuki',
  
  // T
  'TATA': 'tata',
  'Tata': 'tata',
  'Tesla': 'tesla',
  'Toyota': 'toyota',
  
  // V
  'Vauxhall': 'vauxhall',
  'Volkswagen': 'volkswagen',
  'VW': 'volkswagen',
  'Volvo': 'volvo',
  
  // W
  'Wuling': 'wuling',
  
  // X
  'Xpeng': 'xpeng',
  
  // Z
  'ZXAUTO': 'zxauto',
  'Zotye': 'zotye',
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

async function downloadAndSeedLogos() {
  try {
    console.log('🚀 Starting brand logo download and seeding...\n');
    
    // Create directories for logos
    const backendLogosDir = path.join(process.cwd(), 'public', 'brand-logos');
    const frontendPath = path.join(process.cwd(), '..', 'express', 'public', 'brand-logos');
    
    // Create backend public directory if it doesn't exist
    if (!fs.existsSync(backendLogosDir)) {
      await mkdir(backendLogosDir, { recursive: true });
      console.log(`📁 Created directory: ${backendLogosDir}`);
    }
    
    // Also try to create frontend directory if accessible
    try {
      if (!fs.existsSync(frontendPath)) {
        await mkdir(frontendPath, { recursive: true });
        console.log(`📁 Created frontend directory: ${frontendPath}`);
      }
    } catch (err) {
      console.log('⚠️  Could not create frontend directory (may need to be done manually)');
    }
    
    // Fetch all brands from database
    const brands = await prisma.brand.findMany({
      orderBy: { name: 'asc' }
    });
    
    console.log(`📊 Found ${brands.length} brands in database\n`);
    
    const results = {
      downloaded: [] as string[],
      failed: [] as { brand: string, reason: string }[],
      skipped: [] as string[],
    };
    
    // Process each brand
    for (const brand of brands) {
      // Skip generic types
      if (['Crossover', 'LCV', 'MPV', 'SUV', 'Sedan', 'Van'].includes(brand.name)) {
        console.log(`⏭️  ${brand.name} - Skipped (generic type)`);
        results.skipped.push(brand.name);
        continue;
      }
      
      try {
        let logoFileName = brandLogoMapping[brand.name];
        let attempts = [];
        
        if (!logoFileName) {
          // Try different variations if no mapping exists
          const variations = [
            brand.name.toLowerCase().replace(/\s+/g, '-'),
            brand.name.toLowerCase().replace(/\s+/g, ''),
            brand.name.toLowerCase().split(' ')[0],
          ];
          
          for (const variant of variations) {
            attempts.push(variant);
          }
        } else {
          attempts.push(logoFileName);
        }
        
        let downloaded = false;
        let successfulUrl = '';
        let localFileName = '';
        
        // Try each variation
        for (const attempt of attempts) {
          const url = `https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/${attempt}.png`;
          
          // Check if URL exists
          const exists = await checkUrlExists(url);
          
          if (exists) {
            localFileName = `${attempt}.png`;
            const destPath = path.join(backendLogosDir, localFileName);
            
            try {
              await downloadFile(url, destPath);
              console.log(`✅ ${brand.name} - Downloaded as ${localFileName}`);
              successfulUrl = `/brand-logos/${localFileName}`;
              downloaded = true;
              results.downloaded.push(brand.name);
              
              // Also copy to frontend if possible
              try {
                const frontendDest = path.join(frontendPath, localFileName);
                fs.copyFileSync(destPath, frontendDest);
              } catch (err) {
                // Silent fail for frontend copy
              }
              
              break;
            } catch (err) {
              console.log(`⚠️  ${brand.name} - Failed to download from ${attempt}.png`);
            }
          }
        }
        
        if (!downloaded) {
          // Try with normalized name as last resort
          const normalized = brand.name
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
          
          const url = `https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/${normalized}.png`;
          const exists = await checkUrlExists(url);
          
          if (exists) {
            localFileName = `${normalized}.png`;
            const destPath = path.join(backendLogosDir, localFileName);
            
            try {
              await downloadFile(url, destPath);
              console.log(`✅ ${brand.name} - Downloaded as ${localFileName} (normalized)`);
              successfulUrl = `/brand-logos/${localFileName}`;
              downloaded = true;
              results.downloaded.push(brand.name);
              
              // Also copy to frontend if possible
              try {
                const frontendDest = path.join(frontendPath, localFileName);
                fs.copyFileSync(destPath, frontendDest);
              } catch (err) {
                // Silent fail for frontend copy
              }
            } catch (err) {
              console.log(`❌ ${brand.name} - Failed to download`);
              results.failed.push({ brand: brand.name, reason: 'Download failed' });
            }
          } else {
            console.log(`❌ ${brand.name} - Logo not found in repository`);
            results.failed.push({ brand: brand.name, reason: 'Not found in repository' });
          }
        }
        
        // Update database with local path if downloaded
        if (downloaded && successfulUrl) {
          await prisma.brand.update({
            where: { id: brand.id },
            data: { logoUrl: successfulUrl }
          });
        }
        
      } catch (error) {
        console.error(`❌ ${brand.name} - Error: ${error}`);
        results.failed.push({ brand: brand.name, reason: String(error) });
      }
    }
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📈 DOWNLOAD SUMMARY:');
    console.log('='.repeat(60));
    console.log(`✅ Successfully downloaded: ${results.downloaded.length} logos`);
    console.log(`❌ Failed to download: ${results.failed.length} logos`);
    console.log(`⏭️  Skipped (generic types): ${results.skipped.length}`);
    console.log(`📊 Total processed: ${brands.length} brands`);
    
    if (results.failed.length > 0) {
      console.log('\n❌ Failed brands (need manual fixing):');
      console.log('-'.repeat(40));
      results.failed.forEach(({ brand, reason }) => {
        console.log(`  • ${brand}: ${reason}`);
      });
      
      console.log('\n💡 Suggestions for failed brands:');
      console.log('-'.repeat(40));
      results.failed.forEach(({ brand }) => {
        const suggested = brand
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
        console.log(`  '${brand}': '${suggested}',`);
      });
    }
    
    console.log('\n✅ Logo files saved to:');
    console.log(`  • Backend: ${backendLogosDir}`);
    console.log(`  • Frontend: ${frontendPath} (if accessible)`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder
if (require.main === module) {
  downloadAndSeedLogos()
    .then(() => {
      console.log('\n🎉 Logo download and seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Seeding failed:', error);
      process.exit(1);
    });
}

export { downloadAndSeedLogos };