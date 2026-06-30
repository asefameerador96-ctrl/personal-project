import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="flex-1 flex bg-black text-white min-h-screen">
      <aside className="w-56 border-r border-neutral-800 flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-neutral-800">
          <Link
            href="/dashboard"
            className="text-lg font-semibold tracking-tight"
          >
            nexus
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavLink href="/dashboard" label="Home" icon="🏠" />
          <NavLink
            href="/dashboard/utilities"
            label="Upload Documents"
            icon="📄"
          />
          <NavLink
            href="/dashboard/agents"
            label="Run Automations"
            icon="🤖"
          />
          <NavLink href="/dashboard/ledger" label="Usage & Credits" icon="💳" />

          <div className="pt-4 pb-2">
            <p className="px-3 text-[10px] font-semibold text-neutral-600 uppercase tracking-widest">
              Settings
            </p>
          </div>
          <NavLink href="/dashboard/keys" label="API Keys" icon="🔑" />
          <NavLink href="/dashboard/team" label="Team" icon="👥" />
          <NavLink href="/dashboard/webhooks" label="Webhooks" icon="🔗" />
          <NavLink href="/dashboard/settings" label="Settings" icon="⚙️" />
        </nav>

        <div className="px-4 py-4 border-t border-neutral-800">
          <p className="text-xs text-neutral-500 truncate mb-2">{user.email}</p>
          <form action="/api/auth/signout" method="POST">
            <button className="text-xs text-neutral-500 hover:text-white transition-colors">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

function NavLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-neutral-400 hover:text-white hover:bg-neutral-800/50 transition-colors"
    >
      <span className="text-sm">{icon}</span>
      {label}
    </Link>
  );
}
