# JobTrack Payment Plan

- Free: UGX 0
- Pro Monthly: UGX 15,000 / 30 days
- Pro Annual: UGX 100,000 / 365 days

Payment provider: Pesapal.

The secure flow is:

Customer → JobTrack → Vercel serverless API → Pesapal → callback/IPN → server verifies status → Supabase subscription → Pro access.

The payment secret and Supabase service-role key are never included in browser code.
