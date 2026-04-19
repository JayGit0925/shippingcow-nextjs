import { NextResponse } from 'next/server';
import { getTracking } from '@/lib/db';
import type { TrackingResult, TrackingStatus } from '@/lib/types';

const STATUS_LABELS: Record<TrackingStatus, string> = {
  pending: 'Label Created',
  in_transit: 'In Transit',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  exception: 'Exception',
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const number = searchParams.get('number')?.trim().toUpperCase();

  if (!number) {
    return NextResponse.json(
      { error: 'Provide a tracking number via ?number=...' },
      { status: 400 },
    );
  }

  const row = getTracking(number) as {
    tracking_number: string;
    status: string;
    origin: string;
    destination: string;
    est_delivery: string;
  } | undefined;

  if (!row) {
    return NextResponse.json(
      { error: `No shipment found for tracking number ${number}.` },
      { status: 404 },
    );
  }

  const status = row.status as TrackingStatus;

  const result: TrackingResult = {
    trackingNumber: row.tracking_number,
    status,
    carrier: 'ShippingCow',
    origin: row.origin,
    destination: row.destination,
    estimatedDelivery: row.est_delivery,
    // Build a synthetic event history from the current status
    events: buildEvents(status, row.origin, row.destination),
  };

  return NextResponse.json(result);
}

function buildEvents(
  status: TrackingStatus,
  origin: string,
  destination: string,
): TrackingResult['events'] {
  const now = new Date();
  const ago = (hours: number) =>
    new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();

  const allEvents: TrackingResult['events'] = [
    { timestamp: ago(72), location: origin, description: 'Shipment picked up' },
    { timestamp: ago(48), location: origin, description: 'Departed origin facility' },
    { timestamp: ago(24), location: 'In transit', description: 'In transit to destination' },
    { timestamp: ago(4), location: destination, description: 'Arrived at local delivery facility' },
    { timestamp: ago(1), location: destination, description: 'Out for delivery' },
    { timestamp: ago(0), location: destination, description: 'Delivered' },
  ];

  const cutoff: Record<TrackingStatus, number> = {
    pending: 1,
    in_transit: 3,
    out_for_delivery: 5,
    delivered: 6,
    exception: 3,
  };

  return allEvents.slice(0, cutoff[status] ?? 3);
}
