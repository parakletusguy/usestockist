import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, jsonResult, notAuthedResult, supabaseAsUser } from "../supabase";

export default defineTool({
  name: "record_received",
  title: "Record a receipt from a supplier",
  description: "Record items received from a supplier. Requires an existing item id.",
  inputSchema: {
    date: z.string().describe("ISO date (YYYY-MM-DD)."),
    supplier: z.string().min(1),
    item_id: z.string().uuid(),
    quantity: z.number().positive(),
    invoice_number: z.string().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ date, supplier, item_id, quantity, invoice_number }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthedResult();
    const supabase = supabaseAsUser(ctx);
    const { data, error } = await supabase
      .from("received_ledger")
      .insert({ date, supplier, item_id, quantity, invoice_number: invoice_number ?? null })
      .select()
      .single();
    if (error) return errorResult(error.message);
    return jsonResult(data, { row: data });
  },
});
