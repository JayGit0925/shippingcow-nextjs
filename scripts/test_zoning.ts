/**
 * ShippingCow Zoning Test — 20 sample origin→destination pairs
 * Tests zone chart lookup + haversine fallback + smartRoute
 */
import { lookupZone } from '../lib/zone-chart-data';

// Hardcoded warehouse coords (from lib/zone.ts WAREHOUSES) to avoid DB dependency
const WAREHOUSES = [
  { name: 'NJ', zip: '08901', lat: 40.1839, lng: -74.2590 },
  { name: 'TX', zip: '77489', lat: 29.3752, lng: -95.3556 },
  { name: 'CA', zip: '91761', lat: 34.0595, lng: -117.5320 },
] as const;

// Haversine distance (miles)
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const φ1 = toRad(lat1), φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1), Δλ = toRad(lng2 - lng1);
  const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Map miles → FedEx Ground zone (2-8)
function distanceToZone(miles: number): number {
  if (miles <= 150) return 2;
  if (miles <= 300) return 3;
  if (miles <= 600) return 4;
  if (miles <= 1000) return 5;
  if (miles <= 1400) return 6;
  if (miles <= 1800) return 7;
  return 8;
}

// City/ZIP reference data for readable output
const CITY_LOOKUP: Record<string, string> = {
  '08901': 'New Brunswick, NJ',
  '77489': 'Missouri City, TX',
  '91761': 'Ontario, CA',
  '10001': 'New York, NY',
  '90001': 'Los Angeles, CA',
  '77001': 'Houston, TX',
  '33101': 'Miami, FL',
  '60601': 'Chicago, IL',
  '98101': 'Seattle, WA',
  '02101': 'Boston, MA',
  '94101': 'San Francisco, CA',
  '30301': 'Atlanta, GA',
  '80201': 'Denver, CO',
  '85001': 'Phoenix, AZ',
  '75201': 'Dallas, TX',
  '19101': 'Philadelphia, PA',
  '48201': 'Detroit, MI',
  '55401': 'Minneapolis, MN',
  '97201': 'Portland, OR',
  '89101': 'Las Vegas, NV',
  '64101': 'Kansas City, MO',
  '70101': 'New Orleans, LA',
  '37201': 'Nashville, TN',
  '45201': 'Cincinnati, OH',
  '32201': 'Jacksonville, FL',
};

function cityName(zip: string): string {
  return CITY_LOOKUP[zip] ?? zip;
}

// ─── 20 TEST SAMPLES ──────────────────────────────────────

interface TestCase {
  originZip: string;
  destZip: string;
}

const SAMPLES: TestCase[] = [
  // NJ warehouse → nearby / mid / far
  { originZip: '08901', destZip: '10001' },  // NJ → NYC (zone 2 expected)
  { originZip: '08901', destZip: '19101' },  // NJ → Philadelphia
  { originZip: '08901', destZip: '02101' },  // NJ → Boston
  { originZip: '08901', destZip: '33101' },  // NJ → Miami (zone 5-6)
  { originZip: '08901', destZip: '90001' },  // NJ → LA (zone 8)

  // TX warehouse
  { originZip: '77489', destZip: '77001' },  // TX → Houston (zone 2)
  { originZip: '77489', destZip: '75201' },  // TX → Dallas
  { originZip: '77489', destZip: '60601' },  // TX → Chicago
  { originZip: '77489', destZip: '98101' },  // TX → Seattle
  { originZip: '77489', destZip: '02101' },  // TX → Boston (zone 7)

  // CA warehouse
  { originZip: '91761', destZip: '90001' },  // CA → LA (zone 2)
  { originZip: '91761', destZip: '94101' },  // CA → SF
  { originZip: '91761', destZip: '98101' },  // CA → Seattle
  { originZip: '91761', destZip: '85001' },  // CA → Phoenix
  { originZip: '91761', destZip: '10001' },  // CA → NYC (zone 8)

  // Cross-country stress tests
  { originZip: '91761', destZip: '33101' },  // CA → Miami (zone 8)
  { originZip: '08901', destZip: '98101' },  // NJ → Seattle (zone 8)
  { originZip: '77489', destZip: '94101' },  // TX → SF
  { originZip: '77489', destZip: '89101' },  // TX → Las Vegas
  { originZip: '08901', destZip: '60601' },  // NJ → Chicago
];

// ─── DESTINATION COORDINATES (hardcoded, no DB needed) ──

