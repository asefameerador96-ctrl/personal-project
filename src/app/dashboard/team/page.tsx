"use client";

import { useState, useEffect } from "react";

interface Member {
  id: string;
  user_id: string;
  email: string;
  role: string;
  created_at: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  expires_at: string;
  created_at: string;
}

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
  viewer: "Viewer",
};

const ROLE_COLORS: Record<string, string> = {
  owner: "text-amber-400 bg-amber-400/10",
  admin: "text-blue-400 bg-blue-400/10",
  member: "text-green-400 bg-green-400/10",
  viewer: "text-neutral-400 bg-neutral-800",
};

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchTeam();
  }, []);

  async function fetchTeam() {
    const res = await fetch("/api/v1/team");
    if (res.ok) {
      const json = await res.json();
      setMembers(json.data?.members || []);
      setInvitations(json.data?.pending_invitations || []);
    }
    setLoading(false);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setError("");
    setSuccess("");

    const res = await fetch("/api/v1/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    });

    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Failed to invite");
    } else {
      setSuccess(`Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
    }
    setInviting(false);
    await fetchTeam();
  }

  async function handleRemoveMember(memberId: string) {
    await fetch(`/api/v1/team?member_id=${memberId}`, { method: "DELETE" });
    await fetchTeam();
  }

  async function handleCancelInvite(invitationId: string) {
    await fetch(`/api/v1/team?invitation_id=${invitationId}`, { method: "DELETE" });
    await fetchTeam();
  }

  async function handleRoleChange(memberId: string, newRole: string) {
    await fetch("/api/v1/team", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ member_id: memberId, role: newRole }),
    });
    await fetchTeam();
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Team</h1>
        <p className="text-neutral-400 text-sm mt-1">
          Manage members and roles. Owners can change roles; admins can invite and remove.
        </p>
      </div>

      <form onSubmit={handleInvite} className="flex gap-3 mb-8">
        <input
          type="email"
          placeholder="colleague@company.com"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          className="flex-1 bg-neutral-900 border border-neutral-800 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-neutral-600"
        />
        <select
          value={inviteRole}
          onChange={(e) => setInviteRole(e.target.value)}
          className="bg-neutral-900 border border-neutral-800 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-neutral-600"
        >
          <option value="admin">Admin</option>
          <option value="member">Member</option>
          <option value="viewer">Viewer</option>
        </select>
        <button
          type="submit"
          disabled={inviting || !inviteEmail.trim()}
          className="bg-white text-black px-5 py-2.5 rounded-md text-sm font-medium hover:bg-neutral-200 transition-colors disabled:opacity-30 shrink-0"
        >
          {inviting ? "Sending..." : "Invite"}
        </button>
      </form>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
      {success && <p className="text-green-400 text-sm mb-4">{success}</p>}

      {loading ? (
        <div className="text-center py-12 text-neutral-600">Loading...</div>
      ) : (
        <>
          <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-3">
            Members ({members.length})
          </h2>
          <div className="border border-neutral-800 rounded-lg divide-y divide-neutral-800 mb-8">
            {members.map((m) => (
              <div key={m.id} className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-medium text-neutral-400">
                    {m.email?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="text-sm">{m.email}</p>
                    <p className="text-xs text-neutral-600">
                      Joined {new Date(m.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {m.role === "owner" ? (
                    <span className={`text-xs px-2.5 py-1 rounded-full ${ROLE_COLORS[m.role]}`}>
                      {ROLE_LABELS[m.role]}
                    </span>
                  ) : (
                    <>
                      <select
                        value={m.role}
                        onChange={(e) => handleRoleChange(m.id, e.target.value)}
                        className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs focus:outline-none"
                      >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      <button
                        onClick={() => handleRemoveMember(m.id)}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        Remove
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {invitations.length > 0 && (
            <>
              <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-3">
                Pending Invitations
              </h2>
              <div className="border border-neutral-800 rounded-lg divide-y divide-neutral-800">
                {invitations.map((inv) => (
                  <div key={inv.id} className="px-5 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm">{inv.email}</p>
                      <p className="text-xs text-neutral-600">
                        {ROLE_LABELS[inv.role]} — expires{" "}
                        {new Date(inv.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCancelInvite(inv.id)}
                      className="text-xs text-neutral-500 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
