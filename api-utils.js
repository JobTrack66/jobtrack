function env(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing server environment variable: ${name}`);
  return value;
}

async function supabaseUserFromRequest(req) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return null;
  const base = env('SUPABASE_URL').replace(/\/$/, '');
  const key = env('SUPABASE_ANON_KEY');
  const r = await fetch(`${base}/auth/v1/user`, {
    headers: { apikey: key, Authorization: `Bearer ${token}` }
  });
  if (!r.ok) return null;
  return await r.json();
}

async function supabaseRest(path, options = {}) {
  const base = env('SUPABASE_URL').replace(/\/$/, '');
  const key = env('SUPABASE_SERVICE_ROLE_KEY');
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  return fetch(`${base}/rest/v1/${path}`, { ...options, headers });
}

async function pesapalToken() {
  const base = (process.env.PESAPAL_ENV === 'live'
    ? 'https://pay.pesapal.com/v3'
    : 'https://cybqa.pesapal.com/pesapalv3').replace(/\/$/, '');
  const r = await fetch(`${base}/api/Auth/RequestToken`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      consumer_key: env('PESAPAL_CONSUMER_KEY'),
      consumer_secret: env('PESAPAL_CONSUMER_SECRET')
    })
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || !data.token) throw new Error(data.message || 'Pesapal authentication failed');
  return { token: data.token, base };
}

async function pesapalStatus(trackingId) {
  const { token, base } = await pesapalToken();
  const r = await fetch(`${base}/api/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(trackingId)}`, {
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.error?.message || data?.message || 'Could not verify Pesapal transaction');
  return data;
}

function planDetails(plan) {
  if (plan === 'yearly') return { amount: 100000, cycle: 'yearly', days: 365, name: 'JobTrack Pro Annual' };
  return { amount: 15000, cycle: 'monthly', days: 30, name: 'JobTrack Pro Monthly' };
}

async function activatePro({ userId, plan, merchantReference, trackingId, amount, currency = 'UGX' }) {
  const p = planDetails(plan);
  const now = new Date();
  const expires = new Date(now.getTime() + p.days * 24 * 60 * 60 * 1000);
  const body = {
    user_id: userId,
    plan: 'pro',
    billing_cycle: p.cycle,
    status: 'active',
    provider: 'pesapal',
    provider_merchant_reference: merchantReference,
    provider_tracking_id: trackingId,
    amount,
    currency,
    started_at: now.toISOString(),
    expires_at: expires.toISOString(),
    updated_at: now.toISOString()
  };
  const r = await supabaseRest('jobtrack_subscriptions?on_conflict=user_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error(`Could not save subscription: ${await r.text()}`);
  return expires.toISOString();
}

module.exports = { env, supabaseUserFromRequest, supabaseRest, pesapalToken, pesapalStatus, planDetails, activatePro };
