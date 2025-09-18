# Database Schema

This document describes the PostgreSQL schema for the Task Manager service. It includes tables for users, projects, tasks, and task_assignments.

## Tables

- users
  - id: UUID primary key
  - email: text unique not null
  - password_hash: text not null
  - name: text
  - created_at: timestamptz default now()
  - updated_at: timestamptz default now()

- projects
  - id: UUID primary key
  - owner_id: UUID references users(id) on delete cascade
  - name: text not null
  - description: text
  - created_at: timestamptz default now()
  - updated_at: timestamptz default now()

- tasks
  - id: UUID primary key
  - project_id: UUID references projects(id) on delete cascade
  - title: text not null
  - description: text
  - status: text NOT NULL DEFAULT 'TODO' -- enum: TODO, IN_PROGRESS, DONE
  - priority: text NOT NULL DEFAULT 'MEDIUM' -- enum: LOW, MEDIUM, HIGH
  - due_date: date
  - created_at: timestamptz default now()
  - updated_at: timestamptz default now()

- task_assignments
  - id: UUID primary key
  - task_id: UUID references tasks(id) on delete cascade
  - user_id: UUID references users(id) on delete cascade
  - assigned_at: timestamptz default now()

## Indexes & Constraints

- Unique index on users(email)
- Index tasks(project_id)
- Index task_assignments(user_id)

## Notes

- Timestamps use timestamptz to keep timezone-aware dates.
- Enums are represented as text for simplicity; migrations can create proper ENUM types if desired.
