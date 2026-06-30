"use client";

import { useState, useEffect } from "react";

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  rate_limit_rpm: number;
  last_used_at: string | null;
  revoked_at: string | null;
  created_at: string;
  raw_key?: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchKeys();
  }, []);

  async function fetchKeys() {
    const res = await fetch("/api/v1/keys");
    if (res.ok) {
      const json = await res.json();
      setKeys(json.data || []);
    }
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setCreating(true);
    setError("");

    const res = await fetch("/api/v1/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newKeyName }),
    });

    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Failed to create");
      setCreating(false);
      return;
    }

    setRevealedKey(json.data.raw_key);
    setNewKeyName("");
    setCreating(false);
    await fetchKeys();
  }

  async function handleRevoke(id: string) {
    const res = await fetch(`/api/v1/keys?id=${id}`, { method: "DELETE" });
    if (res.ok) await fetchKeys();
  }

  const active = keys.filter((k) => !k.revoked_at);
  const revoked = keys.filter((k) => k.revoked_at);

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">API Keys</h1>
        <p className="text-neutral-400 text-sm mt-1">
          Create keys for programmatic access. Keys authenticate via{" "}
          <code className="text-xs bg-neutral-800 px-1.5 py-0.5 rounded">
            Authorization: Bearer nx_...
          </code>
        </p>
      </div>

      <form onSubmit={handleCreate} className="flex gap-3 mb-8">
        <input
          type="text"
          placeholder="Key name (e.g. Production, CI/CD)"
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
          className="flex-1 bg-neutral-900 border border-neutral-800 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-neutral-600"
        />
        <button
          type="submit"
          disabled={creating || !newKeyName.trim()}
          className="bg-white text-black px-5 py-2.5 rounded-md text-sm font-medium hover:bg-neutral-200 transition-colors disabled:opacity-30 shrink-0"
        >
          {creating ? "Creating..." : "Create Key"}
        </button>
      </form>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {revealedKey && (
        <div className="border border-green-800 bg-green-900/10 rounded-lg p-4 mb-8">
          <p className="text-sm text-green-400 mb-2 font-medium">
            Key created. Copy it now — it won&apos;t be shown again.
          </p>
          <div className="flex gap-2">
            <code className="flex-1 bg-black border border-neutral-800 rounded px-3 py-2 text-xs font-mono text-green-300 break-all select-all">
              {revealedKey}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(revealedKey);
                setRevealedKey(null);
              }}
              className="text-xs border border-neutral-700 px-3 py-2 rounded hover:border-neutral-500 transition-colors shrink-0"
            >
              Copy & Close
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-neutral-600">Loading...</div>
      ) : active.length === 0 ? (
        <div className="text-center py-12 border border-neutral-800 rounded-lg">
          <p className="text-neutral-500">No API keys yet.</p>
        </div>
      ) : (
        <div className="border border-neutral-800 rounded-lg divide-y divide-neutral-800">
          {active.map((key) => (
            <div key={key.id} className="px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{key.name}</p>
                <div className="flex items-center gap-3 mt-1">
                  <code className="text-xs text-neutral-500 font-mono">
                    {key.key_prefix}...
                  </code>
                  <span className="text-xs text-neutral-600">
                    {key.rate_limit_rpm} req/min
                  </span>
                  {key.last_used_at && (
                    <span className="text-xs text-neutral-600">
                      Last used {new Date(key.last_used_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div className="flex gap-1 mt-2">
                  {key.scopes.map((s) => (
                    <span
                      key={s}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => handleRevoke(key.id)}
                className="text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                Revoke
              </button>
            </div>
          ))}
        </div>
      )}

      {revoked.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-neutral-600 uppercase tracking-wider mb-3">
            Revoked Keys
          </h3>
          <div className="border border-neutral-800/50 rounded-lg divide-y divide-neutral-800/50 opacity-50">
            {revoked.map((key) => (
              <div key={key.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm line-through">{key.name}</p>
                  <code className="text-xs text-neutral-600 font-mono">
                    {key.key_prefix}...
                  </code>
                </div>
                <span className="text-xs text-red-400/50">Revoked</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-12 border border-neutral-800 rounded-lg p-6">
        <h3 className="text-sm font-semibold mb-3">Quick Start</h3>
        <pre className="bg-neutral-900 rounded-lg p-4 text-xs text-neutral-400 overflow-x-auto">
{`curl -X POST https://your-domain.com/api/v1/utility/upload \\
  -H "Authorization: Bearer nx_your_key_here" \\
  -F "file=@invoice.pdf"

# Or with the utility endpoint:
curl -X POST https://your-domain.com/api/v1/utility \\
  -H "Authorization: Bearer nx_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"job_type": "pdf_to_json", "input_ref": "uploads/doc.pdf"}'`}
        </pre>
      </div>
    </div>
  );
}
