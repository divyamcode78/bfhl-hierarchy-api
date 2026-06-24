# Backend Code Explanation

This document explains how the BFHL Hierarchy API backend works — file by file, function by function.

---

## Project structure

```
backend/
├── server.js              # Express app entry point
├── routes/
│   └── bfhlRoutes.js      # GET and POST /bfhl handlers
├── utils/
│   └── graphProcessor.js  # All graph logic (core of the project)
├── package.json
└── CODE_EXPLANATION.md    # This file
```

---

## Request flow

```
Client (POST /bfhl)
       │
       ▼
  server.js          → mounts middleware (CORS, JSON parser)
       │
       ▼
  bfhlRoutes.js      → validates request body, adds user metadata
       │
       ▼
  graphProcessor.js  → validates edges, builds graph, runs algorithms
       │
       ▼
  JSON response      → hierarchies, summary, errors, etc.
```

---

## `server.js` — Application entry point

This file creates the Express server and wires everything together.

| Line / section | What it does |
|----------------|--------------|
| `express()` | Creates the web server application |
| `cors()` | Allows the React frontend (different port) to call this API |
| `express.json()` | Parses incoming JSON request bodies automatically |
| `app.use("/bfhl", bfhlRoutes)` | All routes in `bfhlRoutes.js` are served under `/bfhl` |
| `GET /api/health` | Simple health check — confirms the server is running |
| `app.listen(PORT)` | Starts listening on port 5000 (or `process.env.PORT`) |

**Why separate routes?** Keeping route handlers in `routes/` and business logic in `utils/` makes the code easier to read and test.

---

## `routes/bfhlRoutes.js` — API endpoints

### `GET /bfhl`

Returns a hardcoded BFHL operation code:

```json
{ "operation_code": 1 }
```

This is required by the standard BFHL challenge health-check format.

### `POST /bfhl`

**Input expected:**

```json
{
  "data": ["A->B", "A->C", "B->D"]
}
```

**Steps:**

1. Extract `data` from `req.body`
2. Return `400` if `data` is missing or not an array
3. Call `processHierarchy(data)` from `graphProcessor.js`
4. Attach user metadata from environment variables:
   - `BFHL_USER_ID` (default: `user_ddmmyyyy`)
   - `BFHL_EMAIL` (default: `user@example.com`)
   - `BFHL_ROLL_NUMBER` (default: `NA`)
5. Return the combined JSON response with `is_success: true`
6. On unexpected errors, return `500` with an error message

The route file does **not** contain graph logic — it only handles HTTP concerns.

---

## `utils/graphProcessor.js` — Core graph engine

This is the most important file. It takes an array of edge strings and returns a full analysis.

### Input format

Each edge must match the pattern `X->Y` where X and Y are single uppercase letters (`A`–`Z`).

Examples:
- Valid: `A->B`, `Z->X`
- Invalid: `a->b` (lowercase), `AB->C` (multi-char), `A->A` (self-loop), `A-B` (wrong separator)

---

### Helper functions

#### `isValidEdge(entry)`

Uses the regex `/^[A-Z]->[A-Z]$/` to check if a string is a valid edge format.

#### `parseEdge(entry)`

Splits `"A->B"` into `{ parent: "A", child: "B" }`.

#### `edgeKey(parent, child)`

Returns `"A->B"` — used as a unique key for duplicate detection.

#### `hasCycle(adjacencyList, nodes)` — Cycle detection

Uses **Depth-First Search (DFS)** with a recursion stack:

1. Mark the current node as visited and add it to `inStack`
2. Visit each neighbor
3. If a neighbor is already in `inStack`, we found a **back-edge** → cycle exists
4. Remove the node from `inStack` when backtracking

**Time complexity:** O(V + E) where V = nodes, E = edges.

#### `findRoots(nodes, nodesWithIncoming)`

A **root** is a node with no incoming edges. These are the top-level nodes of each tree.

#### `buildTree(root, adjacencyList)`

