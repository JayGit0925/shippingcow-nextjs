import { getZipCoords } from './db';

/**
 * Calculate distance between two coordinates using the Haversine formula
 * @returns Distance in miles
 */
export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth's radius in miles
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lng2 - lng1);

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Map distance (miles) to FedEx Ground zone (2-8)
 */
export function distanceToZone(miles: number): number {
  if (miles <= 150) return 2;
  if (miles <= 300) return 3;
  if (miles <= 600) return 4;
  if (miles <= 1000) return 5;
  if (miles <= 1400) return 6;
  if (miles <= 1800) return 7;
  return 8;
}

/**
 * Estimate the zone for a shipment from origin to destination ZIP
 */
export async function estimateZone(
  originZip: string,
  destZip: string
): Promise<{zone: number, distance_miles: number} | null> {
  const originCoords = await getZipCoords(originZip);
  const destCoords = await getZipCoords(destZip);

  if (!originCoords || !destCoords) {
    return null;
  }

  const distance = haversineDistance(
    originCoords.lat,
    originCoords.lng,
    destCoords.lat,
    destCoords.lng
  );

  const zone = distanceToZone(distance);

  return {
    zone,
    distance_miles: Math.round(distance * 10) / 10, // Round to 1 decimal place
  };
}

/**
 * ShippingCow warehouses with their ZIP codes and coordinates
 */
export const WAREHOUSES = [
  { name: 'NJ', label: 'NJ', zip: '08901', lat: 40.1839, lng: -74.2590, city: 'New Brunswick', state: 'NJ' },
  { name: 'TX', label: 'TX', zip: '77489', lat: 29.3752, lng: -95.3556, city: 'Missouri City', state: 'TX' },
  { name: 'CA', label: 'CA', zip: '91761', lat: 34.0595, lng: -117.5320, city: 'Ontario', state: 'CA' },
];

/**
 * Find the best warehouse for a destination ZIP (lowest zone, shortest distance)
 */
export async function smartRoute(destZip: string): Promise<{
  best_warehouse: string,
  zone: number,
  distance_miles: number,
  all_options: Array<{warehouse: string, zone: number, distance_miles: number}>
}> {
  const destCoords = await getZipCoords(destZip);
  if (!destCoords) {
    // Default to NJ if destination not found
    return {
      best_warehouse: 'NJ',
      zone: 5,
      distance_miles: 0,
      all_options: [],
    };
  }

  const options: Array<{warehouse: string, zone: number, distance_miles: number}> = [];

  for (const warehouse of WAREHOUSES) {
    const distance = haversineDistance(
      warehouse.lat,
      warehouse.lng,
      destCoords.lat,
      destCoords.lng
    );
    const zone = distanceToZone(distance);
    options.push({
      warehouse: warehouse.name,
      zone,
      distance_miles: Math.round(distance * 10) / 10,
    });
  }

  // Sort by zone (ascending), then by distance (ascending)
  options.sort((a, b) => {
    if (a.zone !== b.zone) return a.zone - b.zone;
    return a.distance_miles - b.distance_miles;
  });

  const best = options[0];

  return {
    best_warehouse: best.warehouse,
    zone: best.zone,
    distance_miles: best.distance_miles,
    all_options: options,
  };
}
