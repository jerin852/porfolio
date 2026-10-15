// Vercel serverless function: sends each portfolio enquiry to your Gmail using the Gmail API.
// Required environment variables (set in Vercel > Project > Settings > Environment Variables):
//   GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN
// Optional: ENQUIRY_TO (defaults to rsjerin33@gmail.com)
const { google } = require('googleapis');

const clean = (s) => String(s || '').replace(/[\r\n]+/g, ' ').trim();
const b64url = (s) =>
  Buffer.from(s, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  const body = req.body || {};
  if (body.website) return res.status(200).json({ ok: true }); // honeypot: bots fill this field

  const name = clean(body.name).slice(0, 100);
  const email = clean(body.email).slice(0, 150);
  const message = String(body.message || '').trim().slice(0, 4000);
  if (!name || !message || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: 'Invalid input' });
  }

  try {
    const auth = new google.auth.OAuth2(process.env.GMAIL_CLIENT_ID, process.env.GMAIL_CLIENT_SECRET);
    auth.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
    const gmail = google.gmail({ version: 'v1', auth });

    const to = process.env.ENQUIRY_TO || 'rsjerin33@gmail.com';
    const subject = `Portfolio enquiry from ${name}`;
    const mime = [
      `To: ${to}`,
      `Reply-To: ${email}`,
      `Subject: =?UTF-8?B?${Buffer.from(subject, 'utf8').toString('base64')}?=`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset="UTF-8"',
      '',
      `Name: ${name}`,
      `Email: ${email}`,
      '',
      message,
    ].join('\r\n');

    await gmail.users.messages.send({ userId: 'me', requestBody: { raw: b64url(mime) } });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Gmail send failed', err && err.message);
    return res.status(500).json({ ok: false });
  }
};
