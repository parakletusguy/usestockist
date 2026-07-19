import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listItems from "./tools/list-items";
import listDailyStock from "./tools/list-daily-stock";
import listIssuance from "./tools/list-issuance";
import listTransfers from "./tools/list-transfers";
import listReceived from "./tools/list-received";
import listWeeklyCount from "./tools/list-weekly-count";
import recordIssuance from "./tools/record-issuance";
import recordReceived from "./tools/record-received";
import recordTransfer from "./tools/record-transfer";

// The OAuth issuer MUST be the direct Supabase host, built from the project ref.
// Vite inlines VITE_SUPABASE_PROJECT_ID at build time so this stays import-safe
// (no runtime env read). The fallback keeps the issuer well-formed during the
// throwaway manifest-extract eval where no token verifies against it.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "stockist-mcp",
  title: "Stockist MCP",
  version: "0.1.0",
  instructions:
    "Tools for the Stockist inventory app. Use list_* tools to inspect items, ledgers, and stock sheets. Use record_* tools to add new issuance, received, or transfer entries. All operations run as the signed-in user and respect team-based row-level security (non-admins only see data for their assigned retail teams).",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listItems,
    listDailyStock,
    listIssuance,
    listTransfers,
    listReceived,
    listWeeklyCount,
    recordIssuance,
    recordReceived,
    recordTransfer,
  ],
});
