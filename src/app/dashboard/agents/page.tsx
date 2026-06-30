"use client";

import { useState, useEffect, useCallback } from "react";

interface WorkflowStep {
  id: string;
  step_index: number;
  agent_name: string;
  status: string;
  output: Record<string, unknown> | null;
  duration_ms: number | null;
  created_at: string;
}

interface Workflow {
  id: string;
  workflow_type: string;
  status: string;
  steps_completed: number;
  steps_total: number | null;
  credits_consumed: number;
  created_at: string;
  agent_steps?: WorkflowStep[];
}

const WORKFLOW_TYPES = [
  {
    value: "invoice_reconciliation",
    label: "🔄 Invoice Reconciliation",
    description:
      "Compare your invoices against purchase orders. Flags mismatched amounts, wrong dates, and missing items.",
  },
  {
    value: "shipment_matching",
    label: "🚢 Shipment Matching",
    description:
      "Check shipping documents against your inventory. Find shortages and discrepancies before they become problems.",
  },
  {
    value: "erp_sync",
    label: "📊 ERP Sync",
    description:
      "Pull data from your documents and prepare it for import into your ERP or accounting system.",
  },
  {
    value: "customs_verification",
    label: "🛃 Customs Verification",
    description:
      "Validate HS codes, check certificates of origin, and score compliance risk before goods reach the border.",
  },
];

export default function AgentsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [selectedType, setSelectedType] = useState(WORKFLOW_TYPES[0].value);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchWorkflows = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/agent/dashboard");
      if (res.ok) {
        const json = await res.json();
        setWorkflows(json.data || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  useEffect(() => {
    const hasRunning = workflows.some(
      (w) => w.status === "running" || w.status === "idle"
    );
    if (!hasRunning) return;
    const interval = setInterval(fetchWorkflows, 3000);
    return () => clearInterval(interval);
  }, [workflows, fetchWorkflows]);

  async function handleCreate() {
    setCreating(true);
    setError("");

    try {
      const res = await fetch("/api/v1/agent/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflow_type: selectedType }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Failed to create workflow");
        setCreating(false);
        return;
      }

      setExpandedId(json.data?.id || null);
      await fetchWorkflows();
    } catch {
      setError("Network error");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Run Automations</h1>
        <p className="text-neutral-400 text-sm mt-1">
          Pick a task below and let AI handle it. Each automation runs multiple
          steps automatically and shows you the results.
        </p>
      </div>

      <div className="border border-neutral-800 rounded-lg p-6 mb-10">
        <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">
          What do you want to automate?
        </h2>
        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          {WORKFLOW_TYPES.map((wt) => (
            <button
              key={wt.value}
              onClick={() => setSelectedType(wt.value)}
              className={`text-left border rounded-lg p-4 transition-colors ${
                selectedType === wt.value
                  ? "border-blue-600 bg-blue-600/5"
                  : "border-neutral-800 hover:border-neutral-700"
              }`}
            >
              <p
                className={`text-sm font-medium ${selectedType === wt.value ? "text-blue-400" : "text-white"}`}
              >
                {wt.label}
              </p>
              <p className="text-xs text-neutral-500 mt-1">{wt.description}</p>
            </button>
          ))}
        </div>

        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

        <button
          onClick={handleCreate}
          disabled={creating}
          className="bg-white text-black rounded-md px-6 py-2.5 text-sm font-medium hover:bg-neutral-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {creating ? "Starting..." : "Run Workflow (10 credits)"}
        </button>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">
          Workflow History
        </h2>

        {loading ? (
          <div className="text-center py-12 text-neutral-600">Loading...</div>
        ) : workflows.length === 0 ? (
          <div className="text-center py-12 border border-neutral-800 rounded-lg">
            <p className="text-neutral-500">
              No workflows yet. Create one above.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {workflows.map((wf) => (
              <div
                key={wf.id}
                className="border border-neutral-800 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedId(expandedId === wf.id ? null : wf.id)
                  }
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-neutral-900/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <StatusBadge status={wf.status} />
                    <span className="text-sm font-mono">
                      {wf.workflow_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    {wf.steps_total && (
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all duration-500"
                            style={{
                              width: `${(wf.steps_completed / wf.steps_total) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-neutral-500">
                          {wf.steps_completed}/{wf.steps_total}
                        </span>
                      </div>
                    )}
                    <span className="text-xs text-neutral-600">
                      {new Date(wf.created_at).toLocaleDateString()}
                    </span>
                    <span className="text-neutral-600">
                      {expandedId === wf.id ? "▾" : "▸"}
                    </span>
                  </div>
                </button>

                {expandedId === wf.id && wf.agent_steps && (
                  <div className="border-t border-neutral-800 px-5 py-4 space-y-3">
                    {wf.agent_steps
                      .sort((a, b) => a.step_index - b.step_index)
                      .map((step) => (
                        <div
                          key={step.id}
                          className="flex items-start gap-3 text-sm"
                        >
                          <span className="w-6 h-6 rounded-full bg-neutral-800 text-neutral-400 text-xs flex items-center justify-center shrink-0 mt-0.5">
                            {step.step_index + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-neutral-300">
                                {step.agent_name}
                              </span>
                              <StatusBadge status={step.status} />
                              {step.duration_ms && (
                                <span className="text-xs text-neutral-600">
                                  {(step.duration_ms / 1000).toFixed(1)}s
                                </span>
                              )}
                            </div>
                            {step.output && (
                              <pre className="text-xs text-neutral-500 bg-neutral-900 rounded p-2 overflow-auto max-h-32">
                                {JSON.stringify(step.output, null, 2)}
                              </pre>
                            )}
                          </div>
                        </div>
                      ))}

                    {wf.status === "running" && (
                      <div className="flex items-center gap-2 text-xs text-blue-400 pl-9">
                        <span className="animate-pulse">●</span> Processing...
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
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
    idle: "text-neutral-400 bg-neutral-800",
  };
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full ${colors[status] || "text-neutral-400 bg-neutral-800"}`}
    >
      {status}
    </span>
  );
}
