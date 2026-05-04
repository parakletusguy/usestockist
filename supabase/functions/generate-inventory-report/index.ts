import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import ExcelJS from "https://esm.sh/exceljs@4.3.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { startDate, endDate } = await req.json();

    if (!startDate || !endDate) {
      return new Response(
        JSON.stringify({ error: 'startDate and endDate are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Call the RPC function to get the inventory report data
    const { data, error } = await supabaseClient.rpc('get_daily_inventory_report', {
      p_start_date: startDate,
      p_end_date: endDate
    });

    if (error) {
      console.error('Error fetching inventory report:', error);
      throw error;
    }

    // Create a new Excel workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'UseStockist System';
    workbook.created = new Date();
    
    const worksheet = workbook.addWorksheet('Inventory Report');

    // Define columns based on user requirements
    worksheet.columns = [
      { header: 'Item Name', key: 'item_name', width: 30 },
      { header: 'Opening Stock', key: 'opening_stock', width: 15 },
      { header: 'Qty Received', key: 'qty_received', width: 15 },
      { header: 'Qty Sold', key: 'qty_sold', width: 15 },
      { header: 'Qty Issued', key: 'qty_issued', width: 15 },
      { header: 'Qty Transferred', key: 'qty_transferred', width: 15 },
      { header: 'Damages', key: 'damages', width: 15 },
      { header: 'Calculated Closing Stock', key: 'calculated_closing_stock', width: 25 },
      { header: 'Physical Count Variance', key: 'variance', width: 25 }
    ];

    // Style the header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F81BD' } // Blueish header
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // Add data rows and apply formatting
    data.forEach((item: any) => {
      const row = worksheet.addRow({
        item_name: item.item_name,
        opening_stock: Number(item.opening_stock) || 0,
        qty_received: Number(item.qty_received) || 0,
        qty_sold: Number(item.qty_sold) || 0,
        qty_issued: Number(item.qty_issued) || 0,
        qty_transferred: Number(item.qty_transferred) || 0,
        damages: Number(item.damages) || 0,
        calculated_closing_stock: Number(item.calculated_closing_stock) || 0,
        variance: Number(item.variance) || 0
      });

      // Apply red background if Variance is less than 0
      const varianceCell = row.getCell('variance');
      if (varianceCell.value && (varianceCell.value as number) < 0) {
        varianceCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFC7CE' } // Light red fill
        };
        varianceCell.font = { color: { argb: 'FF9C0006' } }; // Dark red text
      }
      
      // Basic borders for all cells in the row
      row.eachCell({ includeEmpty: false }, (cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Generate the Excel file as a buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Return the response as a downloadable Excel file
    return new Response(buffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Inventory_Report_${startDate}_to_${endDate}.xlsx"`,
      },
    });

  } catch (err: any) {
    console.error('Function error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
