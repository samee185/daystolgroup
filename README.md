# Daystol Group website

MERN stack: React (Vite) + Express + MongoDB Atlas, with an AdminJS staff dashboard. One Node app: in production, Express serves the API, the admin and the built React site.

## Run locally

1. Node 20.6 or newer.
2. Copy `server/.env.example` to `server/.env` and fill it in (at least `MONGODB_URI` and `SESSION_SECRET`).
3. `npm install` in this top-level folder (installs client and server).
4. Create the first admin (PowerShell-safe):
   `cd server` then `node src/scripts/seed.js --email you@example.com --name "Your Name" --password "at-least-10-characters"`
5. `npm run dev` from the top-level folder
   - Website: http://localhost:5173
   - Admin: http://localhost:5173/admin
   - API: http://localhost:5000/api/health

To try the production build locally: `npm run build`, then `npm start`, and open http://localhost:5000.

## Deploying

See [DEPLOY.md](DEPLOY.md) for the step-by-step Hostinger guide.

## Roles

| Role | Can |
|---|---|
| admin | Everything, including staff accounts and site settings |
| editor | Services, projects, PMC packages, team |
| sales | Products, categories and orders |
| support | View everything; update fault reports and enquiries |

## Business terms

Return windows, refund times and data-retention periods used on the Terms, Returns and Privacy pages are in
`client/src/lib/policies.js`. Confirm them with Daystol before launch.
