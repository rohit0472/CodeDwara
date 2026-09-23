const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

exports.handler = async (event) => {
  // Allow only POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Method not allowed'
      })
    };
  }

  try {
    // Parse request body
    const data = JSON.parse(event.body || '{}');

    const {
      name,
      business,
      email,
      service,
      message,
      companyWebsite
    } = data;

    // Honeypot protection
    if (companyWebsite) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          message: 'Thanks! Your enquiry has been received.'
        })
      };
    }

    // Validate required fields
    if (!name || !business || !email || !service || !message) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Please fill in all required fields.'
        })
      };
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Please enter a valid email address.'
        })
      };
    }

    // Netlify environment variables
    const apiKey = process.env.BREVO_API_KEY;
    const fromEmail = process.env.CONTACT_FROM_EMAIL;
    const fromName = process.env.CONTACT_FROM_NAME || 'CodeDwara';
    const toEmail = process.env.CONTACT_TO_EMAIL;

    // Check configuration
    if (!apiKey || !fromEmail || !toEmail) {
      console.error('Missing Brevo environment variables.');

      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Email service is not configured correctly.'
        })
      };
    }

    // Email content
    const details = `
New CodeDwara Project Enquiry

Name: ${name}
Business: ${business}
Email: ${email}
Service: ${service}

Message:
${message}
    `.trim();

    // Send email through Brevo
    const brevoResponse = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({
        sender: {
          email: fromEmail,
          name: fromName
        },
        to: [
          {
            email: toEmail
          }
        ],
        replyTo: {
          email: email,
          name: name
        },
        subject: `New CodeDwara project enquiry from ${name}`,
        textContent: details
      })
    });

    if (!brevoResponse.ok) {
      const errorText = await brevoResponse.text();

      console.error('Brevo API error:', errorText);

      return {
        statusCode: 502,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Unable to send your enquiry right now. Please try again later.'
        })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: 'Thanks! Your enquiry has been sent successfully.'
      })
    };

  } catch (error) {
    console.error('Contact function error:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Something went wrong. Please try again later.'
      })
    };
  }
};
