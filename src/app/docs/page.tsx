import Link from "next/link";

const ENDPOINTS = [
  {
    method: "POST",
    path: "/api/v1/utility/upload",
    title: "Parse Document",
    description: "Upload a PDF, CSV, or TXT file and get structured JSON output.",
    auth: "Bearer token or session cookie",
    cost: "1 credit",
    request: `curl -X POST https://your-domain.com/api/v1/utility/upload \\
  -H "Authorization: Bearer nx_your_key" \\
  -F "file=@invoice.pdf"`,
    response: `{
  "data": {
    "job": {
      "id": "uuid",
      "job_type": "pdf_to_json",
      "status": "completed"
    },
    "result": {
      "text": "Invoice #12345...",
      "structured_data": {
        "dates": ["2024-01-15"],
        "amounts": ["$1,250.00"],
        "invoice_numbers": ["INV-12345"]
      }
    }
  },
  "meta": {
    "credits_consumed": 1,
    "credits_remaining": 999
  }
}`,
  },
  {
    method: "POST",
    path: "/api/v1/utility",
    title: "Create Utility Job",
    description: "Create a utility job referencing a file already in storage.",
    auth: "Bearer token + x-tenant-id header",
    cost: "1 credit",
    request: `curl -X POST https://your-domain.com/api/v1/utility \\
  -H "Authorization: Bearer nx_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "job_type": "pdf_to_json",
    "input_ref": "uploads/tenant-id/invoice.pdf"
  }'`,
    response: `{
  "data": {
    "id": "uuid",
    "tenant_id": "uuid",
    "job_type": "pdf_to_json",
    "status": "pending",
    "created_at": "2024-01-15T..."
  },
  "meta": { "credits_consumed": 1, "credits_remaining": 999 }
}`,
  },
  {
    method: "GET",
    path: "/api/v1/utility",
    title: "List Utility Jobs",
    description: "List all utility jobs for the tenant with optional status filter.",
    auth: "Bearer token + x-tenant-id header",
    cost: "Free",
    request: `curl https://your-domain.com/api/v1/utility?status=completed&limit=10 \\
  -H "Authorization: Bearer nx_your_key" \\
  -H "x-tenant-id: your-tenant-id"`,
    response: `{
  "data": [
    {
      "id": "uuid",
      "job_type": "pdf_to_json",
      "status": "completed",
      "created_at": "2024-01-15T..."
    }
  ]
}`,
  },
  {
    method: "POST",
    path: "/api/v1/agent",
    title: "Create Agent Workflow",
    description: "Start a multi-step AI workflow for document reconciliation.",
    auth: "Bearer token + x-tenant-id header",
    cost: "10 credits",
    request: `curl -X POST https://your-domain.com/api/v1/agent \\
  -H "Authorization: Bearer nx_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "workflow_type": "invoice_reconciliation",
    "config": {}
  }'`,
    response: `{
  "data": {
    "id": "uuid",
    "workflow_type": "invoice_reconciliation",
    "status": "running",
    "steps_completed": 0,
    "steps_total": 5,
    "credits_consumed": 10
  },
  "meta": { "credits_consumed": 10, "credits_remaining": 990 }
}`,
  },
  {
    method: "GET",
    path: "/api/v1/agent",
    title: "List Agent Workflows",
    description: "List workflows with nested step details.",
    auth: "Bearer token + x-tenant-id header",
    cost: "Free",
    request: `curl https://your-domain.com/api/v1/agent?status=completed \\
  -H "Authorization: Bearer nx_your_key" \\
  -H "x-tenant-id: your-tenant-id"`,
    response: `{
  "data": [
    {
      "id": "uuid",
      "workflow_type": "invoice_reconciliation",
      "status": "completed",
      "steps_completed": 5,
      "steps_total": 5,
      "agent_steps": [
        {
          "agent_name": "document_ingester",
          "status": "completed",
          "output": { "documents_found": 12 },
          "duration_ms": 1200
        }
      ]
    }
  ]
}`,
  },
  {
    method: "GET",
    path: "/api/v1/ledger",
    title: "List Ledger Entries",
    description: "Query the immutable transaction ledger with optional filters.",
    auth: "Bearer token + x-tenant-id header",
    cost: "Free",
    request: `curl "https://your-domain.com/api/v1/ledger?type=credit_deduction&limit=20" \\
  -H "Authorization: Bearer nx_your_key" \\
  -H "x-tenant-id: your-tenant-id"`,
    response: `{
  "data": [
    {
      "id": "uuid",
      "entry_type": "credit_deduction",
      "credits_delta": -1,
      "description": "pdf_to_json job",
      "signature": "hmac-sha256-hex...",
      "created_at": "2024-01-15T..."
    }
  ]
}`,
  },
];

const METHOD_COLORS: Record<string, string> = {
  GET: "text-green-400 bg-green-400/10",
  POST: "text-blue-400 bg-blue-400/10",
  DELETE: "text-red-400 bg-red-400/10",
  PATCH: "text-amber-400 bg-amber-400/10",
};

