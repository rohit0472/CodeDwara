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
  if (!process.env.WEB3FORMS_ACCESS_KEY) {
    console.error('WEB3FORMS_ACCESS_KEY is not configured.');
    return { statusCode: 500, body: JSON.stringify({ success: false, message: 'The enquiry form is temporarily unavailable. Please email codedwara@gmail.com.' }) };
  }
  try {
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: process.env.WEB3FORMS_ACCESS_KEY,
        subject: `New CodeDwara project enquiry from ${name}`,
        from_name: 'CodeDwara website',
        name, business, email, phone: clean(body.phone, 30), service,
        plan: clean(body.plan, 60) || 'Not specified',
        message, source: clean(body.source, 60) || 'Not specified'
      })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.success) throw new Error(result.message || 'Web3Forms rejected the submission.');
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true }) };
  } catch (error) {
    console.error('Contact submission failed:', error.message);
    return { statusCode: 502, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: 'Unable to send your enquiry. Please try again.' }) };
  }
};
