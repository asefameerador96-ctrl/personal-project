"use client";

import { useState, useEffect } from "react";
import { PLANS } from "@/types";
import type { Plan } from "@/types";

interface TenantSettings {
  id: string;
  name: string;
  slug: string;
  plan: Plan;
  credits_remaining: number;
  billing_email: string | null;
  logo_url: string | null;
  created_at: string;
  role: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/v1/settings");
      if (res.ok) {
        const json = await res.json();
        setSettings(json.data);
        setName(json.data.name);
        setBillingEmail(json.data.billing_email || "");
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const res = await fetch("/api/v1/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        billing_email: billingEmail.trim() || null,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      setSettings((prev) => (prev ? { ...prev, ...json.data } : prev));
      setSuccess("Settings saved");
    } else {
      const json = await res.json();
      setError(json.error || "Failed to save");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12 text-center text-neutral-600">
        Loading...
      </div>
    );
  }

  if (!settings) return null;

  const plan = PLANS[settings.plan];

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-neutral-400 text-sm mt-1">
          Manage your organization and billing.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <label className="block text-xs text-neutral-400 mb-1.5">
            Organization Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-neutral-600"
          />
        </div>

        <div>
          <label className="block text-xs text-neutral-400 mb-1.5">
            Billing Email
          </label>
          <input
            type="email"
            value={billingEmail}
            onChange={(e) => setBillingEmail(e.target.value)}
            placeholder="billing@company.com"
            className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-neutral-600"
          />
        </div>

        <div>
          <label className="block text-xs text-neutral-400 mb-1.5">
            Organization Slug
          </label>
          <input
            type="text"
            value={settings.slug}
            disabled
            className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-4 py-2.5 text-sm text-neutral-600"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}
        {success && <p className="text-green-400 text-sm">{success}</p>}

        <button
          type="submit"
          disabled={saving}
          className="bg-white text-black px-6 py-2.5 rounded-md text-sm font-medium hover:bg-neutral-200 transition-colors disabled:opacity-30"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>

      <div className="border border-neutral-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">{plan.display} Plan</h2>
            <p className="text-sm text-neutral-400">
              {plan.price_monthly === 0
                ? "Free"
                : `$${(plan.price_monthly / 100).toFixed(0)}/month`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">
              {settings.credits_remaining.toLocaleString()}
            </p>
            <p className="text-xs text-neutral-500">credits remaining</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          {plan.features.map((f) => (
            <div key={f} className="flex items-center gap-2 text-xs text-neutral-400">
              <span className="text-green-400">+</span>
              {f}
            </div>
          ))}
        </div>

        {settings.plan !== "enterprise" && (
          <button className="w-full border border-neutral-700 rounded-md py-2.5 text-sm font-medium hover:border-neutral-500 transition-colors">
            Upgrade to {settings.plan === "free" ? "Pro" : "Enterprise"}
          </button>
        )}
      </div>

      <div className="border border-neutral-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-2">Plan Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-left">
                <th className="py-2 pr-4 text-neutral-500 font-normal">Feature</th>
                {Object.values(PLANS).map((p) => (
                  <th
                    key={p.name}
                    className={`py-2 px-3 font-medium ${
                      p.name === settings.plan ? "text-white" : "text-neutral-500"
                    }`}
                  >
                    {p.display}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-neutral-400">
              <tr className="border-b border-neutral-800/50">
                <td className="py-2 pr-4">Credits/month</td>
                {Object.values(PLANS).map((p) => (
                  <td key={p.name} className="py-2 px-3">
                    {p.credits.toLocaleString()}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-neutral-800/50">
                <td className="py-2 pr-4">API Keys</td>
                {Object.values(PLANS).map((p) => (
                  <td key={p.name} className="py-2 px-3">
                    {p.api_keys_limit}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-neutral-800/50">
                <td className="py-2 pr-4">Team Members</td>
                {Object.values(PLANS).map((p) => (
                  <td key={p.name} className="py-2 px-3">
                    {p.members_limit === -1 ? "Unlimited" : p.members_limit}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-neutral-800/50">
                <td className="py-2 pr-4">Webhooks</td>
                {Object.values(PLANS).map((p) => (
                  <td key={p.name} className="py-2 px-3">
                    {p.webhooks_limit}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2 pr-4">Rate Limit</td>
                {Object.values(PLANS).map((p) => (
                  <td key={p.name} className="py-2 px-3">
                    {p.rate_limit_rpm} req/min
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="border border-red-900/30 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h2>
        <p className="text-sm text-neutral-500 mb-4">
          Irreversible actions. Proceed with caution.
        </p>
        <div className="flex gap-3">
          <button className="text-xs border border-red-800/50 text-red-400 px-4 py-2 rounded-md hover:bg-red-900/20 transition-colors">
            Export All Data
          </button>
          <button className="text-xs border border-red-800/50 text-red-400 px-4 py-2 rounded-md hover:bg-red-900/20 transition-colors">
            Delete Organization
          </button>
        </div>
      </div>
    </div>
  );
}
