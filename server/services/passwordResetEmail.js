import { randomUUID } from 'node:crypto';
import nodemailer from 'nodemailer';

let transporter;

function getProvider() {
  const provider = process.env.EMAIL_PROVIDER
    || (process.env.NODE_ENV === 'production' ? 'brevo' : 'gmail');
  if (!['gmail', 'gmail-api', 'brevo'].includes(provider)) {
    throw new Error('EMAIL_PROVIDER must be "gmail", "gmail-api", or "brevo".');
  }
  return provider;
}

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const password = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, '');
  if (!user || !password) {
    throw new Error('Set GMAIL_USER and GMAIL_APP_PASSWORD in server/.env to enable password reset emails.');
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      connectionTimeout: 6000,
      greetingTimeout: 6000,
      socketTimeout: 12000,
      auth: { user, pass: password },
    });
  }

  return transporter;
}

function getEmailContent(code) {
  return {  
    subject: 'Your AralNa password reset code',
    text: `Your AralNa password reset code is ${code}. It expires in 10 minutes. If you did not request this, you can ignore this email.`,
    html: `<p>Your AralNa password reset code is:</p><p style="font-size:24px;font-weight:bold;letter-spacing:5px">${code}</p><p>This code expires in 10 minutes. If you did not request this, you can ignore this email.</p>`,
  };
}

async function sendWithBrevo(email, code) {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.BREVO_FROM_EMAIL;
  const fromName = process.env.BREVO_FROM_NAME || 'AralNa';
  if (!apiKey || !fromEmail) {
    throw new Error('Set BREVO_API_KEY and BREVO_FROM_EMAIL to send password reset email through Brevo.');
  }

  const content = getEmailContent(code);
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: fromName, email: fromEmail },
      to: [{ email }],
      subject: content.subject,
      textContent: content.text,
      htmlContent: content.html,
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    const responseText = await response.text();
    let detail = '';
    try {
      const result = JSON.parse(responseText);
      detail = result.message || result.code || '';
    } catch {
      detail = '';
    }
    throw new Error(`Brevo API returned HTTP ${response.status}${detail ? `: ${detail}` : ''}.`);
  }
}

function encodeBase64Lines(value) {
  return Buffer.from(value, 'utf8').toString('base64').match(/.{1,76}/g).join('\r\n');
}

async function getGmailApiAccessToken() {
  const clientId = process.env.GMAIL_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GMAIL_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_OAUTH_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      'Set GMAIL_OAUTH_CLIENT_ID, GMAIL_OAUTH_CLIENT_SECRET, and GMAIL_OAUTH_REFRESH_TOKEN to use Gmail API.'
    );
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
    signal: AbortSignal.timeout(10000),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok || typeof result.access_token !== 'string') {
    throw new Error(`Google OAuth token request failed (HTTP ${response.status}).`);
  }
  return result.access_token;
}

async function sendWithGmailApi(email, code) {
  const user = process.env.GMAIL_USER;
  if (!user) throw new Error('Set GMAIL_USER to the Google account authorized for Gmail API.');

  const content = getEmailContent(code);
  const boundary = `aralna_${randomUUID().replace(/-/g, '')}`;
  const message = [
    `From: "AralNa" <${user}>`,
    `To: ${email}`,
    `Subject: ${content.subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    encodeBase64Lines(content.text),
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    encodeBase64Lines(content.html),
    `--${boundary}--`,
    '',
  ].join('\r\n');
  const raw = Buffer.from(message, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  const accessToken = await getGmailApiAccessToken();
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`Gmail API send request failed (HTTP ${response.status}).`);
  }
}

export async function sendPasswordResetEmail(email, code) {
  const provider = getProvider();
  if (provider === 'brevo') {
    await sendWithBrevo(email, code);
    return 'Brevo';
  }
  if (provider === 'gmail-api') {
    await sendWithGmailApi(email, code);
    return 'Gmail API';
  }

  const user = process.env.GMAIL_USER;
  const content = getEmailContent(code);
  await getTransporter().sendMail({
    from: `"AralNa" <${user}>`,
    to: email,
    ...content,
  });
  return 'Gmail SMTP';
}
