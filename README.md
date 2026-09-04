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

## Local Setup

- Put your backend database values in [backend/.env.example](backend/.env.example) and copy them to [backend/.env](backend/.env) for local development.
- The backend loads [backend/.env](backend/.env) at startup and falls back to defaults from [backend/src/main/resources/application.properties](backend/src/main/resources/application.properties).


## Features

- **Project management** — Create, update, and delete projects with estimated Pomodoro counts
- **Pomodoro tracking** — Complete Pomodoros against a project; actual vs. estimated counts are tracked automatically; time spent increments by 25 minutes per completed Pomodoro
- **Timers** — Per-project configurable work/break timers with remaining-seconds persistence
- **Session logging** — Record and retrieve work sessions linked to projects
- **Progress summary** — Visual summary card showing productivity metrics

---

