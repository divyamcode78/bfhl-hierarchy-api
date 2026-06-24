function TreeNode({ name, children }) {
  const childEntries = Object.entries(children || {});

  return (
    <li className="relative pl-4 before:absolute before:left-0 before:top-3 before:h-px before:w-3 before:bg-slate-600">
      <span className="inline-flex items-center rounded-md bg-slate-800 px-2 py-1 text-sm font-medium text-indigo-200 ring-1 ring-slate-700">
        {name}
      </span>
      {childEntries.length > 0 && (
        <ul className="mt-2 space-y-2 border-l border-slate-700 pl-4">
          {childEntries.map(([childName, subTree]) => (
            <TreeNode key={childName} name={childName} children={subTree} />
          ))}
        </ul>
      )}
    </li>
  );
}

function TreeView({ tree }) {
  const entries = Object.entries(tree || {});

  if (entries.length === 0) {
    return (
      <p className="text-sm italic text-slate-500">No child nodes to display.</p>
    );
  }

  return (
    <ul className="space-y-2">
      {entries.map(([name, children]) => (
        <TreeNode key={name} name={name} children={children} />
      ))}
    </ul>
  );
}

export default TreeView;
