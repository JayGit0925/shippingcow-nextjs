import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Define headers
    const headers = ['origin_zip', 'dest_zip', 'length', 'width', 'height', 'weight', 'quantity', 'current_cost'];

    // Sample data (3 realistic examples)
    const data = [
      // Furniture shipment from LA to NYC
      { origin_zip: '90210', dest_zip: '10001', length: 48, width: 24, height: 18, weight: 85, quantity: 1, current_cost: 125.50 },
      // Multiple light boxes from Chicago to Atlanta
      { origin_zip: '60601', dest_zip: '30303', length: 24, width: 18, height: 16, weight: 45, quantity: 5, current_cost: 28.75 },
      // Fitness equipment from Dallas to Miami
      { origin_zip: '75201', dest_zip: '33101', length: 36, width: 30, height: 20, weight: 120, quantity: 1, current_cost: 156.25 },
    ];

    // Create worksheet from data with headers
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data.map((row) => [
      row.origin_zip,
      row.dest_zip,
      row.length,
      row.width,
      row.height,
      row.weight,
      row.quantity,
      row.current_cost,
    ])]);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 12 }, // origin_zip
      { wch: 12 }, // dest_zip
      { wch: 10 }, // length
      { wch: 10 }, // width
      { wch: 10 }, // height
      { wch: 10 }, // weight
      { wch: 10 }, // quantity
      { wch: 14 }, // current_cost
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Shipments');

    // Generate buffer
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    // Return as downloadable file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="ShippingCow_Audit_Template.xlsx"',
      },
    });
  } catch (err) {
    console.error('[audit template]', err);
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    );
  }
}
