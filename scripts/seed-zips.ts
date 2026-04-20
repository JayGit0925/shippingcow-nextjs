import { sql } from '../lib/db';
import * as fs from 'fs';
import * as path from 'path';

const BATCH_SIZE = 1000;
const CSV_PATH = path.join(__dirname, 'simplemaps_uszips_basicv1.91.csv');

async function seedZips(): Promise<void> {
  try {
    // Check if CSV exists
    if (!fs.existsSync(CSV_PATH)) {
      console.error('❌ CSV file not found at:', CSV_PATH);
      console.error('\n📥 Please download from: https://simplemaps.com/static/data/us-zips/1.91/basic/simplemaps_uszips_basicv1.91.zip');
      console.error('📦 Extract and place the CSV file at:', CSV_PATH);
      process.exit(1);
    }

    // Parse CSV
    console.log(`📄 Parsing CSV file...`);
    const data = fs.readFileSync(CSV_PATH, 'utf-8');
    const lines = data.split('\n').filter((line) => line.trim());
    const header = lines[0].split(',').map((h) => h.trim().toLowerCase());

    // Find column indices
    const zipIdx = header.findIndex((h) => h.includes('zip'));
    const latIdx = header.findIndex((h) => h.includes('lat'));
    const lngIdx = header.findIndex((h) => h.includes('lng') || h.includes('long'));
    const cityIdx = header.findIndex((h) => h.includes('city'));
    const stateIdx = header.findIndex((h) => h.includes('state'));

    if (zipIdx === -1 || latIdx === -1 || lngIdx === -1) {
      throw new Error(`Missing required columns. Found: ${header.join(', ')}`);
    }

    // Parse rows and batch insert
    console.log(`🔄 Seeding ${lines.length - 1} ZIP codes...`);
    let insertedCount = 0;
    let skippedCount = 0;
    let batch: Array<{zip: string, lat: number, lng: number, city: string | null, state: string | null}> = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim().replace(/^"(.+)"$/, '$1'));

      const zip = parts[zipIdx];
      const lat = parseFloat(parts[latIdx]);
      const lng = parseFloat(parts[lngIdx]);
      const city = parts[cityIdx] || null;
      const state = parts[stateIdx] || null;

      if (!zip || isNaN(lat) || isNaN(lng)) {
        skippedCount++;
        continue;
      }

      batch.push({
        zip: zip.padStart(5, '0'),
        lat,
        lng,
        city,
        state,
      });

      // Insert batch when it reaches BATCH_SIZE
      if (batch.length >= BATCH_SIZE) {
        await insertBatch(batch);
        insertedCount += batch.length;
        console.log(`   ✓ Inserted ${insertedCount} rows...`);
        batch = [];
      }
    }

    // Insert remaining rows
    if (batch.length > 0) {
      await insertBatch(batch);
      insertedCount += batch.length;
    }

    console.log(`\n✅ Seeding complete!`);
    console.log(`   Inserted: ${insertedCount} ZIP codes`);
    console.log(`   Skipped: ${skippedCount} invalid rows`);

  } catch (err) {
    console.error('❌ Seed failed:', err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

async function insertBatch(
  batch: Array<{zip: string, lat: number, lng: number, city: string | null, state: string | null}>
): Promise<void> {
  // Construct multi-row insert
  const values = batch
    .map((row, idx) => `($${idx * 5 + 1}, $${idx * 5 + 2}, $${idx * 5 + 3}, $${idx * 5 + 4}, $${idx * 5 + 5})`)
    .join(',');

  const flatParams = batch.flatMap((row) => [row.zip, row.lat, row.lng, row.city, row.state]);

  const query = `
    INSERT INTO zip_coords (zip, lat, lng, city, state)
    VALUES ${values}
    ON CONFLICT (zip) DO NOTHING
  `;

  try {
    await sql.unsafe(query, flatParams);
  } catch (err) {
    console.error('Insert error:', err);
    throw err;
  }
}

// Run the seed
seedZips().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
