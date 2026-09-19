const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clean = (value, maxLength) => String(value || '').trim().slice(0, maxLength);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ success: false, message: 'Method not allowed.' }) };
  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Invalid request.' }) }; }
  if (body.companyWebsite) return { statusCode: 200, body: JSON.stringify({ success: true }) };

  const name = clean(body.name, 100);
  const business = clean(body.business, 120);
  const email = clean(body.email, 254);
  const service = clean(body.service, 100);
  const message = clean(body.message, 3000);
  if (!name || !business || !emailPattern.test(email) || !service || message.length < 20) {
    return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Please complete all required fields with valid information.' }) };
  }
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.CONTACT_FROM_EMAIL;
  const fromName = process.env.CONTACT_FROM_NAME || 'CodeDwara';
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !fromEmail || !to) {
    console.error('Brevo environment variables are not fully configured.');
    return { statusCode: 500, body: JSON.stringify({ success: false, message: 'The enquiry form is temporarily unavailable. Please email codedwara@gmail.com.' }) };
  }
  try {
    const details = [
      `Name: ${name}`,
      `Business / Brand: ${business}`,
      `Email: ${email}`,
      `WhatsApp / Phone: ${clean(body.phone, 30) || 'Not specified'}`,
      `Plan: ${clean(body.plan, 60) || 'Not specified'}`,
      `Service: ${service}`,
      `How they found CodeDwara: ${clean(body.source, 60) || 'Not specified'}`,
      '',
      'Project details:',
      message
    ].join('\n');
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({
        sender: { email: fromEmail, name: fromName },
        to: [{ email: to }],
        replyTo: { email, name },
        subject: `New CodeDwara project enquiry from ${name}`,
        textContent: details
      })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || `Brevo returned ${response.status}.`);
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true }) };
  } catch (error) {
    console.error('Contact submission failed:', error.message);
    return { statusCode: 502, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: 'Unable to send your enquiry. Please try again.' }) };
  }
};
