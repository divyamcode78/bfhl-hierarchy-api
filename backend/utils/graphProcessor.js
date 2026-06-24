// Validates a single edge string: must be X->Y with uppercase A-Z letters only
const EDGE_PATTERN = /^[A-Z]->[A-Z]$/;

function isValidEdge(entry) {
  return typeof entry === "string" && EDGE_PATTERN.test(entry.trim());
}

function parseEdge(entry) {
  const [parent, child] = entry.trim().split("->");
  return { parent, child };
}

function edgeKey(parent, child) {
  return `${parent}->${child}`;
}

// DFS cycle detection — a back-edge in the recursion stack means a cycle exists
function hasCycle(adjacencyList, nodes) {
  const visited = new Set();
  const inStack = new Set();

  function dfs(node) {
    visited.add(node);
    inStack.add(node);

    for (const neighbor of adjacencyList[node] || []) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (inStack.has(neighbor)) {
        return true;
      }
    }

    inStack.delete(node);
    return false;
  }

  for (const node of nodes) {
    if (!visited.has(node) && dfs(node)) {
      return true;
    }
  }

  return false;
}

// Roots have no incoming edges inside the component
function findRoots(component, adjacencyList) {
  const componentSet = new Set(component);
  const incoming = new Set();

  for (const node of component) {
    for (const child of adjacencyList[node] || []) {
      if (componentSet.has(child)) {
        incoming.add(child);
      }
    }
  }

  return component.filter((node) => !incoming.has(node));
}

// Build nested tree object wrapped under the root key
function buildTree(root, adjacencyList) {
  function buildSubtree(node) {
    const children = adjacencyList[node] || [];
    const result = {};

    for (const child of children) {
      result[child] = buildSubtree(child);
    }

    return result;
  }

  return { [root]: buildSubtree(root) };
}

// Depth = number of nodes on the longest root-to-leaf path (root counts as 1)
function calculateDepth(root, adjacencyList) {
  function dfs(node) {
    const children = adjacencyList[node] || [];
    if (children.length === 0) {
      return 1;
    }
    const childDepths = children.map((child) => dfs(child));
    return 1 + Math.max(...childDepths);
  }

  return dfs(root);
}

// Weakly connected components — order follows first edge discovery
function findConnectedComponents(adjacencyList, firstSeen) {
  const nodes = [...firstSeen.keys()];
  const undirected = {};

  for (const node of nodes) {
    undirected[node] = new Set();
  }

  for (const node of nodes) {
    for (const child of adjacencyList[node] || []) {
      undirected[node].add(child);
      undirected[child].add(node);
    }
  }

  const visited = new Set();
  const components = [];

  for (const node of nodes) {
    if (visited.has(node)) continue;

    const component = [];
    const queue = [node];
    visited.add(node);

    while (queue.length > 0) {
      const current = queue.shift();
      component.push(current);

      for (const neighbor of undirected[current]) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    components.push(component);
  }

  // Keep component order based on when nodes first appeared in the input
  components.sort((a, b) => {
    const orderA = Math.min(...a.map((n) => firstSeen.get(n)));
    const orderB = Math.min(...b.map((n) => firstSeen.get(n)));
    return orderA - orderB;
  });

  return components;
}

function getComponentAdjacency(component, adjacencyList) {
  const componentSet = new Set(component);
  const subAdj = {};

  for (const node of component) {
    subAdj[node] = (adjacencyList[node] || []).filter((child) =>
      componentSet.has(child)
    );
  }

  return subAdj;
}

function processHierarchy(dataArray) {
  const invalidEntries = [];
  const duplicateEdges = [];
  const seenEdges = new Set();
  const parsedEdges = [];

  // Step 1: validate format and collect duplicates
  for (const entry of dataArray) {
    if (!isValidEdge(entry)) {
      invalidEntries.push(entry);
      continue;
    }

    const { parent, child } = parseEdge(entry);

    if (parent === child) {
      invalidEntries.push(entry);
      continue;
    }

    const key = edgeKey(parent, child);
    if (seenEdges.has(key)) {
      if (!duplicateEdges.includes(key)) {
        duplicateEdges.push(key);
      }
      continue;
    }

    seenEdges.add(key);
    parsedEdges.push({ parent, child });
  }

  // Step 2: multi-parent rule — keep first parent only, ignore later edges silently
  const childToParent = new Map();
  const validEdges = [];
  const adjacencyList = {};
  const firstSeen = new Map();
  let discoveryOrder = 0;

  for (const edge of parsedEdges) {
    const { parent, child } = edge;

    if (childToParent.has(child) && childToParent.get(child) !== parent) {
      continue;
    }

    if (!childToParent.has(child)) {
      childToParent.set(child, parent);
    }

    for (const node of [parent, child]) {
      if (!firstSeen.has(node)) {
        firstSeen.set(node, discoveryOrder++);
      }
    }

    if (!adjacencyList[parent]) {
      adjacencyList[parent] = [];
    }
    adjacencyList[parent].push(child);
    validEdges.push(edge);
  }

  for (const node of firstSeen.keys()) {
    if (!adjacencyList[node]) {
      adjacencyList[node] = [];
    }
  }

  // Step 3: process each connected component independently
  const connectedComponents = findConnectedComponents(adjacencyList, firstSeen);
  const hierarchies = [];
  let totalTrees = 0;
  let totalCycles = 0;
  let largestTree = { root: null, depth: 0 };

  for (const component of connectedComponents) {
    const subAdj = getComponentAdjacency(component, adjacencyList);
    const roots = findRoots(component, adjacencyList);
    const componentHasCycle = hasCycle(subAdj, component);

    if (componentHasCycle) {
      totalCycles += 1;

      const root =
        roots.length > 0
          ? [...roots].sort()[0]
          : [...component].sort()[0];

      hierarchies.push({
        root,
        tree: {},
        has_cycle: true,
      });
      continue;
    }

    totalTrees += 1;

    const root = [...roots].sort()[0];
    const tree = buildTree(root, subAdj);
    const depth = calculateDepth(root, subAdj);

    hierarchies.push({ root, tree, depth });

    if (
      depth > largestTree.depth ||
      (depth === largestTree.depth &&
        (!largestTree.root || root < largestTree.root))
    ) {
      largestTree = { root, depth };
    }
  }

  return {
    hierarchies,
    invalid_entries: invalidEntries,
    duplicate_edges: duplicateEdges,
    summary: {
      total_trees: totalTrees,
      total_cycles: totalCycles,
      largest_tree_root: largestTree.root,
    },
  };
}

module.exports = {
  processHierarchy,
  isValidEdge,
  parseEdge,
};
