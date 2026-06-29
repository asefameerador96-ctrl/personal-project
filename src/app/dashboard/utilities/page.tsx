"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

interface JobResult {
  job: Record<string, unknown>;
  result: Record<string, unknown>;
}

export default function UtilitiesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<JobResult | null>(null);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback((f: File) => {
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!ext || !["pdf", "csv", "txt"].includes(ext)) {
      setError("Unsupported file type. Use PDF, CSV, or TXT.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("File too large (max 10MB).");
      return;
    }
    setFile(f);
    setError("");
    setResult(null);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/v1/utility/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Upload failed");
        setLoading(false);
        return;
      }

      setResult(json.data);
      if (json.meta?.credits_remaining !== undefined) {
        setCreditsRemaining(json.meta.credits_remaining);
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 bg-black text-white">
      <nav className="border-b border-neutral-800 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
            nexus
          </Link>
          <span className="text-neutral-600">/</span>
          <span className="text-sm text-neutral-400">Utilities</span>
        </div>
        {creditsRemaining !== null && (
          <span className="text-xs text-neutral-500">
            {creditsRemaining.toLocaleString()} credits remaining
          </span>
        )}
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold mb-2">Document Parser</h1>
        <p className="text-neutral-400 text-sm mb-8">
          Upload a PDF, CSV, or TXT file to extract structured data instantly.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files[0];
              if (f) handleFile(f);
            }}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              dragOver
                ? "border-green-500 bg-green-500/5"
                : file
                ? "border-green-700 bg-green-900/10"
                : "border-neutral-700 hover:border-neutral-600"
            }`}
          >
            {file ? (
              <div>
                <p className="text-green-400 font-medium">{file.name}</p>
                <p className="text-neutral-500 text-sm mt-1">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
                <button
                  type="button"
                  onClick={() => { setFile(null); setResult(null); }}
                  className="text-neutral-500 text-xs mt-3 hover:text-white transition-colors"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <p className="text-neutral-400">
                  Drag and drop a file here, or{" "}
                  <label className="text-white cursor-pointer hover:underline">
                    browse
                    <input
                      type="file"
                      accept=".pdf,.csv,.txt"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFile(f);
                      }}
                    />
                  </label>
                </p>
                <p className="text-neutral-600 text-xs mt-2">
                  PDF, CSV, TXT up to 10MB — costs 1 credit
                </p>
              </div>
            )}
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={!file || loading}
            className="w-full bg-white text-black rounded-md py-2.5 text-sm font-medium hover:bg-neutral-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : "Parse Document (1 credit)"}
          </button>
        </form>

        {result && (
          <div className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Parsed Output</h2>
              <button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(result.result, null, 2)], {
                    type: "application/json",
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "parsed-output.json";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="text-xs text-neutral-400 border border-neutral-700 px-3 py-1 rounded hover:border-neutral-500 transition-colors"
              >
                Download JSON
              </button>
            </div>
            <pre className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 text-xs text-neutral-300 overflow-auto max-h-96">
              {JSON.stringify(result.result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </main>
  );
}
