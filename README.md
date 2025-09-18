# task-manager

## Day 2 - Database Design & Setup

This project includes a local PostgreSQL setup, migration runner, and seed data to get started.

Prerequisites: Docker and Node.js (18+)

Steps to run locally:

1. Copy the example env file:

	cp .env.example .env

2. Start the database:

	npm run db:docker

3. Apply migrations:

	npm run db:migrate

4. Seed development data:

	npm run db:seed

5. Start the app in dev mode:

	npm run dev

Files added:

- `docs/db-schema.md` - schema documentation
- `migrations/001_create_tables.sql` - initial migration
- `migrations/seed_dev.sql` - sample seed data
- `docker-compose.yml` - local Postgres service
- `scripts/run-migrations.js` - migration runner
- `scripts/run-seed.js` - seed runner

