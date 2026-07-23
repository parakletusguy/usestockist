import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";

// Beta namespace not in the SDK's public types yet.
type OAuthResponse = { data: Record<string, unknown> | null; error: { message?: string } | null };
type SupabaseOAuth = {
  getAuthorizationDetails: (id: string) => Promise<OAuthResponse>;
  approveAuthorization: (id: string) => Promise<OAuthResponse>;
  denyAuthorization: (id: string) => Promise<OAuthResponse>;
};
const supabaseOAuth = (supabase.auth as unknown as { oauth: SupabaseOAuth }).oauth;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Missing authorization_id in the URL.");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        // Preserve the FULL consent URL so login/signup can send the user back here.
        const next = window.location.pathname + window.location.search;
        window.location.href = "/login?next=" + encodeURIComponent(next);
        return;
      }
      const { data, error } = await supabaseOAuth.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) {
        setError(error.message ?? "Failed to load authorization request.");
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error } = approve
      ? await supabaseOAuth.approveAuthorization(authorizationId)
      : await supabaseOAuth.denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      setError(error.message ?? "Authorization decision failed.");
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Package className="h-8 w-8 text-primary" />
            </div>
          </div>
          {error ? (
            <>
              <CardTitle className="text-2xl">Authorization error</CardTitle>
              <CardDescription>We couldn't process this connection request.</CardDescription>
            </>
          ) : !details ? (
            <>
              <CardTitle className="text-2xl">Loading…</CardTitle>
              <CardDescription>Fetching authorization details.</CardDescription>
            </>
          ) : (
            <>
              <CardTitle className="text-2xl">
                Connect {details.client?.name ?? "an app"} to Stockist
              </CardTitle>
              <CardDescription>
                {details.client?.name ?? "This client"} will be able to call Stockist tools while you are signed in.
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {error && <p className="text-destructive">{error}</p>}
          {details && !error && (
            <>
              <p className="text-muted-foreground">
                This lets {details.client?.name ?? "the client"} act as you in Stockist. Team isolation and admin-only
                rules from your account still apply.
              </p>
              {details.client?.redirect_uri && (
                <p className="text-xs text-muted-foreground break-all">
                  Redirect: {details.client.redirect_uri}
                </p>
              )}
            </>
          )}
        </CardContent>
        {details && !error && (
          <CardFooter className="flex flex-col gap-2">
            <Button className="w-full" onClick={() => decide(true)} disabled={busy}>
              {busy ? "Working…" : "Approve"}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => decide(false)} disabled={busy}>
              Cancel connection
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