Recursively builds a nested object for the frontend to render:

```
Input edges:  A->B, B->C, A->D

Output tree from root A:
{
  "B": { "C": {} },
  "D": {}
}
```

Each key is a child node; `{}` means no further children (leaf).

#### `calculateDepth(root, adjacencyList)`

Finds the **longest path from root to any leaf**, counting nodes (not edges).

- Root alone → depth = 1
- A → B → C → depth = 3

Uses recursive DFS and takes the maximum child depth + 1.

#### `findConnectedComponents(nodes, adjacencyList)`

Finds **weakly connected components** — groups of nodes connected when edge direction is ignored.

1. Build an undirected adjacency list (if A→B exists, both A↔B are neighbors)
2. Run BFS from each unvisited node
3. Each BFS traversal gives one component

Example: `A->B` and `D->E` produce two components: `[A,B]` and `[D,E]`.

---

### `processHierarchy(dataArray)` — Main pipeline

This function runs five steps in order:

#### Step 1: Validation and duplicate detection

For each entry in `data`:
- Invalid format → add to `invalid_entries`
- Self-loop (`A->A`) → add to `invalid_entries`
- Duplicate edge (same `parent->child` seen before) → add to `duplicate_edges`, skip
- Otherwise → add to `parsedEdges`

Only the **first occurrence** of each edge is kept.

#### Step 2: Multi-parent rule

Each child node can have **only one parent**. The first parent wins.

```
Input:  A->C, B->C
Result: A->C is kept, B->C goes to multi_parent_edges
```

This enforces a tree structure (one parent per child).

#### Step 3: Graph analysis

After building the adjacency list:
- `findConnectedComponents()` — how many disconnected groups exist
- `hasCycle()` — whether any directed cycle exists
- `findRoots()` — nodes with no incoming edges

#### Step 4: Build hierarchies

**If no cycle:**
- For each root, build a nested `tree` object and calculate `depth`
- Track the largest tree (by depth, then alphabetically by root name)

**If cycle exists:**
- Trees cannot be built reliably
- Return each root (or smallest node per component) with `has_cycle: true` and empty `tree`

#### Step 5: Build summary

```json
{
  "total_trees": 2,
  "total_cycles": 0,
  "largest_tree_root": "A",
  "total_nodes": 6,
  "total_valid_edges": 4,
  "connected_component_count": 2,
  "multi_parent_violations": 1
}
```

---

### Full response shape

```json
{
  "hierarchies": [
    {
      "root": "A",
      "tree": { "B": { "C": {} } },
      "depth": 3
    }
  ],
  "invalid_entries": [],
  "duplicate_edges": [],
  "multi_parent_edges": [],
  "connected_components": [["A", "B", "C"]],
  "summary": { ... }
}
```

---

## Algorithms summary

| Problem | Algorithm | Complexity |
|---------|-----------|------------|
| Cycle detection | DFS with recursion stack | O(V + E) |
| Connected components | BFS on undirected graph | O(V + E) |
| Tree building | Recursive DFS | O(V + E) |
| Depth calculation | Recursive DFS (max path) | O(V + E) |
| Duplicate detection | HashSet (`seenEdges`) | O(E) |
| Multi-parent check | Map (`childToParent`) | O(E) |

---

## Running the backend

```bash
cd backend
npm install
npm run dev    # development with nodemon (auto-restart)
npm start      # production
```

Server runs at `http://localhost:5000`.

### Test with curl

```bash
curl -X POST http://localhost:5000/bfhl \
  -H "Content-Type: application/json" \
  -d '{"data": ["A->B", "B->C", "A->C"]}'
```

---

## Environment variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `PORT` | Server port | `5000` |
| `BFHL_USER_ID` | User ID in response | `user_ddmmyyyy` |
| `BFHL_EMAIL` | Email in response | `user@example.com` |
| `BFHL_ROLL_NUMBER` | Roll number in response | `NA` |
