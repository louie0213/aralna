import nodemailer from 'nodemailer';

let transporter;

function getProvider() {
  const provider = process.env.EMAIL_PROVIDER
    || (process.env.NODE_ENV === 'production' ? 'resend' : 'gmail');
  if (provider !== 'gmail' && provider !== 'resend') {
    throw new Error('EMAIL_PROVIDER must be either "gmail" or "resend".');
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

async function sendWithResend(email, code) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!apiKey || !from) {
    throw new Error('Set RESEND_API_KEY and RESEND_FROM to send password reset email through Resend.');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: [email], ...getEmailContent(code) }),
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    const responseText = await response.text();
    let detail = '';
    try {
      const result = JSON.parse(responseText);
      detail = result.message || result.name || '';
    } catch {
      detail = '';
    }
    throw new Error(`Resend API returned HTTP ${response.status}${detail ? `: ${detail}` : ''}.`);
  }
}

export async function sendPasswordResetEmail(email, code) {
  const provider = getProvider();
  if (provider === 'resend') {
    await sendWithResend(email, code);
    return 'Resend';
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
