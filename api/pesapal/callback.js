const { supabaseRest, pesapalStatus, activatePro } = require('../../api-utils');

async function handle(req, res) {
  const q = req.query || {};
  const trackingId = q.OrderTrackingId || q.orderTrackingId;
  const reference = q.OrderMerchantReference || q.orderMerchantReference;
  if (!trackingId || !reference) return res.redirect('/?payment=error');

  try {
    const status = await pesapalStatus(trackingId);
    if (Number(status.status_code) === 1) {
      const lookup = await supabaseRest(`jobtrack_payment_intents?merchant_reference=eq.${encodeURIComponent(reference)}&select=user_id,plan,amount&limit=1`);
      const rows = await lookup.json().catch(() => []);
      const intent = rows[0];
      if (intent) {
        await activatePro({ userId: intent.user_id, plan: intent.plan, merchantReference: reference, trackingId, amount: intent.amount });
        await supabaseRest(`jobtrack_payment_intents?merchant_reference=eq.${encodeURIComponent(reference)}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ status: 'completed', tracking_id: trackingId, updated_at: new Date().toISOString() }) });
      }
      return res.redirect('/?payment=success');
    }
    if (Number(status.status_code) === 2 || Number(status.status_code) === 3 || Number(status.status_code) === 0) return res.redirect('/?payment=failed');
    return res.redirect('/?payment=pending');
  } catch (e) {
    return res.redirect('/?payment=error');
  }
}

module.exports = handle;
