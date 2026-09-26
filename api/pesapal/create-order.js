const { env, supabaseUserFromRequest, supabaseRest, pesapalToken, planDetails } = require('../../api-utils');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const user = await supabaseUserFromRequest(req);
    if (!user?.id || !user.email) return res.status(401).json({ error: 'Please sign in first.' });

    const plan = req.body?.plan === 'yearly' ? 'yearly' : 'monthly';
    const p = planDetails(plan);
    const origin = env('PUBLIC_APP_URL').replace(/\/$/, '');
    const reference = `JT-${user.id.replace(/-/g, '').slice(0, 16)}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`.slice(0, 50);
    const intentRes = await supabaseRest('jobtrack_payment_intents', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ merchant_reference: reference, user_id: user.id, plan: p.cycle, amount: p.amount, currency: 'UGX', status: 'created' })
    });
    if (!intentRes.ok) return res.status(500).json({ error: `Could not create payment record: ${await intentRes.text()}` });

    const { token, base } = await pesapalToken();

    const r = await fetch(`${base}/api/Transactions/SubmitOrderRequest`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        id: reference,
        currency: 'UGX',
        amount: p.amount,
        description: p.name,
        callback_url: `${origin}/api/pesapal/callback`,
        cancellation_url: `${origin}/?payment=cancelled`,
        notification_id: env('PESAPAL_IPN_ID'),
        billing_address: {
          email_address: user.email,
          country_code: 'UG',
          first_name: user.user_metadata?.first_name || 'JobTrack',
          last_name: user.user_metadata?.last_name || 'Customer'
        }
      })
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || !data.redirect_url) return res.status(502).json({ error: data?.error?.message || data?.message || 'Pesapal could not create the payment.' });
    return res.status(200).json({ redirect_url: data.redirect_url, reference, plan });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Payment setup error' });
  }
};
