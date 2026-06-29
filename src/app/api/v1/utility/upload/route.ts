import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createServiceClient } from "@/lib/supabase/server";
import { parsePdf } from "@/lib/parsers/pdf";
import { parseCsv } from "@/lib/parsers/csv";
import { recordLedgerEntry } from "@/lib/ledger";
import type { ApiResponse } from "@/types";

export async function POST(request: NextRequest) {
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

  if (!user) {
    return NextResponse.json<ApiResponse>(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const serviceClient = await createServiceClient();

  const { data: membership } = await serviceClient
    .from("tenant_members")
    .select("tenant_id, role")
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return NextResponse.json<ApiResponse>(
      { error: "No tenant found" },
      { status: 403 }
    );
  }

  const { data: tenant } = await serviceClient
    .from("tenants")
    .select("credits_remaining")
    .eq("id", membership.tenant_id)
    .single();

  if (!tenant || tenant.credits_remaining < 1) {
    return NextResponse.json<ApiResponse>(
      { error: "Insufficient credits" },
      { status: 402 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json<ApiResponse>(
      { error: "No file provided" },
      { status: 400 }
    );
  }

  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return NextResponse.json<ApiResponse>(
      { error: "File too large (max 10MB)" },
      { status: 400 }
    );
  }

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext || !["pdf", "csv", "txt"].includes(ext)) {
    return NextResponse.json<ApiResponse>(
      { error: "Unsupported file type. Use PDF, CSV, or TXT." },
      { status: 400 }
    );
  }

  const jobType = ext === "pdf" ? "pdf_to_json" : ext === "csv" ? "csv_normalize" : "pdf_to_json";

  const filePath = `${membership.tenant_id}/${Date.now()}-${file.name}`;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await serviceClient.storage
    .from("uploads")
    .upload(filePath, buffer, { contentType: file.type });

  if (uploadError) {
    return NextResponse.json<ApiResponse>(
      { error: `Upload failed: ${uploadError.message}` },
      { status: 500 }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let result: any;
  try {
    if (ext === "pdf") {
      result = await parsePdf(buffer);
    } else if (ext === "csv") {
      const text = new TextDecoder().decode(buffer);
      result = parseCsv(text);
    } else {
      const text = new TextDecoder().decode(buffer);
      result = { text, line_count: text.split("\n").length };
    }
  } catch (e) {
    result = { error: "Parse failed", detail: String(e) };
  }

  const outputPath = `${membership.tenant_id}/${Date.now()}-output.json`;
  await serviceClient.storage
    .from("uploads")
    .upload(outputPath, JSON.stringify(result, null, 2), {
      contentType: "application/json",
    });

  const { data: job } = await serviceClient
    .from("utility_jobs")
    .insert({
      tenant_id: membership.tenant_id,
      job_type: jobType,
      status: "completed",
      input_ref: filePath,
      output_ref: outputPath,
      credits_consumed: 1,
      completed_at: new Date().toISOString(),
    })
    .select()
    .single();

  await serviceClient
    .from("tenants")
    .update({ credits_remaining: tenant.credits_remaining - 1 })
    .eq("id", membership.tenant_id);

  await recordLedgerEntry({
    tenantId: membership.tenant_id,
    entryType: "credit_deduction",
    amountCents: 0,
    creditsDelta: -1,
    referenceType: "utility_job",
    referenceId: job?.id,
    description: `${jobType}: ${file.name}`,
  });

  return NextResponse.json<ApiResponse>({
    data: {
      job,
      result,
    },
    meta: {
      credits_consumed: 1,
      credits_remaining: tenant.credits_remaining - 1,
    },
  });
}
