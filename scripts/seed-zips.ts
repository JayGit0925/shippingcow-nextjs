import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import postgres from 'postgres';

// Load DATABASE_URL from .env.local
const envPath = path.join(__dirname, '../.env.local');
let DATABASE_URL = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const match = trimmed.match(/^DATABASE_URL\s*=\s*(.+)$/);
      if (match) {
        DATABASE_URL = match[1].trim().replace(/^["']|["']$/g, '');
      }
    }
  });
}

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env.local');
  process.exit(1);
}

console.log(`✅ Database URL loaded: ${DATABASE_URL.substring(0, 50)}...`);

const sql = postgres(DATABASE_URL, {
  ssl: 'require',
  prepare: false,
  max: 10,
});

const BATCH_SIZE = 1000;
const SCRIPT_DIR = __dirname;

async function seedZips(): Promise<void> {
  try {
    // Find Excel file in scripts folder
    const files = fs.readdirSync(SCRIPT_DIR);
    const excelFile = files.find((f) => f.includes('simplemaps_uszips') && (f.endsWith('.xlsx') || f.endsWith('.xls')));

    if (!excelFile) {
      console.error('❌ Excel file not found in scripts folder');
      console.error('\n📥 Please download from: https://simplemaps.com/static/data/us-zips/1.91/basic/simplemaps_uszips_basicv1.91.zip');
      console.error('📦 Extract the ZIP and place the Excel file in:', SCRIPT_DIR);
      console.error('   (It should be named something like simplemaps_uszips_basicv1.91.xlsx)');
      process.exit(1);
    }

    const excelPath = path.join(SCRIPT_DIR, excelFile);
    console.log(`📄 Reading Excel file: ${excelFile}...`);

    const workbook = XLSX.readFile(excelPath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    if (rows.length === 0) {
      throw new Error('Excel file is empty or cannot be read');
    }

    // Normalize header names
    const firstRow = rows[0] as Record<string, any>;
    const headers = Object.keys(firstRow).map((h) => h.toLowerCase());

    // Find column indices
    const zipKey = headers.find((h) => h.includes('zip')) || Object.keys(firstRow)[0];
    const latKey = headers.find((h) => h.includes('lat')) || Object.keys(firstRow)[1];
    const lngKey = headers.find((h) => h.includes('lng') || h.includes('long')) || Object.keys(firstRow)[2];
    const cityKey = headers.find((h) => h.includes('city')) || Object.keys(firstRow)[3];
    const stateKey = headers.find((h) => h.includes('state')) || Object.keys(firstRow)[4];

    if (!zipKey || !latKey || !lngKey) {
      throw new Error(`Missing required columns. Found: ${Object.keys(firstRow).join(', ')}`);
    }

    // Parse rows and batch insert
    console.log(`🔄 Seeding ${rows.length} ZIP codes...`);
    let insertedCount = 0;
    let skippedCount = 0;
    let batch: Array<{zip: string, lat: number, lng: number, city: string | null, state: string | null}> = [];

    for (const row of rows) {
      const r = row as Record<string, unknown>;
      const zip = String(r[zipKey]).trim();
      const lat = parseFloat(String(r[latKey]));
      const lng = parseFloat(String(r[lngKey]));
      const city = r[cityKey] ? String(r[cityKey]).trim() : null;
      const state = r[stateKey] ? String(r[stateKey]).trim() : null;

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
