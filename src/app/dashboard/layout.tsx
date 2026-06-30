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
          <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
            nexus
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavLink href="/dashboard" label="Overview" icon="grid" />
          <NavLink href="/dashboard/utilities" label="Utilities" icon="doc" />
          <NavLink href="/dashboard/agents" label="Agents" icon="cpu" />
          <NavLink href="/dashboard/ledger" label="Ledger" icon="ledger" />
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
  const icons: Record<string, string> = {
    grid: "⊞",
    doc: "⊡",
    cpu: "◈",
    ledger: "☰",
  };

  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-neutral-400 hover:text-white hover:bg-neutral-800/50 transition-colors"
    >
      <span className="text-base opacity-60">{icons[icon]}</span>
      {label}
    </Link>
  );
}
