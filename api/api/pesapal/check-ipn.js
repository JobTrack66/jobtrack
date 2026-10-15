
const {
  pesapalToken,
  env,
  supabaseUserFromRequest
} = require('../../api-utils');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await supabaseUserFromRequest(req);

    if (!user) {
      return res.status(401).json({ error: 'Please sign in first' });
    }

    const { token, base } = await pesapalToken();

    const response = await fetch(
      `${base}/api/URLSetup/GetIpnList`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await response.json().catch(() => []);

    if (!response.ok || !Array.isArray(data)) {
      return res.status(502).json({
        error: 'Could not retrieve registered IPNs',
        pesapalStatus: response.status
      });
    }

    const configuredId = String(env('PESAPAL_IPN_ID') || '').trim();

    const match = data.find(
      item => String(item.ipn_id || '').trim() === configuredId
    );

    return res.status(200).json({
      environment: base.includes('cybqa') ? 'sandbox' : 'live',
      registeredCount: data.length,
      configuredIdFound: Boolean(match),
      matchingUrl: match ? match.url : null
    });
  } catch (error) {
    return res.status(500).json({
      error: 'IPN diagnostic failed'
    });
  }
};
