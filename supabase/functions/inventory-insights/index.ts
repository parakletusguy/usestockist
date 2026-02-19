import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Validate JWT token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create client with user's token to validate auth
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;

    // Use service role client to check user's role and team
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    const [rolesRes, teamsRes] = await Promise.all([
      serviceClient.from("user_roles").select("role").eq("user_id", userId),
      serviceClient.from("user_teams").select("team_name").eq("user_id", userId),
    ]);

    const isAdmin = rolesRes.data?.some((r: any) => r.role === "admin") ?? false;
    const userTeams = teamsRes.data?.map((t: any) => t.team_name) ?? [];

    // Fetch inventory data - filter by team for non-admins
    let dailyQuery = serviceClient
      .from("daily_stock_sheets")
      .select("*, items(name, category)")
      .order("date", { ascending: false })
      .limit(200);

    if (!isAdmin && userTeams.length > 0) {
      dailyQuery = dailyQuery.in("retail_team_name", userTeams);
    } else if (!isAdmin && userTeams.length === 0) {
      // User has no team assignment - return no daily stock data
      dailyQuery = dailyQuery.eq("retail_team_name", "__none__");
    }

    const [itemsRes, receivedRes, issuedRes, transfersRes, dailyRes] =
      await Promise.all([
        serviceClient.from("items").select("*"),
        serviceClient
          .from("received_ledger")
          .select("*, items(name, category)")
          .order("date", { ascending: false })
          .limit(200),
        serviceClient
          .from("issuance_ledger")
          .select("*, items(name, category)")
          .order("date", { ascending: false })
          .limit(200),
        serviceClient
          .from("transfer_ledger")
          .select("*, items(name, category)")
          .order("date", { ascending: false })
          .limit(200),
        dailyQuery,
      ]);

    const inventoryContext = JSON.stringify({
      items: itemsRes.data?.slice(0, 50),
      received: receivedRes.data?.slice(0, 100),
      issued: issuedRes.data?.slice(0, 100),
      transfers: transfersRes.data?.slice(0, 100),
      daily_stock: dailyRes.data?.slice(0, 100),
    });

    const teamInfo = isAdmin
      ? "This user is an admin and can see all teams' data."
      : `This user belongs to team(s): ${userTeams.join(", ") || "none"}. Only show data relevant to their team(s). Do NOT reveal data from other teams.`;

    const systemPrompt = `You are an inventory insights assistant for a stock management app called Stockist. You have access to the following live inventory data:

${inventoryContext}

Tables available:
- items: product catalog (name, category, unit_of_measure)
- received_ledger: items received (date, item, quantity, supplier, invoice)
- issuance_ledger: items issued (date, item, quantity, recipient_group, issued_by)
- transfer_ledger: items transferred (date, item, quantity, destination, reason)
- daily_stock_sheets: daily stock tracking (date, item, open_qty, qty_in, sales_qty, close_qty, reach, os_status)

${teamInfo}

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
