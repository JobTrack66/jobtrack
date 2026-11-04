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
  const base = (process.env.PESAPAL_ENVIRONMENT === 'live'
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
 if (!r.ok || !data.token) {
  throw new Error(JSON.stringify(data));
}
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
  const r = await supabaseRest('rpc/activate_jobtrack_payment', {
    method: 'POST',
    body: JSON.stringify({
      p_merchant_reference: merchantReference,
      p_tracking_id: trackingId
    })
  });

  const data = await r.json().catch(() => ({}));

  if (!r.ok) {
    throw new Error(data.message || data.error || 'Could not activate subscription');
  }

  if (data.status !== 'activated' && data.status !== 'duplicate') {
    throw new Error('Unexpected subscription activation response');
  }

  return data.expires_at || null;
}


module.exports = { env, supabaseUserFromRequest, supabaseRest, pesapalToken, pesapalStatus, planDetails, activatePro };
