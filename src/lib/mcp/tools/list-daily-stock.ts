import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, jsonResult, notAuthedResult, supabaseAsUser } from "../supabase";

export default defineTool({
  name: "list_daily_stock_sheets",
  title: "List daily stock sheet entries",
  description:
    "List daily stock sheet entries. RLS restricts results to the caller's assigned teams (admins see all).",
  inputSchema: {
    start_date: z.string().optional().describe("Filter entries on or after this ISO date (YYYY-MM-DD)."),
    end_date: z.string().optional().describe("Filter entries on or before this ISO date (YYYY-MM-DD)."),
    team_member: z.string().optional().describe("Filter by retail team member name."),
    limit: z.number().int().positive().max(500).default(100),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ start_date, end_date, team_member, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthedResult();
    const supabase = supabaseAsUser(ctx);
    let query = supabase
      .from("daily_stock_sheets")
      .select("id, date, retail_team_name, item_id, open_qty, qty_in, close_qty, sales_qty, reach, os_status, remark, items(name, unit_of_measure)")
      .order("date", { ascending: false })
      .limit(limit);
    if (start_date) query = query.gte("date", start_date);
    if (end_date) query = query.lte("date", end_date);
    if (team_member) query = query.eq("retail_team_name", team_member);
    const { data, error } = await query;
    if (error) return errorResult(error.message);
    return jsonResult(data);
  },
});
