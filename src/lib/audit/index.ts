import { createServiceClient } from "@/lib/supabase/server";

export async function recordAudit(params: {
  tenantId: string;
  actorId: string | null;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}) {
  const supabase = await createServiceClient();

  await supabase.from("audit_log").insert({
    tenant_id: params.tenantId,
    actor_id: params.actorId,
    action: params.action,
    resource_type: params.resourceType,
    resource_id: params.resourceId,
    metadata: params.metadata || {},
    ip_address: params.ipAddress,
  });
}
