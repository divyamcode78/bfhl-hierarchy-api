import { useState } from "react";
import api from "./utils/api";
import Spinner from "./components/Spinner";
import SummaryCard from "./components/SummaryCard";
import HierarchyCard from "./components/HierarchyCard";

const EXAMPLE_INPUT = `{
  "data": ["A->B", "A->C", "B->D", "C->E"]
}`;

function parseInput(rawInput) {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    throw new Error("Please enter JSON input before submitting.");
  }

  let parsed;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new Error("Invalid JSON. Use format: { \"data\": [\"A->B\", \"B->C\"] }");
  }

  if (!parsed.data || !Array.isArray(parsed.data)) {
    throw new Error('JSON must contain a "data" array of edges.');
  }

  return parsed;
}

function App() {
  const [input, setInput] = useState(EXAMPLE_INPUT);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setResult(null);

    let payload;
    try {
      payload = parseInput(input);
    } catch (parseError) {
      setError(parseError.message);
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/bfhl", payload);
      setResult(response.data);
    } catch (requestError) {
      const message =
        requestError.response?.data?.error ||
        requestError.response?.data?.message ||
        "Failed to reach the backend API. Make sure the server is running.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 text-center sm:text-left">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-indigo-400">
            Chitkara BFHL Challenge
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Hierarchy Visualizer
          </h1>
          <p className="mt-2 max-w-2xl text-slate-400">
            Submit parent-child edges in JSON format. The API validates input,
            detects cycles, and returns tree structures.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Input panel */}
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg sm:p-6"
          >
            <label htmlFor="json-input" className="text-sm font-medium text-slate-300">
              JSON Input
            </label>
            <textarea
              id="json-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={14}
              spellCheck={false}
              className="mt-3 w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 font-mono text-sm text-slate-100 outline-none ring-indigo-500/0 transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
              placeholder='{ "data": ["A->B", "B->C"] }'
            />

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Processing..." : "Submit"}
              </button>
              <button
                type="button"
                onClick={() => setInput(EXAMPLE_INPUT)}
                className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
              >
                Load example
              </button>
            </div>

            <p className="mt-4 text-xs text-slate-500">
              Each edge must follow the pattern X-&gt;Y using uppercase letters A–Z.
            </p>
          </form>

          {/* Results panel */}
          <div className="space-y-6">
            {error && (
              <div
                role="alert"
                className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-200"
              >
                {error}
              </div>
            )}

            {loading && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg">
                <Spinner />
              </div>
            )}

            {!loading && result && (
              <>
                <SummaryCard
                  summary={result.summary}
                  extras={{
                    invalid_entries: result.invalid_entries,
                    duplicate_edges: result.duplicate_edges,
                    multi_parent_edges: result.multi_parent_edges,
                    connected_components: result.connected_components,
                  }}
                />

                <section className="space-y-4">
                  <h2 className="text-lg font-semibold text-white">
                    Hierarchies ({result.hierarchies?.length || 0})
                  </h2>

                  {result.hierarchies?.length > 0 ? (
                    result.hierarchies.map((hierarchy, index) => (
                      <HierarchyCard
                        key={`${hierarchy.root}-${index}`}
                        hierarchy={hierarchy}
                        index={index}
                      />
                    ))
                  ) : (
                    <p className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 text-sm text-slate-400">
                      No hierarchy trees were returned for this input.
                    </p>
                  )}
                </section>
              </>
            )}

            {!loading && !error && !result && (
              <div className="flex h-full min-h-48 items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-6 text-center text-sm text-slate-500">
                Submit JSON to see the summary and hierarchy trees here.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
