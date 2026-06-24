# Frontend Code Explanation

This document explains how the BFHL Hierarchy Visualizer frontend works — components, state, API calls, and UI layout.

---

## Project structure

```
frontend/
├── index.html
├── vite.config.js
├── src/
│   ├── main.jsx              # React entry point
│   ├── index.css             # TailwindCSS import
│   ├── App.jsx               # Main page (form + results)
│   ├── utils/
│   │   └── api.js            # Axios HTTP client
│   └── components/
│       ├── Spinner.jsx       # Loading indicator
│       ├── SummaryCard.jsx   # Stats and edge lists
│       ├── HierarchyCard.jsx # Single tree card
│       └── TreeView.jsx      # Recursive tree renderer
└── CODE_EXPLANATION.md       # This file
```

---

## Tech stack

| Tool | Purpose |
|------|---------|
| **React** | UI components and state management |
| **Vite** | Fast dev server and build tool |
| **TailwindCSS** | Utility-first styling |
| **Axios** | HTTP requests to the backend |

---

## Application flow

```
User types JSON in textarea
         │
         ▼
   Click "Submit"
         │
         ▼
   parseInput()        → validate JSON locally
         │
         ▼
   api.post("/bfhl")   → send to backend
         │
    ┌────┴────┐
    ▼         ▼
 Success     Error
    │         │
    ▼         ▼
 Summary    Error banner
 + Hierarchy cards
```

---

## `main.jsx` — Entry point

```jsx
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- Mounts the React app into the `<div id="root">` in `index.html`
- `StrictMode` helps catch common React mistakes during development
- Imports `index.css` which loads TailwindCSS

---

## `utils/api.js` — HTTP client

```js
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
});
```

Creates a reusable Axios instance. All API calls go through this.

- In development, Vite proxies `/bfhl` to `http://localhost:5000` (see `vite.config.js`)
- In production, set `VITE_API_URL` to your deployed backend URL

---

## `vite.config.js` — Dev server proxy

```js
proxy: {
  "/api": { target: "http://localhost:5000" },
  "/bfhl": { target: "http://localhost:5000" },
}
```

Without this proxy, the browser would try to call `localhost:5173/bfhl` (frontend port) instead of the backend. The proxy forwards those requests to port 5000.

---

## `App.jsx` — Main page

This is the central component. It manages all state and coordinates the UI.

### State variables

| State | Type | Purpose |
|-------|------|---------|
| `input` | string | Raw JSON text in the textarea |
| `result` | object \| null | API response after successful submit |
| `loading` | boolean | `true` while waiting for API |
| `error` | string \| null | Error message to display |

### `parseInput(rawInput)`

Validates the textarea content **before** calling the API:

1. Check input is not empty
2. `JSON.parse()` — catch invalid JSON syntax
3. Verify `data` field exists and is an array

Returns the parsed object `{ data: [...] }` or throws an error with a helpful message.

### `handleSubmit(event)`

Called when the form is submitted:

1. `event.preventDefault()` — stop page reload
2. Clear previous `error` and `result`
3. Run `parseInput()` — show error immediately if JSON is bad
4. Set `loading = true`
5. `api.post("/bfhl", payload)` — send to backend
6. On success → store `response.data` in `result`
7. On failure → extract error message from response or show generic message
8. Set `loading = false`

### Layout

The page uses a **responsive two-column grid**:

- **Left column:** JSON textarea + Submit / Load example buttons
- **Right column:** Error banner, spinner, summary card, hierarchy cards

On mobile (`< lg` breakpoint), columns stack vertically.

### Conditional rendering

```
if (error)        → show red error banner
if (loading)      → show Spinner
if (result)       → show SummaryCard + HierarchyCards
if (none of above)→ show placeholder "Submit JSON to see results"
```

---

## `components/Spinner.jsx`

A simple CSS loading spinner using Tailwind's `animate-spin`:

```jsx
<div className="h-8 w-8 animate-spin rounded-full border-2 border-t-indigo-400" />
```

Shown while `loading === true` in `App.jsx`.

---

## `components/SummaryCard.jsx`

Displays the `summary` object and related lists from the API response.

