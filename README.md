# Pomodoro Project Manager

A full-stack productivity application that combines the Pomodoro Technique with project management. Track projects, run timed work sessions, and monitor progress through a React frontend backed by a Spring Boot REST API and PostgreSQL database.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, React Router v7, Vite 8 |
| Backend | Java 21, Spring Boot 4, Spring Data JPA, Lombok |
| Database | PostgreSQL (via JDBC) |

---

## Project Structure

```
pomodoro/
├── frontend/          # React + Vite SPA
│   └── src/
│       ├── components/    # TimerCard, TaskCard, ProgressSummaryCard
│       ├── pages/         # home.jsx
│       └── App.jsx
└── backend/           # Spring Boot REST API
    └── src/main/java/com/grant/pomodoro/
        ├── controller/    # ProjectController, TimerController, SessionController
        ├── model/         # Project, Timer, Session
        └── repository/    # JPA repositories
```

---

## Features

- **Project management** — Create, update, and delete projects with estimated Pomodoro counts
- **Pomodoro tracking** — Complete Pomodoros against a project; actual vs. estimated counts are tracked automatically; time spent increments by 25 minutes per completed Pomodoro
- **Timers** — Per-project configurable work/break timers with remaining-seconds persistence
- **Session logging** — Record and retrieve work sessions linked to projects
- **Progress summary** — Visual summary card showing productivity metrics

---

## REST API

Base URL: `http://localhost:8080`

### Projects — `/api/projects`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List all projects |
| POST | `/api/projects` | Create a project |
| GET | `/api/projects/{id}` | Get project by ID |
| PUT | `/api/projects/{id}` | Update project |
| PUT | `/api/projects/{id}/completePomodoro` | Mark one Pomodoro complete (+25 min) |
| DELETE | `/api/projects/{id}` | Delete project |
| DELETE | `/api/projects` | Delete all projects |

### Timers — `/api/timers`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/timers?projectId=` | List timers (optionally filter by project) |
| POST | `/api/timers` | Create a timer for a project |
| GET | `/api/timers/{id}` | Get timer by ID |
| PUT | `/api/timers/{id}` | Update timer state |
| DELETE | `/api/timers/{id}` | Delete timer |

### Sessions — `/api/sessions`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sessions?projectId=` | List sessions (optionally filter by project) |
| POST | `/api/sessions` | Log a new session |
| GET | `/api/sessions/{id}` | Get session by ID |
| PUT | `/api/sessions/{id}` | Update session |
| DELETE | `/api/sessions/{id}` | Delete session |

