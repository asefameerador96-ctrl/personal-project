"use client";

import { useState, useEffect } from "react";

interface LedgerEntry {
  id: string;
  entry_type: string;
  amount_cents: number;
  credits_delta: number;
  reference_type: string | null;
  description: string | null;
  created_at: string;
}

interface UsageSummary {
  credits_remaining: number;
  plan: string;
  last_30_days: {
    total_entries: number;
    total_credits_used: number;
    total_revenue_cents: number;
  };
}

export default function LedgerPage() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    async function load() {
      try {
        const [entriesRes, summaryRes] = await Promise.all([
          fetch("/api/v1/ledger/dashboard"),
          fetch("/api/v1/ledger/dashboard", { method: "POST" }),
        ]);

        if (entriesRes.ok) {
          const json = await entriesRes.json();
          setEntries(json.data || []);
        }
        if (summaryRes.ok) {
          const json = await summaryRes.json();
          setSummary(json.data || null);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered =
    filter === "all" ? entries : entries.filter((e) => e.entry_type === filter);

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Ledger</h1>
        <p className="text-neutral-400 text-sm mt-1">
          Immutable transaction log with cryptographic signatures.
        </p>
      </div>

      {summary && (
        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          <div className="border border-neutral-800 rounded-lg p-5">
            <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">
              Credits Remaining
            </p>
            <p className="text-3xl font-bold text-white">
              {summary.credits_remaining.toLocaleString()}
            </p>
            <p className="text-xs text-neutral-600 mt-1">{summary.plan} plan</p>
          </div>
          <div className="border border-neutral-800 rounded-lg p-5">
            <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">
              Credits Used (30d)
            </p>
            <p className="text-3xl font-bold text-amber-400">
              {summary.last_30_days.total_credits_used.toLocaleString()}
            </p>
            <p className="text-xs text-neutral-600 mt-1">
              {summary.last_30_days.total_entries} transactions
            </p>
          </div>
          <div className="border border-neutral-800 rounded-lg p-5">
            <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">
              Usage Rate
            </p>
            <p className="text-3xl font-bold text-green-400">
              {summary.last_30_days.total_entries > 0
                ? (
                    summary.last_30_days.total_credits_used /
                    summary.last_30_days.total_entries
                  ).toFixed(1)
                : "0"}
            </p>
            <p className="text-xs text-neutral-600 mt-1">
              credits per transaction
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">
          Transaction History
        </h2>
        <div className="flex gap-1">
          {["all", "credit_deduction", "credit_purchase", "fee", "refund"].map(
            (f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs px-3 py-1 rounded-full transition-colors ${
                  filter === f
                    ? "bg-neutral-700 text-white"
                    : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                {f === "all"
                  ? "All"
                  : f
                      .split("_")
                      .map((w) => w[0].toUpperCase() + w.slice(1))
                      .join(" ")}
              </button>
            )
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-neutral-600">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 border border-neutral-800 rounded-lg">
          <p className="text-neutral-500">No transactions found.</p>
        </div>
      ) : (
        <div className="border border-neutral-800 rounded-lg divide-y divide-neutral-800">
          {filtered.map((entry) => (
            <div
              key={entry.id}
              className="px-5 py-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    entry.credits_delta > 0
                      ? "bg-green-400/10 text-green-400"
                      : "bg-red-400/10 text-red-400"
                  }`}
                >
                  {entry.credits_delta > 0 ? "+" : "−"}
                </span>
                <div>
                  <p className="text-sm text-white">
                    {entry.description || entry.entry_type}
                  </p>
                  <p className="text-xs text-neutral-600">
                    {entry.reference_type && (
                      <span className="font-mono">{entry.reference_type}</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={`text-sm font-mono ${
                    entry.credits_delta > 0
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {entry.credits_delta > 0 ? "+" : ""}
                  {entry.credits_delta} credits
                </p>
                <p className="text-xs text-neutral-600">
                  {new Date(entry.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
