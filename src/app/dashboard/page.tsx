import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: memberships } = await supabase
    .from("tenant_members")
    .select("tenant_id, role, tenants(id, name, slug, plan, credits_remaining)")
    .eq("user_id", user.id);

  const tenant = memberships?.[0]?.tenants as
    | {
        id: string;
        name: string;
        slug: string;
        plan: string;
        credits_remaining: number;
      }
    | undefined;

  let recentJobs: {
    id: string;
    job_type: string;
    status: string;
    created_at: string;
  }[] = [];
  let recentWorkflows: {
    id: string;
    workflow_type: string;
    status: string;
    steps_completed: number;
    steps_total: number | null;
    created_at: string;
  }[] = [];
  let totalJobs = 0;
  let totalWorkflows = 0;

  if (tenant) {
    const [jobsRes, workflowsRes, jobCountRes, wfCountRes] = await Promise.all([
      supabase
        .from("utility_jobs")
        .select("id, job_type, status, created_at")
        .eq("tenant_id", tenant.id)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("agent_workflows")
        .select(
          "id, workflow_type, status, steps_completed, steps_total, created_at"
        )
        .eq("tenant_id", tenant.id)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("utility_jobs")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenant.id),
      supabase
        .from("agent_workflows")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenant.id),
    ]);
    recentJobs = jobsRes.data || [];
    recentWorkflows = workflowsRes.data || [];
    totalJobs = jobCountRes.count || 0;
    totalWorkflows = wfCountRes.count || 0;
  }

  const hasActivity = recentJobs.length > 0 || recentWorkflows.length > 0;
  const isNewUser = !hasActivity;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {tenant ? (
        <>
          {/* Welcome header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold">
              {isNewUser ? "Welcome to Nexus! 👋" : `Welcome back`}
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              {tenant.name} &middot;{" "}
              <span className="text-green-400">
                {tenant.credits_remaining.toLocaleString()} credits available
              </span>
            </p>
          </div>

          {/* New User Onboarding */}
          {isNewUser && (
            <div className="mb-10 space-y-4">
              <div className="border border-blue-800/50 bg-blue-900/10 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-2">
                  Getting started is easy
                </h2>
                <p className="text-sm text-neutral-400 mb-6">
                  Nexus helps you automate trade paperwork. Here&apos;s how to
                  get your first result in under 60 seconds:
                </p>

                <div className="space-y-4">
                  <OnboardingStep
                    number={1}
                    title="Upload a document"
                    description="Drag any invoice, packing list, or bill of lading. We'll extract all the data automatically."
                    cta="Upload Your First Document"
                    href="/dashboard/utilities"
                    color="green"
                  />
                  <OnboardingStep
                    number={2}
                    title="Run an automation"
                    description="Let AI reconcile invoices, match shipments, or verify customs docs — no manual work needed."
                    cta="Try an Automation"
                    href="/dashboard/agents"
                    color="blue"
                  />
                  <OnboardingStep
                    number={3}
                    title="Invite your team"
                    description="Add team members so everyone can upload and review documents together."
                    cta="Invite Team Members"
                    href="/dashboard/team"
                    color="amber"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="border border-neutral-800 rounded-lg p-5">
                  <h3 className="text-sm font-medium mb-1">
                    💡 What counts as a credit?
                  </h3>
                  <p className="text-xs text-neutral-500">
                    <span className="text-green-400">1 credit</span> = 1
                    document uploaded and parsed.
                    <br />
                    <span className="text-blue-400">10 credits</span> = 1 AI
                    automation (reconciliation, matching, etc.)
                    <br />
                    You have{" "}
                    <span className="text-white font-medium">
                      {tenant.credits_remaining.toLocaleString()}
                    </span>{" "}
                    credits on the {tenant.plan} plan.
                  </p>
                </div>
                <div className="border border-neutral-800 rounded-lg p-5">
                  <h3 className="text-sm font-medium mb-1">
                    🔌 Want to connect via API?
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Developers can send documents programmatically. Generate an
                    API key, then use our REST endpoints.
                  </p>
                  <Link
                    href="/dashboard/keys"
                    className="text-xs text-blue-400 hover:text-blue-300 mt-2 inline-block"
                  >
                    Generate API Key →
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions — always visible */}
          <div className="grid sm:grid-cols-3 gap-4 mb-10">
            <Link href="/dashboard/utilities" className="block group">
              <div className="border border-neutral-800 rounded-lg p-5 hover:border-green-700 transition-colors h-full">
                <span className="text-2xl mb-3 block">📄</span>
                <h3 className="font-semibold mb-1 group-hover:text-green-400 transition-colors">
                  Upload Document
                </h3>
                <p className="text-xs text-neutral-500">
                  Parse an invoice, packing list, or bill of lading
                </p>
                <p className="text-[10px] text-green-600 mt-2">1 credit</p>
              </div>
            </Link>
            <Link href="/dashboard/agents" className="block group">
              <div className="border border-neutral-800 rounded-lg p-5 hover:border-blue-700 transition-colors h-full">
                <span className="text-2xl mb-3 block">🤖</span>
                <h3 className="font-semibold mb-1 group-hover:text-blue-400 transition-colors">
                  Run Automation
                </h3>
                <p className="text-xs text-neutral-500">
                  Reconcile invoices, match shipments, verify customs
                </p>
                <p className="text-[10px] text-blue-600 mt-2">10 credits</p>
              </div>
            </Link>
            <Link href="/dashboard/ledger" className="block group">
              <div className="border border-neutral-800 rounded-lg p-5 hover:border-amber-700 transition-colors h-full">
                <span className="text-2xl mb-3 block">💳</span>
                <h3 className="font-semibold mb-1 group-hover:text-amber-400 transition-colors">
                  Usage & Credits
                </h3>
                <p className="text-xs text-neutral-500">
                  See your credit balance, usage history, and transactions
                </p>
                <p className="text-[10px] text-amber-600 mt-2">
                  {tenant.credits_remaining.toLocaleString()} remaining
                </p>
              </div>
            </Link>
          </div>

          {/* Stats for returning users */}
          {hasActivity && (
            <div className="grid sm:grid-cols-3 gap-4 mb-10">
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold">{totalJobs}</p>
                <p className="text-xs text-neutral-500">Documents Processed</p>
              </div>
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold">{totalWorkflows}</p>
                <p className="text-xs text-neutral-500">Automations Run</p>
              </div>
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-400">
                  {tenant.credits_remaining.toLocaleString()}
                </p>
                <p className="text-xs text-neutral-500">Credits Remaining</p>
              </div>
            </div>
          )}

          {/* Recent Activity */}
          {hasActivity && (
            <div className="grid md:grid-cols-2 gap-8">
              {recentJobs.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-neutral-400 mb-4">
                    Recent Documents
                  </h2>
                  <div className="border border-neutral-800 rounded-lg divide-y divide-neutral-800">
                    {recentJobs.map((job) => (
                      <div
                        key={job.id}
                        className="px-4 py-3 flex items-center justify-between"
                      >
                        <div>
                          <span className="text-sm text-neutral-300">
                            {formatJobType(job.job_type)}
                          </span>
                          <span className="text-xs text-neutral-600 ml-2">
                            {timeAgo(job.created_at)}
                          </span>
                        </div>
                        <StatusBadge status={job.status} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {recentWorkflows.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-neutral-400 mb-4">
                    Recent Automations
                  </h2>
                  <div className="border border-neutral-800 rounded-lg divide-y divide-neutral-800">
                    {recentWorkflows.map((wf) => (
                      <div
                        key={wf.id}
                        className="px-4 py-3 flex items-center justify-between"
                      >
                        <div>
                          <span className="text-sm text-neutral-300">
                            {formatWorkflowType(wf.workflow_type)}
                          </span>
                          <span className="text-xs text-neutral-600 ml-2">
                            {timeAgo(wf.created_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {wf.steps_total && (
                            <span className="text-xs text-neutral-600">
                              {wf.steps_completed}/{wf.steps_total}
                            </span>
                          )}
                          <StatusBadge status={wf.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20">
          <h2 className="text-xl font-semibold mb-2">No organization yet</h2>
          <p className="text-neutral-400">
            Your account needs to be linked to an organization to get started.
          </p>
        </div>
      )}
    </div>
  );
}

function OnboardingStep({
  number,
  title,
  description,
  cta,
  href,
  color,
}: {
  number: number;
  title: string;
  description: string;
  cta: string;
  href: string;
  color: string;
}) {
  const colors: Record<string, string> = {
    green: "text-green-400 bg-green-400/10 border-green-800/30",
    blue: "text-blue-400 bg-blue-400/10 border-blue-800/30",
    amber: "text-amber-400 bg-amber-400/10 border-amber-800/30",
  };
  const btnColors: Record<string, string> = {
    green:
      "bg-green-600 hover:bg-green-500 text-white",
    blue: "bg-blue-600 hover:bg-blue-500 text-white",
    amber:
      "bg-amber-600 hover:bg-amber-500 text-black",
  };

  return (
    <div className="flex items-start gap-4">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${colors[color]}`}
      >
        {number}
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-neutral-500 mt-0.5 mb-2">{description}</p>
        <Link
          href={href}
          className={`inline-block text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${btnColors[color]}`}
        >
          {cta} →
        </Link>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    completed: "text-green-400 bg-green-400/10",
    running: "text-blue-400 bg-blue-400/10",
    processing: "text-blue-400 bg-blue-400/10",
    pending: "text-yellow-400 bg-yellow-400/10",
    failed: "text-red-400 bg-red-400/10",
  };
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full ${colors[status] || "text-neutral-400 bg-neutral-800"}`}
    >
      {status}
    </span>
  );
}

function formatJobType(type: string): string {
  const map: Record<string, string> = {
    pdf_to_json: "PDF Document",
    csv_normalize: "CSV Spreadsheet",
    invoice_parse: "Invoice",
    text_extract: "Text File",
  };
  return map[type] || type.replace(/_/g, " ");
}

function formatWorkflowType(type: string): string {
  const map: Record<string, string> = {
    invoice_reconciliation: "Invoice Reconciliation",
    shipment_matching: "Shipment Matching",
    erp_sync: "ERP Sync",
    customs_verification: "Customs Verification",
  };
  return map[type] || type.replace(/_/g, " ");
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
