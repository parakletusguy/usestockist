import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, jsonResult, notAuthedResult, supabaseAsUser } from "../supabase";

export default defineTool({
  name: "list_weekly_stock_counts",
  title: "List weekly stock counts",
  description: "List physical stock counts by location (Main Store, 24hr Store, Cube).",
  inputSchema: {
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    location: z.string().optional(),
    limit: z.number().int().positive().max(500).default(100),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ start_date, end_date, location, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthedResult();
    const supabase = supabaseAsUser(ctx);
    let query = supabase
      .from("weekly_stock_counts")
      .select("id, date, location, item_id, physical_count, notes, items(name, unit_of_measure)")
      .order("date", { ascending: false })
      .limit(limit);
    if (start_date) query = query.gte("date", start_date);
    if (end_date) query = query.lte("date", end_date);
    if (location) query = query.eq("location", location);
    const { data, error } = await query;
    if (error) return errorResult(error.message);
    return jsonResult(data);
  },
});
