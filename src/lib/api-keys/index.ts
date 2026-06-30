import { createHmac, randomBytes } from "crypto";
import { createServiceClient } from "@/lib/supabase/server";

const KEY_PREFIX = "nx";

export function generateApiKey(): { raw: string; prefix: string; hash: string } {
  const secret = randomBytes(32).toString("base64url");
  const raw = `${KEY_PREFIX}_${secret}`;
  const prefix = `${KEY_PREFIX}_${secret.slice(0, 8)}`;
  const hash = createHmac("sha256", process.env.LEDGER_SIGNING_SECRET || "dev-secret")
    .update(raw)
    .digest("hex");
  return { raw, prefix, hash };
}

export function hashApiKey(raw: string): string {
  return createHmac("sha256", process.env.LEDGER_SIGNING_SECRET || "dev-secret")
    .update(raw)
    .digest("hex");
}

export async function validateApiKey(raw: string) {
  if (!raw.startsWith(`${KEY_PREFIX}_`)) return null;

  const hash = hashApiKey(raw);
  const prefix = `${KEY_PREFIX}_${raw.slice(3, 11)}`;
  const supabase = await createServiceClient();

  const { data: key } = await supabase
    .from("api_keys")
    .select("id, tenant_id, scopes, rate_limit_rpm, expires_at, revoked_at")
    .eq("key_prefix", prefix)
    .eq("key_hash", hash)
    .single();

  if (!key) return null;
  if (key.revoked_at) return null;
  if (key.expires_at && new Date(key.expires_at) < new Date()) return null;

  await supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", key.id);

  return {
    keyId: key.id,
    tenantId: key.tenant_id,
    scopes: key.scopes as string[],
    rateLimitRpm: key.rate_limit_rpm,
  };
}
