import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { ApiResponse, TenantMember } from "@/types";

export interface AuthContext {
  userId: string;
  tenantId: string;
  role: TenantMember["role"];
}

export async function authenticateApiRequest(
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
    return {
      error: NextResponse.json<ApiResponse>(
        { error: "Missing x-tenant-id header" },
        { status: 400 }
      ),
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
    },
  };
}
