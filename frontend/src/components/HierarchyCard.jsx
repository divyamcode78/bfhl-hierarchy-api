import TreeView from "./TreeView";

function HierarchyCard({ hierarchy, index }) {
  const { root, tree, depth, has_cycle } = hierarchy;

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Tree {index + 1}
          </p>
          <h3 className="text-xl font-semibold text-white">Root: {root}</h3>
        </div>

        <div className="flex flex-wrap gap-2">
          {has_cycle ? (
            <span className="rounded-full bg-rose-500/15 px-3 py-1 text-xs font-medium text-rose-300 ring-1 ring-rose-500/30">
              Cycle detected
            </span>
          ) : (
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300 ring-1 ring-emerald-500/30">
              Depth: {depth}
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-slate-950/60 p-4 ring-1 ring-slate-800">
        <p className="mb-3 text-sm font-medium text-slate-400">Hierarchy</p>
        {has_cycle ? (
          <p className="text-sm text-rose-300">
            Tree cannot be built because a cycle exists in this component.
          </p>
        ) : (
          <TreeView tree={tree} />
        )}
      </div>
    </article>
  );
}

export default HierarchyCard;