export default function DocsPage() {
  return (
    <main className="bg-black text-white min-h-screen">
      <nav className="border-b border-neutral-800 px-6 py-4 flex justify-between items-center max-w-7xl mx-auto">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          nexus
        </Link>
        <div className="flex gap-4 items-center">
          <Link
            href="/dashboard"
            className="text-sm text-neutral-400 hover:text-white transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/signup"
            className="text-sm bg-white text-black px-4 py-1.5 rounded-md font-medium hover:bg-neutral-200 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">API Reference</h1>
        <p className="text-neutral-400 mb-8">
          Complete reference for the Nexus REST API. All endpoints require
          authentication via Bearer token or session cookie.
        </p>

        <div className="border border-neutral-800 rounded-lg p-6 mb-12">
          <h2 className="text-lg font-semibold mb-4">Authentication</h2>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-medium mb-1">API Key (recommended for integrations)</h3>
              <p className="text-neutral-400 text-xs mb-2">
                Generate keys in Dashboard → API Keys. Pass as Bearer token:
              </p>
              <pre className="bg-neutral-900 rounded px-3 py-2 text-xs text-neutral-400">
                Authorization: Bearer nx_your_api_key_here
              </pre>
            </div>
            <div>
              <h3 className="font-medium mb-1">Session Cookie (browser)</h3>
              <p className="text-neutral-400 text-xs">
                Automatically set when logged in. Used by dashboard UI. For
                programmatic access, use API keys instead.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-1">Tenant ID Header</h3>
              <p className="text-neutral-400 text-xs mb-2">
                Required for non-upload endpoints when using API keys:
              </p>
              <pre className="bg-neutral-900 rounded px-3 py-2 text-xs text-neutral-400">
                x-tenant-id: your-tenant-uuid
              </pre>
            </div>
          </div>
        </div>

        <div className="border border-neutral-800 rounded-lg p-6 mb-12">
          <h2 className="text-lg font-semibold mb-4">Rate Limiting</h2>
          <p className="text-neutral-400 text-sm mb-3">
            Requests are rate-limited per API key. Limits depend on your plan:
          </p>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center p-3 bg-neutral-900 rounded">
              <p className="font-bold">30 req/min</p>
              <p className="text-xs text-neutral-500">Free</p>
            </div>
            <div className="text-center p-3 bg-neutral-900 rounded">
              <p className="font-bold">120 req/min</p>
              <p className="text-xs text-neutral-500">Pro</p>
            </div>
            <div className="text-center p-3 bg-neutral-900 rounded">
              <p className="font-bold">1,000 req/min</p>
              <p className="text-xs text-neutral-500">Enterprise</p>
            </div>
          </div>
          <p className="text-neutral-500 text-xs mt-3">
            Rate limit headers are included in every response:{" "}
            <code className="text-neutral-400">X-RateLimit-Limit</code>,{" "}
            <code className="text-neutral-400">X-RateLimit-Remaining</code>,{" "}
            <code className="text-neutral-400">X-RateLimit-Reset</code>
          </p>
        </div>

        <h2 className="text-xl font-bold mb-6">Endpoints</h2>

        <div className="space-y-8">
          {ENDPOINTS.map((ep, i) => (
            <div key={i} className="border border-neutral-800 rounded-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-neutral-800 flex items-center gap-3">
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${METHOD_COLORS[ep.method]}`}
                >
                  {ep.method}
                </span>
                <code className="text-sm font-mono text-neutral-300">
                  {ep.path}
                </code>
                <span className="text-xs text-neutral-600 ml-auto">
                  {ep.cost}
                </span>
              </div>
              <div className="px-5 py-4">
                <h3 className="font-semibold mb-1">{ep.title}</h3>
                <p className="text-sm text-neutral-400 mb-4">
                  {ep.description}
                </p>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Request</p>
                    <pre className="bg-neutral-900 rounded-lg p-3 text-xs text-neutral-400 overflow-x-auto">
                      {ep.request}
                    </pre>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Response</p>
                    <pre className="bg-neutral-900 rounded-lg p-3 text-xs text-green-300/80 overflow-x-auto">
                      {ep.response}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border border-neutral-800 rounded-lg p-6 mt-12">
          <h2 className="text-lg font-semibold mb-4">Error Codes</h2>
          <div className="space-y-2 text-sm">
            {[
              { code: 400, desc: "Bad Request — invalid parameters" },
              { code: 401, desc: "Unauthorized — missing or invalid auth" },
              { code: 402, desc: "Payment Required — insufficient credits" },
              { code: 403, desc: "Forbidden — insufficient permissions or plan limit" },
              { code: 404, desc: "Not Found — resource doesn't exist" },
              { code: 409, desc: "Conflict — duplicate resource" },
              { code: 429, desc: "Too Many Requests — rate limit exceeded" },
              { code: 500, desc: "Internal Server Error" },
            ].map((e) => (
              <div key={e.code} className="flex gap-3">
                <code className="text-xs font-mono text-red-400 w-8">
                  {e.code}
                </code>
                <span className="text-neutral-400">{e.desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-neutral-800 rounded-lg p-6 mt-8">
          <h2 className="text-lg font-semibold mb-4">Webhook Events</h2>
          <div className="space-y-2 text-sm">
            {[
              { event: "job.completed", desc: "A utility job finished processing" },
              { event: "workflow.completed", desc: "An agent workflow finished all steps" },
              { event: "workflow.failed", desc: "An agent workflow encountered an error" },
              { event: "credits.low", desc: "Tenant credits dropped below 10% of plan allocation" },
              { event: "member.joined", desc: "A new member accepted an invitation" },
            ].map((e) => (
              <div key={e.event} className="flex gap-3">
                <code className="text-xs font-mono text-blue-400 w-40 shrink-0">
                  {e.event}
                </code>
                <span className="text-neutral-400">{e.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
