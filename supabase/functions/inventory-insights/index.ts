import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Get auth token from request
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch inventory data for context
    const [itemsRes, receivedRes, issuedRes, transfersRes, dailyRes] =
      await Promise.all([
        supabase.from("items").select("*"),
        supabase
          .from("received_ledger")
          .select("*, items(name, category)")
          .order("date", { ascending: false })
          .limit(200),
        supabase
          .from("issuance_ledger")
          .select("*, items(name, category)")
          .order("date", { ascending: false })
          .limit(200),
        supabase
          .from("transfer_ledger")
          .select("*, items(name, category)")
          .order("date", { ascending: false })
          .limit(200),
        supabase
          .from("daily_stock_sheets")
          .select("*, items(name, category)")
          .order("date", { ascending: false })
          .limit(200),
      ]);

    const inventoryContext = JSON.stringify({
      items: itemsRes.data?.slice(0, 50),
      received: receivedRes.data?.slice(0, 100),
      issued: issuedRes.data?.slice(0, 100),
      transfers: transfersRes.data?.slice(0, 100),
      daily_stock: dailyRes.data?.slice(0, 100),
    });

    const systemPrompt = `You are an inventory insights assistant for a stock management app called Stockist. You have access to the following live inventory data:

${inventoryContext}

Tables available:
- items: product catalog (name, category, unit_of_measure)
- received_ledger: items received (date, item, quantity, supplier, invoice)
- issuance_ledger: items issued (date, item, quantity, recipient_group, issued_by)
- transfer_ledger: items transferred (date, item, quantity, destination, reason)
- daily_stock_sheets: daily stock tracking (date, item, open_qty, qty_in, sales_qty, close_qty, reach, os_status)

Help users understand their inventory movements, trends, and anomalies. Provide specific numbers and actionable insights. Format responses clearly with bullet points and tables where appropriate. Keep answers concise but data-rich.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage credits exhausted. Please add credits in Settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("inventory-insights error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
