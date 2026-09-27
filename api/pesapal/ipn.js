const { pesapalStatus, supabaseRest, activatePro } = require('../../api-utils');

module.exports = async function handler(req, res) {
  try {
    const q = req.method === 'GET' ? req.query : (req.body || {});
    const trackingId = q.OrderTrackingId || q.orderTrackingId;
    const reference = q.OrderMerchantReference || q.orderMerchantReference;
    if (!trackingId || !reference) return res.status(400).json({ error: 'Missing transaction parameters' });

    const status = await pesapalStatus(trackingId);
    const lookup = await supabaseRest(
  `jobtrack_payment_intents?merchant_reference=eq.${encodeURIComponent(reference)}&select=user_id,plan,amount&limit=1`
);

const rows = await lookup.json().catch(() => []);
const intent = rows[0];

if (intent) {
  const code = Number(status.status_code);

  if (code === 1) {
    await activatePro({
      userId: intent.user_id,
      plan: intent.plan,
      merchantReference: reference,
      trackingId,
      amount: intent.amount
    });

    await supabaseRest(
      `jobtrack_payment_intents?merchant_reference=eq.${encodeURIComponent(reference)}`,
      {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({
          status: 'completed',
          tracking_id: trackingId,
          updated_at: new Date().toISOString()
        })
      }
    );
  } else if (code === 2 || code === 3 || code === 0) {
    await supabaseRest(
      `jobtrack_payment_intents?merchant_reference=eq.${encodeURIComponent(reference)}`,
      {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({
          status: 'failed',
          tracking_id: trackingId,
          updated_at: new Date().toISOString()
        })
      }
    );
  }
}
    return res.status(200).json({
  orderNotificationType: q.OrderNotificationType || q.orderNotificationType || 'IPNCHANGE',
  orderTrackingId: trackingId,
  orderMerchantReference: reference,
  status: 200
});
  } catch (e) {
    return res.status(500).json({ error: e.message || 'IPN processing failed' });
  }
};
