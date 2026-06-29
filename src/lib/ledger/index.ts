import { createHmac } from "crypto";
import { createServiceClient } from "@/lib/supabase/server";
import type { LedgerEntryType } from "@/types";

function signEntry(payload: string): string {
  const secret = process.env.LEDGER_SIGNING_SECRET || "dev-secret";
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export async function recordLedgerEntry(params: {
  tenantId: string;
  entryType: LedgerEntryType;
  amountCents: number;
  creditsDelta: number;
  currency?: string;
  referenceType?: string;
  referenceId?: string;
  description?: string;
  idempotencyKey?: string;
}) {
  const supabase = await createServiceClient();

  const payload = JSON.stringify({
    tenant_id: params.tenantId,
    entry_type: params.entryType,
    amount_cents: params.amountCents,
    credits_delta: params.creditsDelta,
    ts: Date.now(),
  });

  const signature = signEntry(payload);

  const { data, error } = await supabase
    .from("ledger_entries")
    .insert({
      tenant_id: params.tenantId,
      entry_type: params.entryType,
      amount_cents: params.amountCents,
      currency: params.currency || "USD",
      credits_delta: params.creditsDelta,
      reference_type: params.referenceType,
      reference_id: params.referenceId,
      description: params.description,
      idempotency_key: params.idempotencyKey,
      signature,
    })
    .select()
    .single();

  if (error) throw new Error(`Ledger write failed: ${error.message}`);

  if (params.creditsDelta !== 0) {
    const { data: tenant } = await supabase
      .from("tenants")
      .select("credits_remaining")
      .eq("id", params.tenantId)
      .single();

    if (tenant) {
      const { error: updateError } = await supabase
        .from("tenants")
        .update({
          credits_remaining: tenant.credits_remaining + params.creditsDelta,
        })
        .eq("id", params.tenantId);

      if (updateError) {
        console.error("Credit update failed, ledger entry exists:", data.id);
      }
    }
  }

  return data;
}

export async function deductCredits(
  tenantId: string,
  amount: number,
  referenceType: string,
  referenceId: string,
  description: string
) {
  const supabase = await createServiceClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("credits_remaining")
    .eq("id", tenantId)
    .single();

  if (!tenant || tenant.credits_remaining < amount) {
    throw new Error("Insufficient credits");
  }

  await supabase
    .from("tenants")
    .update({ credits_remaining: tenant.credits_remaining - amount })
    .eq("id", tenantId);

  return recordLedgerEntry({
    tenantId,
    entryType: "credit_deduction",
    amountCents: 0,
    creditsDelta: -amount,
    referenceType,
    referenceId,
    description,
  });
}
