export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body || {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Resend API key is missing on the server.' });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Resend/1.0'
      },
      body: JSON.stringify({
        from: 'CHOLD Initiative <onboarding@resend.dev>',
        to: [email.trim()],
        subject: 'Welcome to CHOLD Initiative Newsletter',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #222; line-height: 1.6; padding: 20px;">
            <div style="background-color: #13501B; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="color: #FFFFFF; font-size: 22px; margin: 0;">CHOLD Initiative</h1>
              <p style="color: #D4A017; font-size: 13px; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">Center for Holistic Livestock Development</p>
            </div>
            <div style="background-color: #FFFFFF; padding: 30px; border: 1px solid #E5E5E5; border-radius: 0 0 8px 8px;">
              <h2 style="color: #13501B; font-size: 18px; margin-top: 0;">Welcome to our newsletter list!</h2>
              <p>Thank you for subscribing to the Center for Holistic Livestock Development Initiative newsletter.</p>
              <p>You will now receive our field briefs, policy notes, and operational updates on livestock data systems, disease surveillance, and traditional leadership engagement across Nigeria and Africa.</p>
              <hr style="border: none; border-top: 1px solid #E5E5E5; margin: 25px 0;" />
              <p style="font-size: 13px; color: #666; margin-bottom: 0;">
                <strong>CHOLD Initiative Secretariat</strong><br />
                11 Ukpo Close, off Twon Brass Street, off Mohammed Buhari Way, Garki II, Abuja, Nigeria<br />
                <a href="mailto:info@choldinitiative.org" style="color: #13501B;">info@choldinitiative.org</a> &middot; +234 (081) 7111 1551
              </p>
            </div>
          </div>
        `
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend API Error:', data);
      return res.status(response.status).json({ error: data.message || 'Failed to send welcome email.' });
    }

    return res.status(200).json({ success: true, id: data.id });
  } catch (err) {
    console.error('Newsletter subscribe error:', err);
    return res.status(500).json({ error: 'Server error processing subscription.' });
  }
}
