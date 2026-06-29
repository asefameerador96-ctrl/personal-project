import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: memberships } = await supabase
    .from("tenant_members")
    .select("tenant_id, role, tenants(id, name, slug, plan, credits_remaining)")
    .eq("user_id", user.id);

  const tenant = memberships?.[0]?.tenants as {
    id: string; name: string; slug: string; plan: string; credits_remaining: number;
  } | undefined;

  let recentJobs: { id: string; job_type: string; status: string; created_at: string }[] = [];
  if (tenant) {
    const { data } = await supabase
      .from("utility_jobs")
      .select("id, job_type, status, created_at")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false })
      .limit(5);
    recentJobs = data || [];
  }

  return (
    <main className="flex-1 bg-black text-white">
      <nav className="border-b border-neutral-800 px-6 py-4 flex justify-between items-center">
        <span className="text-lg font-semibold tracking-tight">nexus</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-neutral-400">{user.email}</span>
          <form action="/api/auth/signout" method="POST">
            <button className="text-sm text-neutral-500 hover:text-white transition-colors">
              Sign out
            </button>
          </form>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {tenant ? (
          <>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold">{tenant.name}</h1>
                <p className="text-sm text-neutral-500 mt-1">
                  {tenant.plan} plan — {tenant.credits_remaining.toLocaleString()} credits remaining
                </p>
              </div>
              <span className="text-xs font-mono bg-neutral-800 text-neutral-400 px-3 py-1 rounded-full">
                /{tenant.slug}
              </span>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Link href="/dashboard/utilities" className="block">
                <div className="border border-neutral-800 rounded-lg p-6 hover:border-green-800 transition-colors group">
                  <div className="text-xs font-mono text-green-400 mb-3">/api/v1/utility</div>
                  <h3 className="text-lg font-semibold mb-1 group-hover:text-green-400 transition-colors">
                    Utility Jobs
                  </h3>
                  <p className="text-sm text-neutral-400">
                    Parse documents, extract data, normalize formats
                  </p>
                </div>
              </Link>
              <div className="border border-neutral-800 rounded-lg p-6 opacity-60">
                <div className="text-xs font-mono text-blue-400 mb-3">/api/v1/agent</div>
                <h3 className="text-lg font-semibold mb-1">Agent Workflows</h3>
                <p className="text-sm text-neutral-400">
                  AI-powered reconciliation and automation
                </p>
                <span className="text-xs text-neutral-600 mt-2 block">Coming soon</span>
              </div>
              <div className="border border-neutral-800 rounded-lg p-6 opacity-60">
                <div className="text-xs font-mono text-amber-400 mb-3">/api/v1/ledger</div>
                <h3 className="text-lg font-semibold mb-1">Ledger</h3>
                <p className="text-sm text-neutral-400">
                  Transaction history, credits, and billing
                </p>
                <span className="text-xs text-neutral-600 mt-2 block">Coming soon</span>
              </div>
            </div>

            {recentJobs.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">
                  Recent Jobs
                </h2>
                <div className="border border-neutral-800 rounded-lg divide-y divide-neutral-800">
                  {recentJobs.map((job) => (
                    <div key={job.id} className="px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-neutral-400">{job.job_type}</span>
                      </div>
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
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    completed: "text-green-400 bg-green-400/10",
    processing: "text-blue-400 bg-blue-400/10",
    pending: "text-yellow-400 bg-yellow-400/10",
    failed: "text-red-400 bg-red-400/10",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${colors[status] || "text-neutral-400 bg-neutral-800"}`}>
      {status}
    </span>
  );
}
