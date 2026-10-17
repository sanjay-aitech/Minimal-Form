# Minimalist Registration & Streamable-HTTP MCP Server

A full-stack registration system featuring a responsive web application connected to Supabase PostgreSQL and a Python-based MCP server that enables AI assistants to validate and manage registrations securely.

## Project Links
- **Live Website:** https://sanjay-aitech.github.io/Minimal-Form/
- **GitHub Repository:** https://github.com/sanjay-aitech/Minimal-Form
- **Database:** Supabase PostgreSQL
- **MCP Endpoint:** `http://127.0.0.1:8000/mcp`

## Tech Stack
- **Frontend:** HTML5, CSS3, JavaScript
- **Database:** Supabase PostgreSQL
- **Backend:** Python, FastMCP
- **Protocol:** MCP Streamable HTTP
- **Hosting:** GitHub Pages

## Key Features
- Responsive and accessible registration form.
- Client-side and database-level validation.
- Date of birth restrictions and email validation.
- Secure database access using Row Level Security (RLS).
- MCP tools for counting registrations, validating submissions, and creating confirmed entries.
- Explicit user confirmation before database writes.

## Project Structure
```text
Minimal_Form/
├── index.html
├── style.css
├── script.js
├── supabase-schema.sql
├── README.md
└── registration-mcp-streamable-http/
    ├── server.py
    ├── schema.sql
    ├── requirements.txt
    ├── .env.example
    └── README.md
```

## Run the MCP Server

Open PowerShell in the MCP server directory and execute:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Configure your Supabase credentials in `.env`:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Start the server:

```powershell
python server.py
```

The MCP server will be available at `http://127.0.0.1:8000/mcp`, provided the server is configured to use that endpoint.

## Security
- The frontend uses the Supabase publishable key with appropriate RLS policies.
- The MCP server uses the service-role key exclusively on the backend.
- Never expose or commit service-role keys.
- Registration creation requires explicit confirmation.

## Update GitHub

```powershell
git add .
git commit -m "Update registration project"
git push origin main
```

GitHub Pages publishes frontend changes automatically after deployment.