const DEST_COORDS: Record<string, {lat:number,lng:number}> = {
  '10001': {lat:40.7128,lng:-74.0060},
  '19101': {lat:39.9526,lng:-75.1652},
  '02101': {lat:42.3601,lng:-71.0589},
  '33101': {lat:25.7617,lng:-80.1918},
  '90001': {lat:33.9425,lng:-118.2551},
  '77001': {lat:29.7604,lng:-95.3698},
  '75201': {lat:32.7767,lng:-96.7970},
  '60601': {lat:41.8781,lng:-87.6298},
  '98101': {lat:47.6062,lng:-122.3321},
  '94101': {lat:37.7749,lng:-122.4194},
  '85001': {lat:33.4484,lng:-112.0740},
  '89101': {lat:36.1699,lng:-115.1398},
  '30301': {lat:33.7490,lng:-84.3880},
  '80201': {lat:39.7392,lng:-104.9903},
  '48201': {lat:42.3314,lng:-83.0458},
  '55401': {lat:44.9778,lng:-93.2650},
  '97201': {lat:45.5152,lng:-122.6784},
  '64101': {lat:39.0997,lng:-94.5786},
  '70101': {lat:29.9511,lng:-90.0715},
  '37201': {lat:36.1627,lng:-86.7816},
  '32201': {lat:30.3322,lng:-81.6557},
};

function getDestCoords(zip: string): {lat:number,lng:number} {
  return DEST_COORDS[zip] ?? {lat:39.8283, lng:-98.5795}; // US centroid fallback
}

// ─── RUN TESTS ───────────────────────────────────────────

console.log('╔══════════════════════════════════════════════════════════════════╗');
console.log('║          🐄  SHIPPINGCOW ZONE TEST — 20 Samples                 ║');
console.log('╚══════════════════════════════════════════════════════════════════╝\n');

let chartHits = 0;
let fallbacks = 0;
let totalTests = 0;

for (const { originZip, destZip } of SAMPLES) {
  totalTests++;
  const originPrefix = originZip.slice(0, 3);
  const destPrefix = destZip.slice(0, 3);

  // Find warehouse coords
  const wh = WAREHOUSES.find(w => w.zip === originZip);
  if (!wh) {
    console.log(`SKIP: Unknown warehouse ZIP ${originZip}`);
    continue;
  }

  // Real USPS zone chart lookup
  const chartZone = lookupZone(originPrefix, destPrefix);
  const source = chartZone !== null ? 'chart' : 'haversine';
  if (chartZone !== null) chartHits++;
  else fallbacks++;

  const coords = getDestCoords(destZip);
  const distance = Math.round(haversineDistance(wh.lat, wh.lng, coords.lat, coords.lng) * 10) / 10;
  const haversineZone = distanceToZone(distance);
  const zone = chartZone ?? haversineZone;

  // Format output
  const originCity = cityName(originZip);
  const destCity = cityName(destZip);
  const sourceTag = source === 'chart' ? '📊 chart' : '🧭 haversine';
  const delta = chartZone !== null && chartZone !== haversineZone
    ? ` (haversine would say zone ${haversineZone})`
    : '';

  console.log(
    `${String(totalTests).padStart(2)}. ${originCity.padEnd(18)} → ${destCity.padEnd(20)} ` +
    `Zone ${zone}  |  ${String(distance).padStart(6)} mi  |  ${sourceTag}${delta}`
  );
}

// ─── SMART ROUTE TEST ───────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════════════════╗');
console.log('║          🧠  SMART ROUTE — Best Warehouse per Destination        ║');
console.log('╚══════════════════════════════════════════════════════════════════╝\n');

const ROUTE_DESTS = [
  '10001','90001','77001','33101','60601','98101','94101','30301','80201','85001',
  '75201','19101','48201','55401','97201','89101','64101','70101','37201','32201',
];

for (const destZip of ROUTE_DESTS) {
  const destPrefix = destZip.slice(0, 3);
  const coords = getDestCoords(destZip);

  const options = WAREHOUSES.map(wh => {
    const whPrefix = wh.zip.slice(0, 3);
    const chartZ = lookupZone(whPrefix, destPrefix);
    const dist = haversineDistance(wh.lat, wh.lng, coords.lat, coords.lng);
    return {
      warehouse: wh.name,
      zone: chartZ ?? distanceToZone(dist),
      distance_miles: Math.round(dist * 10) / 10,
      source: chartZ !== null ? 'chart' : 'hav',
    };
  });

  options.sort((a, b) => {
    if (a.zone !== b.zone) return a.zone - b.zone;
    return a.distance_miles - b.distance_miles;
  });

  const best = options[0];
  console.log(
    `${cityName(destZip).padEnd(20)} ` +
    `→ ${best.warehouse} (zone ${best.zone}, ${String(best.distance_miles).padStart(5)} mi)  ` +
    `|  others: ${options.filter(o=>o.warehouse!==best.warehouse).map(o=>`${o.warehouse}:z${o.zone}`).join(', ')}`
  );
}

// ─── SUMMARY ────────────────────────────────────────────

console.log(`\n📈  SUMMARY: ${totalTests} zone tests | ${chartHits} chart hits | ${fallbacks} fallbacks`);
console.log(`   Chart coverage: ${((chartHits/totalTests)*100).toFixed(1)}%\n`);
