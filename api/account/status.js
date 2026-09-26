const { supabaseUserFromRequest, supabaseRest } = require('../../api-utils');
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const user = await supabaseUserFromRequest(req);
    if (!user?.id) return res.status(401).json({ error: 'Not signed in' });
    const r = await supabaseRest(`jobtrack_subscriptions?user_id=eq.${user.id}&select=plan,status,billing_cycle,expires_at&limit=1`);
    const rows = await r.json().catch(() => []);
    const sub = rows[0] || null;
    const active = !!sub && sub.plan === 'pro' && sub.status === 'active' && (!sub.expires_at || new Date(sub.expires_at) > new Date());
    return res.status(200).json({ pro: active, subscription: sub });
  } catch (e) { return res.status(500).json({ error: e.message || 'Could not read subscription' }); }
};
