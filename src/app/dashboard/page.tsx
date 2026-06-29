import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: memberships } = await supabase
    .from("tenant_members")
    .select("tenant_id, role, tenants(name, slug, plan, credits_remaining)")
    .eq("user_id", user.id);

  const tenant = memberships?.[0]?.tenants as { name: string; slug: string; plan: string; credits_remaining: number } | undefined;

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

            <div className="grid md:grid-cols-3 gap-6">
              <DashboardCard
                title="Utility Jobs"
                endpoint="/api/v1/utility"
                description="Parse documents, extract data, normalize formats"
                color="text-green-400"
              />
              <DashboardCard
                title="Agent Workflows"
                endpoint="/api/v1/agent"
                description="AI-powered reconciliation and automation"
                color="text-blue-400"
              />
              <DashboardCard
                title="Ledger"
                endpoint="/api/v1/ledger"
                description="Transaction history, credits, and billing"
                color="text-amber-400"
              />
            </div>
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

function DashboardCard({
  title,
  endpoint,
  description,
  color,
}: {
  title: string;
  endpoint: string;
  description: string;
  color: string;
}) {
  return (
    <div className="border border-neutral-800 rounded-lg p-6 hover:border-neutral-700 transition-colors">
      <div className={`text-xs font-mono ${color} mb-3`}>{endpoint}</div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm text-neutral-400">{description}</p>
    </div>
  );
}
