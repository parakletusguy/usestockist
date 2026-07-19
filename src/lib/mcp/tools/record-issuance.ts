import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, jsonResult, notAuthedResult, supabaseAsUser } from "../supabase";

export default defineTool({
  name: "record_issuance",
  title: "Record an issuance",
  description: "Record items issued to a recipient group. Requires an existing item id.",
  inputSchema: {
    date: z.string().describe("ISO date (YYYY-MM-DD)."),
    recipient_group: z
      .enum(["Retail", "Housekeeping", "Managers", "Cube", "Bar"])
      .describe("Recipient group receiving the issuance."),
    item_id: z.string().uuid().describe("Item id from list_items."),
    quantity: z.number().positive(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ date, recipient_group, item_id, quantity }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthedResult();
    const supabase = supabaseAsUser(ctx);
    const issuedBy = ctx.getUserEmail() ?? ctx.getUserId() ?? "mcp";
    const { data, error } = await supabase
      .from("issuance_ledger")
      .insert({ date, recipient_group, item_id, quantity, issued_by: issuedBy })
      .select()
      .single();
    if (error) return errorResult(error.message);
    return jsonResult(data, { row: data });
  },
});
