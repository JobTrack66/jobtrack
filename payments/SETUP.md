# JobTrack + Pesapal setup

## 1. Supabase
Run both `schema.sql` and `supabase/subscriptions.sql` in the Supabase SQL Editor.

## 2. Vercel environment variables
Add these as server-side environment variables (never put them in `index.html`):

- `SUPABASE_URL` — your Supabase project URL
- `SUPABASE_ANON_KEY` — your Supabase public/anon key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service-role key
- `PESAPAL_CONSUMER_KEY` — from Pesapal
- `PESAPAL_CONSUMER_SECRET` — from Pesapal
- `PESAPAL_ENV` — `sandbox` while testing, then `live`
- `PUBLIC_APP_URL` — your deployed JobTrack URL, e.g. `https://jobtrack.example.com`
- `PESAPAL_IPN_ID` — the IPN ID registered for `/api/pesapal/ipn`

## 3. IPN
After the site is deployed, register this public IPN URL with Pesapal:

`https://YOUR-DOMAIN/api/pesapal/ipn`

Use POST or GET consistently with the registered method. Save the returned `ipn_id` as `PESAPAL_IPN_ID` in Vercel.

## 4. Callback
The payment callback is:

`https://YOUR-DOMAIN/api/pesapal/callback`

## 5. Security
Never commit a Pesapal Consumer Secret or Supabase service-role key to GitHub. They belong only in Vercel Environment Variables.
