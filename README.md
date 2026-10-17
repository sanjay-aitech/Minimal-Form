Minimalist Online Registration Form
A simple, responsive registration website built with HTML, CSS, JavaScript, and Supabase.
Links
- Live website: https://sanjay-aitech.github.io/Minimal-Form/
- GitHub repository: https://github.com/sanjay-aitech/Minimal-Form
Features
- Collects username, email address, and date of birth.
- Validates form fields and prevents future dates of birth.
- Saves registrations to Supabase.
- Displays success or error messages.
- Works on desktop and mobile.
- Uses Row Level Security (RLS) to restrict public database access.
Technology
- HTML5
- CSS3
- Vanilla JavaScript
- Supabase PostgreSQL
- GitHub Pages
Project Files
Minimal_Form/
├── index.html
├── style.css
├── script.js
├── supabase-schema.sql
└── README.md
Setup
1. Create a project at https://supabase.com/.
2. Open the Supabase SQL Editor and run the SQL in supabase-schema.sql.
3. Add your Supabase project URL and publishable key to script.js.
4. Open index.html in a browser, or run a local server:
   python -m http.server 8000
5. Visit http://localhost:8000.
Deployment
The website is hosted with GitHub Pages. To publish updates, push changes to the main branch:
git add .
git commit -m "Update registration website"
git push origin main
Database Security
Keep Row Level Security enabled. Public visitors should only be allowed to submit registrations; they should not be allowed to read, update, or delete stored records.
Never place a Supabase secret or service-role key in frontend code.