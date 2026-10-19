const { google } = require('googleapis');

const ENQUIRY_TO = (
  process.env.ENQUIRY_TO || 'rsjerin33@gmail.com'
).trim();

function clean(value) {
  return String(value || '')
    .replace(/[\r\n]+/g, ' ')
    .trim();
}

function base64Url(value) {
  return Buffer.from(value, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

module.exports = async function handler(req, res) {
  // POST requests only
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');

    return res.status(405).json({
      ok: false,
      error: 'Method not allowed',
    });
  }

  try {
    const body = req.body || {};

    // Spam honeypot
    if (body.website) {
      return res.status(200).json({
        ok: true,
        message: 'Enquiry received.',
      });
    }

    // Validate form input
    const name = clean(body.name).slice(0, 100);
    const email = clean(body.email).slice(0, 150);
    const message = String(body.message || '')
      .trim()
      .slice(0, 4000);

    const validEmail =
      /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);

    if (!name || !validEmail || !message) {
      return res.status(400).json({
        ok: false,
        error: 'Please enter a valid name, email, and message.',
      });
    }

    // Read server-side environment variables
    const clientId = process.env.GMAIL_CLIENT_ID?.trim();
    const clientSecret = process.env.GMAIL_CLIENT_SECRET?.trim();
    const refreshToken = process.env.GMAIL_REFRESH_TOKEN?.trim();

    if (!clientId || !clientSecret || !refreshToken) {
      console.error(
        'Gmail configuration error: required environment variable missing.'
      );

      return res.status(500).json({
        ok: false,
        error: 'Email service is not configured.',
      });
    }

    // Authenticate using Google OAuth2
    const auth = new google.auth.OAuth2(
      clientId,
      clientSecret
    );

    auth.setCredentials({
      refresh_token: refreshToken,
    });

    const gmail = google.gmail({
      version: 'v1',
      auth,
    });

    // Create email
    const subject = `Portfolio enquiry from ${name}`;

    const mimeMessage = [
      `To: ${ENQUIRY_TO}`,
      `Reply-To: ${email}`,
      `Subject: =?UTF-8?B?${Buffer.from(
        subject,
        'utf8'
      ).toString('base64')}?=`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: 8bit',
      '',
      `Name: ${name}`,
      `Email: ${email}`,
      '',
      'Message:',
      message,
    ].join('\r\n');

    // Send through Gmail API
    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: base64Url(mimeMessage),
      },
    });

    console.log('Gmail enquiry sent successfully.');

    return res.status(200).json({
      ok: true,
      message: 'Enquiry sent successfully.',
      id: result.data.id,
    });
  } catch (error) {
    // Diagnostic information for Vercel Runtime Logs.
    // Never log OAuth secrets or tokens.
    console.error('Gmail send failed:', {
      code: error?.code,
      status: error?.response?.status,
      details: error?.response?.data?.error || error?.message,
      description:
        error?.response?.data?.error_description,
    });

    return res.status(500).json({
      ok: false,
      error: 'Could not send enquiry. Please try again later.',
    });
  }
};