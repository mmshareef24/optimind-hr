# Base44 App

## Development

Ensure you have Node.js and npm installed. Run the following commands:

```bash
npm install
npm run dev
```

## Supabase Integration (Optional)

You can connect to Supabase for data access during development.

- Install client: `npm install @supabase/supabase-js`
- Configure environment variables in a local `.env` file (loaded by Vite):

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

- Test connectivity by visiting the route `/supabase-test` while the dev server is running.
- The test page queries a demo table named `test_table`. Update it to your target table name.

If environment variables are missing, the test page will report "Supabase env vars missing" and skip network calls.

## Deploy to Vercel

This app is configured for static deployment on Vercel.

- Add environment variables in Vercel:
  - `BASE44_ENABLED=false` (fully disables Base44 plugin during builds)
  - `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` if using Supabase
- The included `vercel.json` sets:
  - `buildCommand`: `npm run build`
  - `outputDirectory`: `dist`
  - SPA route fallback to `index.html` for all routes
- Deploy options:
  - Using the Vercel CLI: `npm i -g vercel` then `vercel` (first deploy) and `vercel --prod` (production)
  - Or import the repository in the Vercel dashboard and configure env vars there