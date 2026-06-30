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

  if (tenant) {
    const [jobsRes, workflowsRes] = await Promise.all([
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
    ]);
    recentJobs = jobsRes.data || [];
    recentWorkflows = workflowsRes.data || [];
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {tenant ? (
        <>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold">{tenant.name}</h1>
              <p className="text-sm text-neutral-500 mt-1">
                {tenant.plan} plan &mdash;{" "}
                {tenant.credits_remaining.toLocaleString()} credits remaining
              </p>
            </div>
            <span className="text-xs font-mono bg-neutral-800 text-neutral-400 px-3 py-1 rounded-full">
              /{tenant.slug}
            </span>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Link href="/dashboard/utilities" className="block">
              <div className="border border-neutral-800 rounded-lg p-6 hover:border-green-800 transition-colors group">
                <div className="text-xs font-mono text-green-400 mb-3">
                  /api/v1/utility
                </div>
                <h3 className="text-lg font-semibold mb-1 group-hover:text-green-400 transition-colors">
                  Utility Jobs
                </h3>
                <p className="text-sm text-neutral-400">
                  Parse documents, extract data, normalize formats
                </p>
                <span className="text-xs text-green-600 mt-2 block">
                  1 credit per job
                </span>
              </div>
            </Link>
            <Link href="/dashboard/agents" className="block">
              <div className="border border-neutral-800 rounded-lg p-6 hover:border-blue-800 transition-colors group">
                <div className="text-xs font-mono text-blue-400 mb-3">
                  /api/v1/agent
                </div>
                <h3 className="text-lg font-semibold mb-1 group-hover:text-blue-400 transition-colors">
                  Agent Workflows
                </h3>
                <p className="text-sm text-neutral-400">
                  AI-powered reconciliation and automation
                </p>
                <span className="text-xs text-blue-600 mt-2 block">
                  10 credits per workflow
                </span>
              </div>
            </Link>
            <Link href="/dashboard/ledger" className="block">
              <div className="border border-neutral-800 rounded-lg p-6 hover:border-amber-800 transition-colors group">
                <div className="text-xs font-mono text-amber-400 mb-3">
                  /api/v1/ledger
                </div>
                <h3 className="text-lg font-semibold mb-1 group-hover:text-amber-400 transition-colors">
                  Ledger
                </h3>
                <p className="text-sm text-neutral-400">
                  Transaction history, credits, and billing
                </p>
                <span className="text-xs text-amber-600 mt-2 block">
                  Immutable audit trail
                </span>
              </div>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {recentJobs.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">
                  Recent Utility Jobs
                </h2>
                <div className="border border-neutral-800 rounded-lg divide-y divide-neutral-800">
                  {recentJobs.map((job) => (
                    <div
                      key={job.id}
                      className="px-4 py-3 flex items-center justify-between"
                    >
                      <span className="text-xs font-mono text-neutral-400">
                        {job.job_type}
                      </span>
                      <div className="flex items-center gap-4">
                        <StatusBadge status={job.status} />
                        <span className="text-xs text-neutral-600">
                          {new Date(job.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recentWorkflows.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">
                  Recent Workflows
                </h2>
                <div className="border border-neutral-800 rounded-lg divide-y divide-neutral-800">
                  {recentWorkflows.map((wf) => (
                    <div
                      key={wf.id}
                      className="px-4 py-3 flex items-center justify-between"
                    >
                      <span className="text-xs font-mono text-neutral-400">
                        {wf.workflow_type}
                      </span>
                      <div className="flex items-center gap-4">
                        <StatusBadge status={wf.status} />
                        {wf.steps_total && (
                          <span className="text-xs text-neutral-600">
                            {wf.steps_completed}/{wf.steps_total} steps
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {recentJobs.length === 0 && recentWorkflows.length === 0 && (
            <div className="text-center py-12 border border-neutral-800 rounded-lg">
              <p className="text-neutral-500 mb-4">No activity yet</p>
              <div className="flex gap-3 justify-center">
                <Link
                  href="/dashboard/utilities"
                  className="text-sm bg-white text-black px-4 py-2 rounded-md hover:bg-neutral-200 transition-colors"
                >
                  Parse a document
                </Link>
                <Link
                  href="/dashboard/agents"
                  className="text-sm border border-neutral-700 px-4 py-2 rounded-md hover:border-neutral-500 transition-colors"
                >
                  Run a workflow
                </Link>
              </div>
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
