# bfhl-hierarchy-api

REST API and React frontend for the Chitkara BFHL hierarchy challenge — processing hierarchical node relationships with cycle detection, duplicate handling, and tree visualization.

## Project structure

```
bfhl-hierarchy-api/
├── backend/          # Node.js + Express API
│   ├── server.js
│   ├── routes/
│   └── utils/
├── frontend/         # React + Vite + TailwindCSS
│   ├── src/
│   └── public/
├── README.md
└── .gitignore
```

## Prerequisites

- Node.js 18+
- npm

## Getting started

### Backend

```bash
cd backend
npm install
npm run dev
```

The API runs at `http://localhost:5000`.

Health check: `GET /api/health`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173` and proxies `/api` requests to the backend during development.

## Tech stack

**Frontend:** React, Vite, TailwindCSS, Axios

**Backend:** Node.js, Express, CORS, Nodemon

## Scripts

| Location   | Command       | Description              |
| ---------- | ------------- | ------------------------ |
| `backend`  | `npm run dev` | Start API with nodemon   |
| `backend`  | `npm start`   | Start API with node      |
| `frontend` | `npm run dev` | Start Vite dev server    |
| `frontend` | `npm run build` | Build for production   |
