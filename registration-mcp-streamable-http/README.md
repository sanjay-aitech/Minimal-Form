# Registration MCP Server (Streamable HTTP)

A separate MCP server for the Supabase `public.registrations` table.

## Tools

- `count_registrations`: returns the total count.
- `validate_registration`: validates username, email, and date of birth without saving.
- `create_registration`: saves a registration after the user confirms the details.

## Setup (Windows PowerShell)

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env`.

## Run

```powershell
python server.py
```

The server uses Streamable HTTP on `http://127.0.0.1:8000/mcp`.

## Code overview

- `get_supabase_client()` creates the Supabase client when a tool first needs it.
- `validate_registration_data()` checks the fields and normalizes the email.
- `count_registrations()` returns an aggregate count only.
- `validate_registration()` exposes validation as an MCP tool.
- `create_registration()` validates the fields, inserts one row, and returns a confirmation.
- `mcp.run(transport="streamable-http")` starts the HTTP-based MCP transport.

## Security

The service-role key bypasses RLS. Keep this server local and trusted, and never put the key in frontend code or commit `.env`. Before exposing the server remotely, add authentication and authorization. Streamable HTTP alone does not secure the endpoint.

The code expects the `registrations` table to have `id`, `username`, `email`, `dob`, and `created_at` columns. Username validation allows 2–50 letters, numbers, dots, hyphens, and underscores; DOB must be between 1900-01-01 and today.
