# Frontend

React + Vite frontend for Pomodoro Project Manager.

## Install

```bash
npm install
```

## Run

```bash
npm run dev
```

Default URL: http://localhost:5173

## Build

```bash
npm run build
```

## API Configuration

Create frontend/.env.local (optional):

```bash
VITE_API_BASE_URL=http://localhost:8080
```

If omitted, the app defaults to http://localhost:8080.

## Behavior

- Loads projects from GET /api/projects on page load
- Creates projects through POST /api/projects
- Updates projects through PUT /api/projects/{id}
- Deletes all projects through DELETE /api/projects
