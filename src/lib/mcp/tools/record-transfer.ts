import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, jsonResult, notAuthedResult, supabaseAsUser } from "../supabase";

export default defineTool({
  name: "record_transfer",
  title: "Record a transfer",
  description: "Record items transferred to another branch or business.",
  inputSchema: {
    date: z.string().describe("ISO date (YYYY-MM-DD)."),
    destination: z.string().min(1),
    item_id: z.string().uuid(),
    quantity: z.number().positive(),
    reason: z.string().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ date, destination, item_id, quantity, reason }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthedResult();
    const supabase = supabaseAsUser(ctx);
    const { data, error } = await supabase
      .from("transfer_ledger")
      .insert({ date, destination, item_id, quantity, reason: reason ?? null })
      .select()
      .single();
    if (error) return errorResult(error.message);
    return jsonResult(data, { row: data });
  },
});
