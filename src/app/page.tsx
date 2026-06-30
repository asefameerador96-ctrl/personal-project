import Link from "next/link";
import { PLANS } from "@/types";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col bg-black text-white">
      <nav className="border-b border-neutral-800 px-6 py-4">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <span className="text-lg font-semibold tracking-tight">nexus</span>
          <div className="flex gap-6 items-center">
            <Link
              href="#how-it-works"
              className="text-sm text-neutral-400 hover:text-white transition-colors hidden sm:block"
            >
              How It Works
            </Link>
            <Link
              href="#pricing"
              className="text-sm text-neutral-400 hover:text-white transition-colors hidden sm:block"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="text-sm text-neutral-400 hover:text-white transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-sm bg-white text-black px-4 py-1.5 rounded-md font-medium hover:bg-neutral-200 transition-colors"
            >
              Try Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero — Problem + Solution in plain English */}
      <section className="px-6 py-20 sm:py-28">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm text-amber-400 font-medium mb-4">
            For importers, exporters, and freight teams
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight mb-6">
            Stop wasting hours on
            <br />
            <span className="text-neutral-500">trade paperwork.</span>
          </h1>
          <p className="text-lg text-neutral-400 max-w-xl mx-auto mb-8">
            Upload your invoices, shipping docs, or customs papers. Nexus reads
            them, extracts the data, and checks everything matches — in seconds,
            not hours.
          </p>
          <div className="flex gap-4 justify-center mb-6">
            <Link
              href="/signup"
              className="bg-white text-black px-6 py-2.5 rounded-md font-medium hover:bg-neutral-200 transition-colors"
            >
              Start Free — No Card Required
            </Link>
            <Link
              href="#how-it-works"
              className="border border-neutral-700 text-neutral-300 px-6 py-2.5 rounded-md font-medium hover:border-neutral-500 transition-colors"
            >
              See How It Works
            </Link>
          </div>
          <p className="text-xs text-neutral-600">
            1,000 free document credits included. Cancel anytime.
          </p>
        </div>
      </section>

      {/* The Problem — relatable pain points */}
      <section className="border-t border-neutral-800 px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-sm font-medium text-neutral-500 uppercase tracking-wider mb-8">
            Sound familiar?
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-5">
              <p className="text-2xl mb-3">📄</p>
              <p className="text-sm text-neutral-300">
                &ldquo;I spend 3 hours a day copying invoice numbers from PDFs
                into spreadsheets.&rdquo;
              </p>
            </div>
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-5">
              <p className="text-2xl mb-3">🔍</p>
              <p className="text-sm text-neutral-300">
                &ldquo;We shipped 200 containers last month and I still
                reconcile everything by hand.&rdquo;
              </p>
            </div>
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-5">
              <p className="text-2xl mb-3">⚠️</p>
              <p className="text-sm text-neutral-300">
                &ldquo;A $12,000 customs penalty because someone mistyped an HS
                code. Never again.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works — 3 simple steps */}
      <section
        id="how-it-works"
        className="border-t border-neutral-800 px-6 py-20"
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3">
            How It Works
          </h2>
          <p className="text-neutral-400 text-center mb-12">
            Three steps. That&apos;s it.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green-400/10 text-green-400 flex items-center justify-center text-lg font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-lg font-semibold mb-2">Upload Your Document</h3>
              <p className="text-sm text-neutral-400">
                Drag and drop any invoice, packing list, bill of lading, or
                customs declaration. We accept PDF, CSV, and text files.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-blue-400/10 text-blue-400 flex items-center justify-center text-lg font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-lg font-semibold mb-2">
                We Extract &amp; Verify
              </h3>
              <p className="text-sm text-neutral-400">
                Nexus reads your document, pulls out every date, amount, invoice
                number, and line item — then checks for discrepancies
                automatically.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-amber-400/10 text-amber-400 flex items-center justify-center text-lg font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Download Clean Data
              </h3>
              <p className="text-sm text-neutral-400">
                Get structured JSON or connect via API. Feed it into your ERP,
                accounting software, or spreadsheets with zero manual entry.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Demo Preview — show, don't tell */}
      <section className="border-t border-neutral-800 px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-3">
            See It In Action
          </h2>
          <p className="text-neutral-400 text-center mb-10">
            Here&apos;s what happens when you upload an invoice:
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Before */}
            <div className="border border-neutral-800 rounded-lg overflow-hidden">
              <div className="bg-neutral-900 px-4 py-2.5 border-b border-neutral-800">
                <span className="text-xs font-medium text-red-400">
                  BEFORE — Your raw invoice PDF
                </span>
              </div>
              <div className="p-5 text-xs text-neutral-500 font-mono leading-relaxed">
                <p>INVOICE #INV-2024-0847</p>
                <p>Date: March 15, 2024</p>
                <p>From: Dhaka Jute Mills Ltd.</p>
                <p>To: Hamburg Trading GmbH</p>
                <p className="mt-2">
                  Raw Jute CB Grade ... 450 MT @ $620/MT
                </p>
                <p>Sacking Quality .... 120 MT @ $580/MT</p>
                <p className="mt-2">Subtotal: $348,600.00</p>
                <p>Freight (CIF): $12,400.00</p>
                <p>Insurance: $1,740.50</p>
                <p className="font-semibold text-neutral-400 mt-2">
                  Total: $362,740.50
                </p>
                <p className="mt-2">Payment Terms: LC at sight</p>
                <p>HS Code: 5303.10.00</p>
              </div>
            </div>

            {/* After */}
            <div className="border border-green-800/50 rounded-lg overflow-hidden">
              <div className="bg-green-900/20 px-4 py-2.5 border-b border-green-800/30">
                <span className="text-xs font-medium text-green-400">
                  AFTER — Clean, structured data (instant)
                </span>
              </div>
              <pre className="p-5 text-xs text-green-300/80 leading-relaxed overflow-auto">
{`{
  "invoice_number": "INV-2024-0847",
  "date": "2024-03-15",
  "seller": "Dhaka Jute Mills Ltd.",
  "buyer": "Hamburg Trading GmbH",
  "line_items": [
    {
      "description": "Raw Jute CB Grade",
      "quantity": "450 MT",
      "unit_price": 620,
      "total": 279000
    },
    {
      "description": "Sacking Quality",
      "quantity": "120 MT",
      "unit_price": 580,
      "total": 69600
    }
  ],
  "subtotal": 348600,
  "freight": 12400,
  "insurance": 1740.50,
  "total": 362740.50,
  "payment_terms": "LC at sight",
  "hs_code": "5303.10.00"
}`}
              </pre>
            </div>
          </div>

          <p className="text-center text-xs text-neutral-600 mt-6">
            This took 1.2 seconds. Manual entry would take 8-12 minutes.
          </p>
        </div>
      </section>

      {/* What You Can Do — Use Cases */}
      <section className="border-t border-neutral-800 px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-3">
            What Can You Do With Nexus?
          </h2>
          <p className="text-neutral-400 text-center mb-12">
            Everything your trade operations team does manually — automated.
          </p>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="border border-neutral-800 rounded-lg p-6 hover:border-green-800/50 transition-colors">
              <div className="flex items-start gap-4">
                <span className="text-2xl shrink-0">📋</span>
                <div>
                  <h3 className="font-semibold mb-1">
                    Extract Data from Any Document
                  </h3>
                  <p className="text-sm text-neutral-400">
                    Upload invoices, packing lists, bills of lading, or customs
                    forms. Get back clean, structured data you can use anywhere.
                  </p>
                  <p className="text-xs text-green-400 mt-2">
                    Costs 1 credit per document
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-neutral-800 rounded-lg p-6 hover:border-blue-800/50 transition-colors">
              <div className="flex items-start gap-4">
                <span className="text-2xl shrink-0">🔄</span>
                <div>
                  <h3 className="font-semibold mb-1">
                    Auto-Reconcile Invoices vs. POs
                  </h3>
                  <p className="text-sm text-neutral-400">
                    Our AI compares your invoices against purchase orders and
                    flags every mismatch — amounts, quantities, dates, terms.
                  </p>
                  <p className="text-xs text-blue-400 mt-2">
                    Costs 10 credits per reconciliation
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-neutral-800 rounded-lg p-6 hover:border-blue-800/50 transition-colors">
              <div className="flex items-start gap-4">
                <span className="text-2xl shrink-0">🚢</span>
                <div>
                  <h3 className="font-semibold mb-1">
                    Match Shipments to Inventory
                  </h3>
                  <p className="text-sm text-neutral-400">
                    Cross-reference shipping documents against your warehouse
                    records. Catch shortages before they become problems.
                  </p>
                  <p className="text-xs text-blue-400 mt-2">
                    Costs 10 credits per match
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-neutral-800 rounded-lg p-6 hover:border-blue-800/50 transition-colors">
              <div className="flex items-start gap-4">
                <span className="text-2xl shrink-0">🛃</span>
                <div>
                  <h3 className="font-semibold mb-1">
                    Verify Customs Compliance
                  </h3>
                  <p className="text-sm text-neutral-400">
                    Check HS codes, validate certificates of origin, and score
                    compliance risk before your shipment hits the border.
                  </p>
                  <p className="text-xs text-blue-400 mt-2">
                    Costs 10 credits per verification
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Calculator — show the money */}
      <section className="border-t border-neutral-800 px-6 py-16 bg-neutral-900/50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-3">
            The Math Is Simple
          </h2>
          <p className="text-neutral-400 mb-10">
            Even at 20 documents per day, here&apos;s what you save:
          </p>

          <div className="grid sm:grid-cols-3 gap-6 mb-10">
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
              <p className="text-3xl font-bold text-red-400">3.3 hrs</p>
              <p className="text-xs text-neutral-500 mt-1">
                Manual entry per day
              </p>
              <p className="text-[10px] text-neutral-600 mt-0.5">
                @ 10 min per document
              </p>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
              <p className="text-3xl font-bold text-green-400">24 sec</p>
              <p className="text-xs text-neutral-500 mt-1">
                With Nexus per day
              </p>
              <p className="text-[10px] text-neutral-600 mt-0.5">
                @ 1.2 sec per document
              </p>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
              <p className="text-3xl font-bold text-amber-400">$2,800</p>
              <p className="text-xs text-neutral-500 mt-1">
                Saved per month
              </p>
              <p className="text-[10px] text-neutral-600 mt-0.5">
                @ $40/hr labor cost
              </p>
            </div>
          </div>

          <p className="text-neutral-500 text-sm">
            Nexus Pro costs $49/month. You save $2,800/month.{" "}
            <span className="text-white font-medium">
              That&apos;s a 57x return.
            </span>
          </p>
        </div>
      </section>

      {/* Pricing — with clear value explanation */}
      <section id="pricing" className="border-t border-neutral-800 px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3">
            Simple Pricing
          </h2>
          <p className="text-neutral-400 text-center mb-12">
            Start free. Upgrade when you need more.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {Object.values(PLANS).map((plan) => (
              <div
                key={plan.name}
                className={`border rounded-lg p-6 flex flex-col ${
                  plan.name === "pro"
                    ? "border-blue-600 bg-blue-600/5 relative"
                    : "border-neutral-800"
                }`}
              >
                {plan.name === "pro" && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-medium text-blue-400 bg-blue-600/20 px-3 py-0.5 rounded-full">
                    Best Value
                  </span>
                )}
                <h3 className="text-xl font-bold">{plan.display}</h3>
                <div className="mt-2 mb-1">
                  <span className="text-3xl font-bold">
                    {plan.price_monthly === 0
                      ? "Free"
                      : `$${plan.price_monthly / 100}`}
                  </span>
                  {plan.price_monthly > 0 && (
                    <span className="text-neutral-500 text-sm">/month</span>
                  )}
                </div>
                <p className="text-xs text-neutral-500 mb-4">
                  {plan.name === "free"
                    ? "Try it out — no card needed"
                    : plan.name === "pro"
                      ? "For growing trade businesses"
                      : "For large import/export operations"}
                </p>

                <div className="mb-4 p-3 bg-neutral-900/50 rounded-lg">
                  <p className="text-sm font-medium text-white">
                    {plan.credits.toLocaleString()} credits/month
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {plan.name === "free"
                      ? "= ~1,000 documents or 100 reconciliations"
                      : plan.name === "pro"
                        ? "= ~25,000 documents or 2,500 reconciliations"
                        : "= ~500,000 documents or 50,000 reconciliations"}
                  </p>
                </div>

                <ul className="space-y-2 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-sm text-neutral-400"
                    >
                      <span className="text-green-400 mt-0.5 shrink-0">
                        ✓
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`block text-center py-2.5 rounded-md text-sm font-medium transition-colors ${
                    plan.name === "pro"
                      ? "bg-white text-black hover:bg-neutral-200"
                      : "border border-neutral-700 hover:border-neutral-500"
                  }`}
                >
                  {plan.name === "enterprise"
                    ? "Contact Sales"
                    : plan.name === "free"
                      ? "Start Free"
                      : "Start 14-Day Trial"}
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-neutral-600 mt-6">
            All plans include: API access, team collaboration, webhook
            notifications, and cryptographically signed audit trail.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-neutral-800 px-6 py-16">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">
            Common Questions
          </h2>

          {[
            {
              q: "What types of documents can I upload?",
              a: "Any trade document — invoices, purchase orders, packing lists, bills of lading, customs declarations, certificates of origin. We support PDF, CSV, and text files up to 10MB.",
            },
            {
              q: "How accurate is the data extraction?",
              a: "Our parser extracts dates, amounts, invoice numbers, line items, and key-value pairs with 94%+ accuracy. You can review the output before using it.",
            },
            {
              q: "What does a 'credit' get me?",
              a: "1 credit = 1 document parsed. 10 credits = 1 AI reconciliation workflow (comparing invoices to POs, matching shipments, or verifying customs docs). Free accounts get 1,000 credits.",
            },
            {
              q: "Can I connect this to my existing systems?",
              a: "Yes. Every feature is available via REST API. Generate API keys in your dashboard, and send documents programmatically. Get webhook notifications when processing completes.",
            },
            {
              q: "Is my data secure?",
              a: "Every transaction is cryptographically signed (HMAC-SHA256). Your data is tenant-isolated at the database level. We never share data between accounts.",
            },
            {
              q: "Can my whole team use it?",
              a: "Yes. Invite team members with different roles — admins can manage settings, members can process documents, viewers can see results without making changes.",
            },
          ].map((faq) => (
            <div
              key={faq.q}
              className="border-b border-neutral-800 py-5 last:border-0"
            >
              <h3 className="text-sm font-medium mb-2">{faq.q}</h3>
              <p className="text-sm text-neutral-500">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-neutral-800 px-6 py-16 bg-neutral-900/50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-3">
            Ready to stop doing data entry?
          </h2>
          <p className="text-neutral-400 mb-6">
            Upload your first document in under 60 seconds.
          </p>
          <Link
            href="/signup"
            className="inline-block bg-white text-black px-8 py-3 rounded-md font-medium hover:bg-neutral-200 transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      <footer className="border-t border-neutral-800 px-6 py-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="text-sm font-semibold tracking-tight">nexus</span>
          <div className="flex gap-6 text-xs text-neutral-500">
            <Link href="/docs" className="hover:text-white transition-colors">
              API Docs
            </Link>
            <Link
              href="#pricing"
              className="hover:text-white transition-colors"
            >
              Pricing
            </Link>
            <Link href="/login" className="hover:text-white transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
