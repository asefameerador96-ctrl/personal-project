import { NextRequest, NextResponse } from "next/server";
import { getDashboardAuth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { recordAudit } from "@/lib/audit";
import { PLANS } from "@/types";
import type { ApiResponse, Plan, WebhookEvent } from "@/types";
import { randomBytes } from "crypto";

const VALID_EVENTS: WebhookEvent[] = [
  "job.completed",
  "workflow.completed",
  "workflow.failed",
  "credits.low",
  "member.joined",
];

export async function GET(request: NextRequest) {
  const auth = await getDashboardAuth(request);
  if (!auth) {
    return NextResponse.json<ApiResponse>({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServiceClient();
  const { data } = await supabase
    .from("webhooks")
    .select("id, url, events, active, failure_count, last_triggered_at, created_at")
    .eq("tenant_id", auth.tenantId)
    .order("created_at", { ascending: false });

  return NextResponse.json<ApiResponse>({ data: data || [] });
}

export async function POST(request: NextRequest) {
  const auth = await getDashboardAuth(request);
  if (!auth || !["owner", "admin"].includes(auth.role)) {
    return NextResponse.json<ApiResponse>({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const url = body.url as string;
  const events = (body.events as string[]) || VALID_EVENTS;

  if (!url || !url.startsWith("https://")) {
    return NextResponse.json<ApiResponse>({ error: "HTTPS URL required" }, { status: 400 });
  }

  const invalidEvents = events.filter((e) => !VALID_EVENTS.includes(e as WebhookEvent));
  if (invalidEvents.length) {
    return NextResponse.json<ApiResponse>({ error: `Invalid events: ${invalidEvents.join(", ")}` }, { status: 400 });
  }

  const supabase = await createServiceClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("plan")
    .eq("id", auth.tenantId)
    .single();

  const plan = PLANS[(tenant?.plan || "free") as Plan];

  const { count } = await supabase
    .from("webhooks")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", auth.tenantId)
    .eq("active", true);

  if ((count || 0) >= plan.webhooks_limit) {
    return NextResponse.json<ApiResponse>(
      { error: `Webhook limit reached (${plan.webhooks_limit}). Upgrade your plan.` },
      { status: 403 }
    );
  }

  const secret = `whsec_${randomBytes(24).toString("base64url")}`;

  const { data: webhook, error } = await supabase
    .from("webhooks")
    .insert({
      tenant_id: auth.tenantId,
      url,
      events,
      secret,
    })
    .select("id, url, events, active, created_at")
    .single();

  if (error) {
    return NextResponse.json<ApiResponse>({ error: "Failed to create webhook" }, { status: 500 });
  }

  await recordAudit({
    tenantId: auth.tenantId,
    actorId: auth.userId,
    action: "webhook.created",
    resourceType: "webhook",
    resourceId: webhook.id,
    metadata: { url, events },
  });

  return NextResponse.json<ApiResponse>({ data: { ...webhook, secret } });
}

export async function DELETE(request: NextRequest) {
  const auth = await getDashboardAuth(request);
  if (!auth || !["owner", "admin"].includes(auth.role)) {
    return NextResponse.json<ApiResponse>({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const webhookId = searchParams.get("id");
  if (!webhookId) {
    return NextResponse.json<ApiResponse>({ error: "Missing webhook id" }, { status: 400 });
  }

  const supabase = await createServiceClient();

  await supabase
    .from("webhooks")
    .update({ active: false })
    .eq("id", webhookId)
    .eq("tenant_id", auth.tenantId);

  await recordAudit({
    tenantId: auth.tenantId,
    actorId: auth.userId,
    action: "webhook.deleted",
    resourceType: "webhook",
    resourceId: webhookId,
  });

  return NextResponse.json<ApiResponse>({ data: { deleted: true } });
}
