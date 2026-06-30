import { createHmac } from "crypto";
import { createServiceClient } from "@/lib/supabase/server";

export async function dispatchWebhook(
  tenantId: string,
  eventType: string,
  payload: Record<string, unknown>
) {
  const supabase = await createServiceClient();

  const { data: webhooks } = await supabase
    .from("webhooks")
    .select("id, url, secret, events")
    .eq("tenant_id", tenantId)
    .eq("active", true);

  if (!webhooks?.length) return;

  const matching = webhooks.filter((w) =>
    (w.events as string[]).includes(eventType)
  );

  for (const webhook of matching) {
    deliverWebhook(webhook.id, webhook.url, webhook.secret, eventType, payload);
  }
}

async function deliverWebhook(
  webhookId: string,
  url: string,
  secret: string,
  eventType: string,
  payload: Record<string, unknown>
) {
  const supabase = await createServiceClient();
  const body = JSON.stringify({ event: eventType, data: payload, timestamp: new Date().toISOString() });
  const signature = createHmac("sha256", secret).update(body).digest("hex");
  const start = Date.now();

  let responseStatus: number | null = null;
  let responseBody: string | null = null;
  let success = false;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Nexus-Signature": signature,
        "X-Nexus-Event": eventType,
      },
      body,
      signal: AbortSignal.timeout(10_000),
    });

    responseStatus = res.status;
    responseBody = await res.text().catch(() => null);
    success = res.ok;
  } catch (err) {
    responseBody = err instanceof Error ? err.message : "Unknown error";
  }

  const duration = Date.now() - start;

  await supabase.from("webhook_deliveries").insert({
    webhook_id: webhookId,
    event_type: eventType,
    payload,
    response_status: responseStatus,
    response_body: responseBody?.slice(0, 1000),
    duration_ms: duration,
    success,
  });

  if (!success) {
    const { error: rpcError } = await supabase.rpc("increment_webhook_failures", { wh_id: webhookId });
    if (rpcError) {
      await supabase
        .from("webhooks")
        .update({ failure_count: 999 })
        .eq("id", webhookId);
    }
  } else {
    await supabase
      .from("webhooks")
      .update({ failure_count: 0, last_triggered_at: new Date().toISOString() })
      .eq("id", webhookId);
  }
}
