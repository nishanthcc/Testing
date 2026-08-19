# Current Stage & Roadmap

## Current Stage: MVP / Prototype
The application is currently in a highly polished Minimum Viable Product (MVP) state. 
- The UI/UX is fully finalized and production-ready.
- The database schema is stable and robust (handling complex DAG relationships).
- **Authentication has been intentionally stripped out** to allow for immediate, frictionless demonstration and testing.

## Immediate Next Steps (Roadmap)

### Phase 1: Database Productionization
To move away from Render's ephemeral SQLite storage (which deletes data on server restart):
- [ ] Provision a **Supabase** (PostgreSQL) database.
- [ ] Swap the `SQLALCHEMY_DATABASE_URI` in `app.py` from the local `app.db` to the Supabase connection string.

### Phase 2: True AI Integration
- [ ] Replace the mocked document parsing logic in `/api/upload` with an actual LLM integration (e.g., Gemini 1.5 Pro). Pass the document text and ask the model to return a structured JSON array of tasks, estimated times, and energy weights.

### Phase 3: Authentication Re-Implementation
- [ ] Re-enable `Flask-Login`.
- [ ] Modify the database schema to re-link Tasks to Users (`nullable=False`).
- [ ] Re-activate the `@login_required` decorators in `routes.py`.

### Phase 4: Containerization (Optional)
- [ ] Write a `Dockerfile` for standardized deployments across environments outside of Render's native Python runtime.
