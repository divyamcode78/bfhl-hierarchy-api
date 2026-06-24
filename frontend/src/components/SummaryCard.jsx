function Stat({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-800/60 px-4 py-3 ring-1 ring-slate-700">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function ListSection({ title, items, emptyText = "None" }) {
  if (!items || items.length === 0) {
    return (
      <div>
        <h4 className="text-sm font-medium text-slate-300">{title}</h4>
        <p className="mt-1 text-sm text-slate-500">{emptyText}</p>
      </div>
    );
  }

  return (
    <div>
      <h4 className="text-sm font-medium text-slate-300">{title}</h4>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={typeof item === "string" ? item : item.join("-")}
            className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-200 ring-1 ring-slate-700"
          >
            {Array.isArray(item) ? item.join(" → ") : item}
          </span>
        ))}
      </div>
    </div>
  );
}

function SummaryCard({ summary, extras }) {
  if (!summary) return null;

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg sm:p-6">
      <h2 className="text-lg font-semibold text-white">Summary</h2>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <Stat label="Trees" value={summary.total_trees} />
        <Stat label="Cycles" value={summary.total_cycles} />
        <Stat label="Nodes" value={summary.total_nodes} />
        <Stat label="Valid edges" value={summary.total_valid_edges} />
        <Stat label="Components" value={summary.connected_component_count} />
        <Stat label="Multi-parent" value={summary.multi_parent_violations} />
        <Stat
          label="Largest root"
          value={summary.largest_tree_root || "—"}
        />
      </div>

      <div className="mt-6 space-y-4 border-t border-slate-800 pt-5">
        <ListSection title="Invalid entries" items={extras.invalid_entries} />
        <ListSection title="Duplicate edges" items={extras.duplicate_edges} />
        <ListSection
          title="Multi-parent edges"
          items={extras.multi_parent_edges}
        />
        <ListSection
          title="Connected components"
          items={extras.connected_components}
          emptyText="No components"
        />
      </div>
    </section>
  );
}

export default SummaryCard;
