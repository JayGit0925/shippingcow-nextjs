import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Create sheet with headers and example data
    const sheetData = [
      ['origin_zip', 'dest_zip', 'length', 'width', 'height', 'weight', 'quantity', 'current_cost'],
      ['90210', '10001', 24, 18, 16, 55, 1, 125.00],
      ['60601', '33101', 12, 12, 12, 20, 2, 65.50],
      ['98101', '77001', 36, 24, 20, 85, 1, 175.25],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

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

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Shipments');

    // Generate Excel file
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=ShippingCow_Audit_Template.xlsx',
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
