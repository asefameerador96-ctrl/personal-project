import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col bg-black text-white">
      <nav className="border-b border-neutral-800 px-6 py-4 flex justify-between items-center">
        <span className="text-lg font-semibold tracking-tight">nexus</span>
        <div className="flex gap-4 items-center">
          <Link href="/login" className="text-sm text-neutral-400 hover:text-white transition-colors">
            Log in
          </Link>
          <Link
            href="/signup"
            className="text-sm bg-white text-black px-4 py-1.5 rounded-md font-medium hover:bg-neutral-200 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      <section className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-3xl mx-auto gap-8 py-24">
        <div className="flex gap-2 flex-wrap justify-center">
          <span className="text-xs font-mono bg-neutral-800 text-neutral-300 px-3 py-1 rounded-full">
            Layer 1: Utilities
          </span>
          <span className="text-xs font-mono bg-neutral-800 text-neutral-300 px-3 py-1 rounded-full">
            Layer 2: Agents
          </span>
          <span className="text-xs font-mono bg-neutral-800 text-neutral-300 px-3 py-1 rounded-full">
            Layer 3: Ledger
          </span>
        </div>

        <h1 className="text-5xl font-bold tracking-tight leading-tight">
          Trade infrastructure
          <br />
          <span className="text-neutral-500">that compounds.</span>
        </h1>

        <p className="text-neutral-400 text-lg max-w-xl">
          Parse documents at scale. Let AI agents reconcile your supply chain.
          Route settlements through embedded rails. One platform, three layers of leverage.
        </p>

        <div className="flex gap-4">
          <Link
            href="/signup"
            className="bg-white text-black px-6 py-2.5 rounded-md font-medium hover:bg-neutral-200 transition-colors"
          >
            Start Free
          </Link>
          <Link
            href="#layers"
            className="border border-neutral-700 text-neutral-300 px-6 py-2.5 rounded-md font-medium hover:border-neutral-500 transition-colors"
          >
            See the Stack
          </Link>
        </div>
      </section>

      <section id="layers" className="border-t border-neutral-800 py-20 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
          <div className="p-6 border border-neutral-800 rounded-lg">
            <div className="text-xs font-mono text-green-400 mb-3">/api/v1/utility</div>
            <h3 className="text-lg font-semibold mb-2">High-Throughput Utilities</h3>
            <p className="text-neutral-400 text-sm">
              PDF-to-JSON, invoice parsing, CSV normalization, bill of lading extraction.
              Stateless, fast, credit-metered.
            </p>
          </div>
          <div className="p-6 border border-neutral-800 rounded-lg">
            <div className="text-xs font-mono text-blue-400 mb-3">/api/v1/agent</div>
            <h3 className="text-lg font-semibold mb-2">Agentic Workflows</h3>
            <p className="text-neutral-400 text-sm">
              Multi-step AI agents that reconcile invoices, match shipments,
              sync to your ERP, and verify customs documents automatically.
            </p>
          </div>
          <div className="p-6 border border-neutral-800 rounded-lg">
            <div className="text-xs font-mono text-amber-400 mb-3">/api/v1/ledger</div>
            <h3 className="text-lg font-semibold mb-2">Settlement Rails</h3>
            <p className="text-neutral-400 text-sm">
              Immutable transaction ledger with cryptographic signing.
              Usage metering, credit management, and payment routing built in.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-neutral-800 px-6 py-6 text-center text-xs text-neutral-500">
        nexus — unified trade infrastructure
      </footer>
    </main>
  );
}
