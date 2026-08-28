const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  let body = {};
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON body" }) };
  }

  const { email } = body;
  const cleanEmail = email ? email.trim() : '';
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { statusCode: 400, body: JSON.stringify({ error: "Please enter a valid email address." }) };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "Resend API key missing on server." }) };
  }

  const senderAddress = 'CHOLD Initiative <info@choldinitiative.org>';

  try {
    // 1. Welcome email to subscriber
    const welcomePromise = fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Resend/1.0'
      },
      body: JSON.stringify({
        from: senderAddress,
        to: [cleanEmail],
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

    // 2. Admin notification email
    const adminNotifyPromise = fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Resend/1.0'
      },
      body: JSON.stringify({
        from: senderAddress,
        to: ['info@choldinitiative.org'],
        subject: `New Newsletter Subscriber: ${cleanEmail}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #222; line-height: 1.6; padding: 20px;">
            <div style="background-color: #13501B; padding: 15px 20px; border-radius: 6px 6px 0 0; color: #FFFFFF;">
              <h2 style="margin: 0; font-size: 18px;">New Newsletter Subscriber Alert</h2>
            </div>
            <div style="background-color: #F7F4EC; padding: 20px; border: 1px solid #E5E5E5; border-radius: 0 0 6px 6px;">
              <p style="margin-top: 0;">A new user has just subscribed to the newsletter on the website.</p>
              <p><strong>Subscriber Email:</strong> <a href="mailto:${cleanEmail}" style="color: #13501B; font-weight: bold;">${cleanEmail}</a></p>
              <p style="font-size: 12px; color: #777; margin-bottom: 0;">CHOLD Initiative Website Auto-notification</p>
            </div>
          </div>
        `
      })
    });

    const [welcomeRes] = await Promise.all([welcomePromise, adminNotifyPromise]);
    const welcomeData = await welcomeRes.json();

    if (!welcomeRes.ok) {
      return { statusCode: welcomeRes.status, body: JSON.stringify({ error: welcomeData.message || "Failed to send welcome email." }) };
    }

    return { statusCode: 200, body: JSON.stringify({ success: true, id: welcomeData.id }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: "Server error processing subscription." }) };
  }
};