### `Stat` (internal component)

Renders one statistic box — a label and a value (e.g. "Trees: 2").

### `ListSection` (internal component)

Renders a titled list of items as pill-shaped tags.

- Handles string items (e.g. `"A->B"`) and array items (e.g. `["A","B","C"]` for connected components)
- Shows "None" when the list is empty

### `SummaryCard` props

| Prop | Content |
|------|---------|
| `summary` | `total_trees`, `total_cycles`, `total_nodes`, etc. |
| `extras.invalid_entries` | Bad edge strings |
| `extras.duplicate_edges` | Repeated edges |
| `extras.multi_parent_edges` | Rejected multi-parent edges |
| `extras.connected_components` | Groups of connected nodes |

Uses a responsive grid: 2 columns on mobile, up to 4 on large screens.

---

## `components/HierarchyCard.jsx`

Displays **one tree** from the `hierarchies` array.

### Props

| Prop | Type | Description |
|------|------|-------------|
| `hierarchy` | object | `{ root, tree, depth, has_cycle? }` |
| `index` | number | Position in the list (for "Tree 1", "Tree 2" labels) |

### Behavior

- Shows the root node name and tree number
- **No cycle:** green badge with depth, renders `TreeView` with the nested tree
- **Cycle detected:** red badge, shows a message instead of the tree

---

## `components/TreeView.jsx` — Recursive tree rendering

The backend returns trees as nested objects:

```json
{
  "B": {
    "D": {},
    "C": {}
  }
}
```

This means: root's children are `B`; `B` has children `D` and `C`.

### `TreeNode` (internal, recursive)

```jsx
function TreeNode({ name, children }) {
  // Render node name as a pill badge
  // If children exist, render <ul> with TreeNode for each child
}
```

Each node calls itself for every child — this is **recursion**. React handles the nested `<ul>` / `<li>` structure automatically.

Visual styling:
- Nodes appear as indigo pills
- Child lists are indented with a left border line
- Small horizontal connector lines before each node

### `TreeView`

Entry point — takes the `tree` object, converts it to `Object.entries()`, and renders a `TreeNode` for each top-level child.

If the tree is empty (`{}`), shows "No child nodes to display."

---

## Styling approach

The UI uses a **dark slate theme** with indigo accents:

| Element | Tailwind classes |
|---------|-----------------|
| Page background | `bg-slate-950` |
| Cards | `bg-slate-900/80 border-slate-800 rounded-2xl` |
| Primary button | `bg-indigo-500 hover:bg-indigo-400` |
| Error banner | `bg-rose-500/10 border-rose-500/30 text-rose-200` |
| Success badge | `bg-emerald-500/15 text-emerald-300` |
| Cycle badge | `bg-rose-500/15 text-rose-300` |

All spacing and layout use Tailwind utility classes — no separate CSS files per component.

---

## Example usage

### 1. Start both servers

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

### 2. Open the app

Visit `http://localhost:5173` (or the port Vite prints).

### 3. Submit JSON

Paste into the textarea:

```json
{
  "data": ["A->B", "A->C", "B->D", "C->E"]
}
```

Click **Submit**. You should see:
- Summary card with 1 tree, 5 nodes, depth 3
- One hierarchy card with root `A` and a nested tree

### 4. Try edge cases

| Input | What you'll see |
|-------|----------------|
| `A->B, A->B` (duplicate) | Duplicate listed in summary |
| `A->B, B->C, C->A` | Cycle badge, empty tree |
| `A->C, B->C` | Multi-parent edge listed, only A→C kept |
| `A->B, D->E` | Two hierarchy cards (two trees) |
| Invalid JSON | Red error before API is called |

---

## Production build

```bash
cd frontend
npm run build
```

Output goes to `dist/`. Serve with any static host. Set `VITE_API_URL` to your deployed backend URL at build time.

---

## Component dependency graph

```
App.jsx
 ├── api.js (Axios)
 ├── Spinner.jsx
 ├── SummaryCard.jsx
 │    ├── Stat
 │    └── ListSection
 └── HierarchyCard.jsx
      └── TreeView.jsx
           └── TreeNode (recursive)
```
