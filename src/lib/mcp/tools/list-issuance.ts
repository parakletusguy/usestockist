import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, jsonResult, notAuthedResult, supabaseAsUser } from "../supabase";

export default defineTool({
  name: "list_issuance",
  title: "List issuance ledger",
  description: "List items issued to recipient groups (Retail, Housekeeping, Managers, Cube, Bar).",
  inputSchema: {
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    recipient_group: z.string().optional(),
    limit: z.number().int().positive().max(500).default(100),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ start_date, end_date, recipient_group, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthedResult();
    const supabase = supabaseAsUser(ctx);
    let query = supabase
      .from("issuance_ledger")
      .select("id, date, recipient_group, item_id, quantity, issued_by, items(name, unit_of_measure)")
      .order("date", { ascending: false })
      .limit(limit);
    if (start_date) query = query.gte("date", start_date);
    if (end_date) query = query.lte("date", end_date);
    if (recipient_group) query = query.eq("recipient_group", recipient_group);
    const { data, error } = await query;
    if (error) return errorResult(error.message);
    return jsonResult(data);
  },
});
