import { PrismaClient } from '@prisma/client';
import { getGithubLogoUrl } from './brand-logos-github';

const prisma = new PrismaClient();

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
  
  // Special cases for generic types (these won't have logos)
  'Crossover': null,
  'LCV': null,
  'MPV': null,
  'SUV': null,
  'Sedan': null,
  'Van': null,
};

async function updateBrandLogosFromGithub() {
  try {
    console.log('🚀 Starting brand logo update from GitHub dataset...');
    
    // Fetch all existing brands from database
    const brands = await prisma.brand.findMany({
      orderBy: { name: 'asc' }
    });
    
    console.log(`📊 Found ${brands.length} brands in database\n`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    let noLogoCount = 0;
    
    for (const brand of brands) {
      try {
        const logoFileName = brandLogoMapping[brand.name];
        
        if (logoFileName === null) {
          // Skip generic types
          console.log(`⏭️  ${brand.name} - Skipped (generic type)`);
          skippedCount++;
          continue;
        }
        
        let logoUrl: string;
        
        if (logoFileName) {
          // Use the specific mapping
          logoUrl = `https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/${logoFileName}.png`;
        } else {
          // Try to generate URL from brand name
          const normalizedName = brand.name
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
          logoUrl = `https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/${normalizedName}.png`;
          console.log(`⚠️  ${brand.name} - Using generated URL: ${normalizedName}.png`);
        }
        
        // Update the brand with the logo URL
        await prisma.brand.update({
          where: { id: brand.id },
          data: { logoUrl: logoUrl }
        });
        
        console.log(`✅ ${brand.name} - Updated with logo`);
        updatedCount++;
        
      } catch (error) {
        console.error(`❌ Failed to update ${brand.name}:`, error);
        noLogoCount++;
      }
    }
    
    console.log('\n📈 Summary:');
    console.log(`   ✅ ${updatedCount} brands updated with logos`);
    console.log(`   ⏭️  ${skippedCount} generic types skipped`);
    console.log(`   ❌ ${noLogoCount} brands failed to update`);
    console.log(`   📊 Total: ${brands.length} brands processed`);
    
    // Display some examples
    console.log('\n📸 Sample updated brands:');
    const samples = await prisma.brand.findMany({
      take: 10,
      where: {
        logoUrl: {
          not: null,
          notIn: ['']
        },
        name: {
          notIn: ['Crossover', 'LCV', 'MPV', 'SUV', 'Sedan', 'Van']
        }
      },
      orderBy: { name: 'asc' }
    });
    
    samples.forEach(brand => {
      const fileName = brand.logoUrl?.split('/').pop();
      console.log(`   - ${brand.name}: .../${fileName}`);
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
  updateBrandLogosFromGithub()
    .then(() => {
      console.log('\n🎉 Brand logo update completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Brand logo update failed:', error);
      process.exit(1);
    });
}

export { updateBrandLogosFromGithub };