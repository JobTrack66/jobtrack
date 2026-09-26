# JobTrack Pro payments — Pesapal

Current prices:
- Pro Monthly: UGX 15,000 for 30 days
- Pro Annual: UGX 100,000 for 365 days

The browser starts checkout by calling a Vercel serverless function. Pesapal Consumer Secret and the Supabase service-role key stay server-side as environment variables.

Payment is verified with Pesapal's transaction-status API before the user's Supabase subscription is activated. Pesapal also sends an IPN notification to the public server endpoint.

Automatic recurring card billing can be added later. The first production version uses explicit monthly/yearly purchases so we can test the full payment and entitlement flow safely.
