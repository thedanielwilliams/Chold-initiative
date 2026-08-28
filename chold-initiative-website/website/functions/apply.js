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

  const { name, email, phone, location, area, type, cv, message } = body;
  const cleanEmail = email ? email.trim() : '';
  const cleanName = name ? name.trim() : 'Applicant';
  const roleName = area || 'General Application';

  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { statusCode: 400, body: JSON.stringify({ error: "Please enter a valid email address." }) };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "Resend API key missing on server." }) };
  }

  const senderAddress = 'CHOLD Initiative <info@choldinitiative.org>';

  try {
    // 1. Applicant Confirmation Email
    const applicantPromise = fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Resend/1.0'
      },
      body: JSON.stringify({
        from: senderAddress,
        to: [cleanEmail],
        subject: `Application Received: ${roleName} — CHOLD Initiative`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #222; line-height: 1.6; padding: 20px;">
            <div style="background-color: #13501B; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="color: #FFFFFF; font-size: 22px; margin: 0;">CHOLD Initiative</h1>
              <p style="color: #D4A017; font-size: 13px; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">Center for Holistic Livestock Development</p>
            </div>
            <div style="background-color: #FFFFFF; padding: 30px; border: 1px solid #E5E5E5; border-radius: 0 0 8px 8px;">
              <h2 style="color: #13501B; font-size: 18px; margin-top: 0;">Thank you for applying, ${escapeHtml(cleanName)}!</h2>
              <p>We have received your expression of interest for the <strong>${escapeHtml(roleName)}</strong> role at CHOLD Initiative.</p>
              <p>Our team reviews all applications carefully. If your background and experience match our current requirements, we will contact you directly to schedule an interview or discuss next steps.</p>
              <p style="background-color: #F7F4EC; padding: 15px; border-left: 4px solid #13501B; font-size: 14px; color: #444;">
                <em>Please note that due to the volume of applications, only shortlisted candidates will be contacted.</em>
              </p>
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

    // 2. Admin Alert Email
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
        subject: `New Job Application: ${cleanName} (${roleName})`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; color: #222; line-height: 1.6; padding: 20px;">
            <div style="background-color: #13501B; padding: 15px 20px; border-radius: 6px 6px 0 0; color: #FFFFFF;">
              <h2 style="margin: 0; font-size: 18px;">New Job Application Alert</h2>
            </div>
            <div style="background-color: #FFFFFF; padding: 25px; border: 1px solid #E5E5E5; border-radius: 0 0 6px 6px;">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr><td style="padding: 6px 0; font-weight: bold; width: 140px;">Applicant Name:</td><td>${escapeHtml(cleanName)}</td></tr>
                <tr><td style="padding: 6px 0; font-weight: bold;">Email Address:</td><td><a href="mailto:${escapeHtml(cleanEmail)}" style="color:#13501B;">${escapeHtml(cleanEmail)}</a></td></tr>
                <tr><td style="padding: 6px 0; font-weight: bold;">Phone Number:</td><td>${escapeHtml(phone || 'N/A')}</td></tr>
                <tr><td style="padding: 6px 0; font-weight: bold;">Location:</td><td>${escapeHtml(location || 'N/A')}</td></tr>
                <tr><td style="padding: 6px 0; font-weight: bold;">Role / Area:</td><td><strong>${escapeHtml(roleName)}</strong></td></tr>
                <tr><td style="padding: 6px 0; font-weight: bold;">Engagement:</td><td>${escapeHtml(type || 'N/A')}</td></tr>
                <tr><td style="padding: 6px 0; font-weight: bold;">CV / Link:</td><td>${cv ? `<a href="${escapeHtml(cv)}" target="_blank" style="color:#13501B;">${escapeHtml(cv)}</a>` : 'None provided'}</td></tr>
              </table>
              <hr style="border: none; border-top: 1px solid #E5E5E5; margin: 15px 0;" />
              <p style="font-weight: bold; margin-bottom: 5px;">Experience &amp; Background Statement:</p>
              <div style="background-color: #F7F4EC; padding: 12px 15px; border-radius: 6px; white-space: pre-wrap; font-size: 13.5px; color: #333;">${escapeHtml(message || '')}</div>
            </div>
          </div>
        `
      })
    });

    const [appRes] = await Promise.all([applicantPromise, adminNotifyPromise]);
    const appData = await appRes.json();

    if (!appRes.ok) {
      return { statusCode: appRes.status, body: JSON.stringify({ error: appData.message || "Failed to send application email." }) };
    }

    return { statusCode: 200, body: JSON.stringify({ success: true, id: appData.id }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: "Server error processing application." }) };
  }
};

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, function(m) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
  });
}
