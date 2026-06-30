"use client";

import { useState, useEffect } from "react";

interface Webhook {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  failure_count: number;
  last_triggered_at: string | null;
  created_at: string;
  secret?: string;
}

const ALL_EVENTS = [
  { value: "job.completed", label: "Job Completed" },
  { value: "workflow.completed", label: "Workflow Completed" },
  { value: "workflow.failed", label: "Workflow Failed" },
  { value: "credits.low", label: "Credits Low" },
  { value: "member.joined", label: "Member Joined" },
];

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>(
    ALL_EVENTS.map((e) => e.value)
  );
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchWebhooks();
  }, []);

  async function fetchWebhooks() {
    const res = await fetch("/api/v1/webhooks");
    if (res.ok) {
      const json = await res.json();
      setWebhooks(json.data || []);
    }
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");

    const res = await fetch("/api/v1/webhooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, events: selectedEvents }),
    });

    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Failed to create");
      setCreating(false);
      return;
    }

    setRevealedSecret(json.data.secret);
    setUrl("");
    setShowForm(false);
    setCreating(false);
    await fetchWebhooks();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/v1/webhooks?id=${id}`, { method: "DELETE" });
    await fetchWebhooks();
  }

  function toggleEvent(event: string) {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Webhooks</h1>
          <p className="text-neutral-400 text-sm mt-1">
            Get notified when events happen. All payloads are HMAC-SHA256 signed.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-white text-black px-4 py-2 rounded-md text-sm font-medium hover:bg-neutral-200 transition-colors"
          >
            Add Webhook
          </button>
        )}
      </div>

      {revealedSecret && (
        <div className="border border-green-800 bg-green-900/10 rounded-lg p-4 mb-8">
          <p className="text-sm text-green-400 mb-2 font-medium">
            Webhook signing secret — save it now:
          </p>
          <div className="flex gap-2">
            <code className="flex-1 bg-black border border-neutral-800 rounded px-3 py-2 text-xs font-mono text-green-300 break-all select-all">
              {revealedSecret}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(revealedSecret);
                setRevealedSecret(null);
              }}
              className="text-xs border border-neutral-700 px-3 py-2 rounded hover:border-neutral-500 transition-colors shrink-0"
            >
              Copy & Close
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="border border-neutral-800 rounded-lg p-6 mb-8 space-y-4"
        >
          <div>
            <label className="block text-xs text-neutral-400 mb-1.5">
              Endpoint URL (HTTPS required)
            </label>
            <input
              type="url"
              placeholder="https://api.yourapp.com/webhooks/nexus"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-neutral-600"
            />
          </div>

          <div>
            <label className="block text-xs text-neutral-400 mb-2">Events</label>
            <div className="flex flex-wrap gap-2">
              {ALL_EVENTS.map((evt) => (
                <button
                  key={evt.value}
                  type="button"
                  onClick={() => toggleEvent(evt.value)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    selectedEvents.includes(evt.value)
                      ? "border-blue-600 bg-blue-600/10 text-blue-400"
                      : "border-neutral-800 text-neutral-500 hover:border-neutral-700"
                  }`}
                >
                  {evt.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={creating || !url}
              className="bg-white text-black px-5 py-2.5 rounded-md text-sm font-medium hover:bg-neutral-200 transition-colors disabled:opacity-30"
            >
              {creating ? "Creating..." : "Create Webhook"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setError("");
              }}
              className="text-sm text-neutral-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-12 text-neutral-600">Loading...</div>
      ) : webhooks.length === 0 ? (
        <div className="text-center py-12 border border-neutral-800 rounded-lg">
          <p className="text-neutral-500">No webhooks configured.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map((wh) => (
            <div
              key={wh.id}
              className="border border-neutral-800 rounded-lg px-5 py-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      wh.active
                        ? wh.failure_count > 5
                          ? "bg-red-400"
                          : "bg-green-400"
                        : "bg-neutral-600"
                    }`}
                  />
                  <code className="text-sm font-mono text-neutral-300 break-all">
                    {wh.url}
                  </code>
                </div>
                <button
                  onClick={() => handleDelete(wh.id)}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors ml-4 shrink-0"
                >
                  Delete
                </button>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {wh.events.map((e) => (
                  <span
                    key={e}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400"
                  >
                    {e}
                  </span>
                ))}
              </div>
              <div className="flex gap-4 text-xs text-neutral-600">
                {wh.failure_count > 0 && (
                  <span className="text-red-400/70">
                    {wh.failure_count} failures
                  </span>
                )}
                {wh.last_triggered_at && (
                  <span>
                    Last triggered{" "}
                    {new Date(wh.last_triggered_at).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-12 border border-neutral-800 rounded-lg p-6">
        <h3 className="text-sm font-semibold mb-3">Verifying Signatures</h3>
        <pre className="bg-neutral-900 rounded-lg p-4 text-xs text-neutral-400 overflow-x-auto">
{`const crypto = require('crypto');

function verifyWebhook(body, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

// In your handler:
app.post('/webhooks/nexus', (req, res) => {
  const sig = req.headers['x-nexus-signature'];
  if (!verifyWebhook(req.rawBody, sig, WEBHOOK_SECRET)) {
    return res.status(401).send('Invalid signature');
  }
  const { event, data } = req.body;
  console.log(\`Event: \${event}\`, data);
  res.status(200).send('ok');
});`}
        </pre>
      </div>
    </div>
  );
}
