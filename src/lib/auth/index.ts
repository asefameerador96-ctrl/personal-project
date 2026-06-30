import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createServiceClient } from "@/lib/supabase/server";
import { validateApiKey } from "@/lib/api-keys";
import { checkRateLimit } from "@/lib/rate-limit";
import type { ApiResponse, TenantMember } from "@/types";

export interface AuthContext {
  userId: string;
  tenantId: string;
  role: TenantMember["role"];
  authMethod: "session" | "api_key";
  keyId?: string;
}

export async function authenticateApiRequest(
  request: NextRequest,
  requiredScope?: string
): Promise<{ ctx: AuthContext } | { error: NextResponse<ApiResponse> }> {
  const authHeader = request.headers.get("authorization");

  if (authHeader?.startsWith("Bearer nx_")) {
    return authenticateWithApiKey(authHeader.slice(7), requiredScope);
  }

  return authenticateWithSession(request);
}

async function authenticateWithApiKey(
  raw: string,
  requiredScope?: string
): Promise<{ ctx: AuthContext } | { error: NextResponse<ApiResponse> }> {
  const key = await validateApiKey(raw);

  if (!key) {
    return {
      error: NextResponse.json<ApiResponse>(
        { error: "Invalid or expired API key" },
        { status: 401 }
      ),
    };
  }

  if (requiredScope && !key.scopes.includes(requiredScope)) {
    return {
      error: NextResponse.json<ApiResponse>(
        { error: `API key missing required scope: ${requiredScope}` },
        { status: 403 }
      ),
    };
  }

  const rateCheck = checkRateLimit(`apikey:${key.keyId}`, key.rateLimitRpm);
  if (!rateCheck.allowed) {
    return {
      error: NextResponse.json<ApiResponse>(
        { error: "Rate limit exceeded" },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(key.rateLimitRpm),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(rateCheck.resetAt / 1000)),
            "Retry-After": String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)),
          },
        }
      ),
    };
  }

  return {
    ctx: {
      userId: "",
      tenantId: key.tenantId,
      role: "member",
      authMethod: "api_key",
      keyId: key.keyId,
    },
  };
}

async function authenticateWithSession(
  request: NextRequest
): Promise<{ ctx: AuthContext } | { error: NextResponse<ApiResponse> }> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {},
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      error: NextResponse.json<ApiResponse>(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    const serviceClient = await createServiceClient();
    const { data: membership } = await serviceClient
      .from("tenant_members")
      .select("tenant_id, role")
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return {
        error: NextResponse.json<ApiResponse>(
          { error: "No tenant found" },
          { status: 404 }
        ),
      };
    }

    return {
      ctx: {
        userId: user.id,
        tenantId: membership.tenant_id,
        role: membership.role as TenantMember["role"],
        authMethod: "session",
      },
    };
  }

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return {
      error: NextResponse.json<ApiResponse>(
        { error: "Forbidden: not a member of this tenant" },
        { status: 403 }
      ),
    };
  }

  return {
    ctx: {
      userId: user.id,
      tenantId,
      role: membership.role as TenantMember["role"],
      authMethod: "session",
    },
  };
}

export async function getDashboardAuth(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {},
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const serviceClient = await createServiceClient();
  const { data: membership } = await serviceClient
    .from("tenant_members")
    .select("tenant_id, role")
    .eq("user_id", user.id)
    .single();

  if (!membership) return null;

  return {
    userId: user.id,
    tenantId: membership.tenant_id,
    role: membership.role as TenantMember["role"],
  };
}
