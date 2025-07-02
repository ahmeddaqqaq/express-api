import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-parser';

const prisma = new PrismaClient();

interface CustomerCsvRow {
  phoneNumber: string;
  customerName: string;
  firstName: string;
  lastName: string;
}

const readCsvFile = (filePath: string): Promise<CustomerCsvRow[]> => {
  return new Promise((resolve, reject) => {
    const results: CustomerCsvRow[] = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        // Normalize the headers (remove whitespace, convert to lowercase)
        const normalizedData: any = {};
        Object.keys(data).forEach((key) => {
          const normalizedKey = key.trim().toLowerCase().replace('_', '');
          normalizedData[normalizedKey] = data[key];
        });

        results.push({
          phoneNumber: normalizedData.phonenumber?.trim() || '',
          customerName: normalizedData.customername?.trim() || '',
          firstName: normalizedData.firstname?.trim() || '',
          lastName: normalizedData.lastname?.trim() || '',
        });
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

const seedCustomers = async (csvData: CustomerCsvRow[]) => {
  try {
    let successCount = 0;
    let skipCount = 0;

    console.log(`Processing ${csvData.length} customers...`);

    for (const row of csvData) {
      if (!row.phoneNumber || !row.firstName || !row.lastName) {
        console.warn('Skipping incomplete row:', row);
        skipCount++;
        continue;
      }

      try {
        // Create or update customer
        const customer = await prisma.customer.upsert({
          where: { mobileNumber: row.phoneNumber },
          update: {},
          create: {
            mobileNumber: row.phoneNumber,
            fName: row.firstName,
            lName: row.lastName,
            count: 0,
            isActive: true,
          },
        });

        console.log(`✓ Customer: ${row.firstName} ${row.lastName} (${row.phoneNumber}) - ID: ${customer.id}`);
        successCount++;
      } catch (customerError) {
        console.error(`✗ Failed to create customer ${row.firstName} ${row.lastName}:`, customerError);
        skipCount++;
      }
    }

    console.log('\n🎉 Customer seeding completed!');

    // Display summary
    const totalCustomers = await prisma.customer.count();
    console.log(`📊 Summary: ${successCount} customers created/updated, ${skipCount} skipped, ${totalCustomers} total customers in database`);
  } catch (error) {
    console.error('Error during customer seeding:', error);
    throw error;
  }
};

const main = async () => {
  try {
    const csvFilePath = process.argv[2] || './customerInfo.csv';

    if (!fs.existsSync(csvFilePath)) {
      console.error(`❌ CSV file not found: ${csvFilePath}`);
      console.log('Usage: npm run seed:customers <path-to-csv-file>');
      console.log('Example: npm run seed:customers ./customerInfo.csv');
      process.exit(1);
    }

    console.log(`📂 Reading CSV file: ${csvFilePath}`);
    const csvData = await readCsvFile(csvFilePath);

    if (csvData.length === 0) {
      console.log('❌ No data found in CSV file');
      process.exit(1);
    }

    console.log(`📋 Found ${csvData.length} rows in CSV`);

    await seedCustomers(csvData);
  } catch (error) {
    console.error('❌ Customer seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

// Run the seeder
if (require.main === module) {
  main();
}

export { main as seedCustomers };