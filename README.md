# JobTrack

JobTrack is a browser-based job application tracker with optional cloud sync and a paid Pro tier.

## Plans
- Free — up to 10 applications
- Pro Monthly — UGX 15,000 for 30 days
- Pro Annual — UGX 100,000 for 365 days

## Main features
- Dashboard, applications, interviews, follow-ups and company tracking
- Search, filtering, sorting and job details
- Basic and advanced analytics
- Resume/career kit
- Pro Smart Tools: job-match/keyword alignment, cover-letter drafts, interview preparation, follow-up drafts and multiple CV versions
- Supabase authentication and cloud sync
- Pesapal payment checkout with server-side verification

## Important security rule
Never put Pesapal Consumer Secret or the Supabase service-role key in browser code or GitHub. They belong in Vercel Environment Variables only.

## Payment setup
See `payments/SETUP.md` and `supabase/subscriptions.sql`.

## Local mode
The app can open locally for UI testing, but the real payment API works only after the site is deployed to a public HTTPS URL because Pesapal needs public callback/IPN endpoints.
