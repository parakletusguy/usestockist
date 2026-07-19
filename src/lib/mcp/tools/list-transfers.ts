import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, jsonResult, notAuthedResult, supabaseAsUser } from "../supabase";

export default defineTool({
  name: "list_transfers",
  title: "List transfer ledger",
  description: "List items transferred to other branches/businesses.",
  inputSchema: {
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    destination: z.string().optional(),
    limit: z.number().int().positive().max(500).default(100),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ start_date, end_date, destination, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthedResult();
    const supabase = supabaseAsUser(ctx);
    let query = supabase
      .from("transfer_ledger")
      .select("id, date, destination, item_id, quantity, reason, items(name, unit_of_measure)")
      .order("date", { ascending: false })
      .limit(limit);
    if (start_date) query = query.gte("date", start_date);
    if (end_date) query = query.lte("date", end_date);
    if (destination) query = query.eq("destination", destination);
    const { data, error } = await query;
    if (error) return errorResult(error.message);
    return jsonResult(data);
  },
});
