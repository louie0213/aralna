import nodemailer from 'nodemailer';

let transporter;

function getProvider() {
  const provider = process.env.EMAIL_PROVIDER
    || (process.env.NODE_ENV === 'production' ? 'brevo' : 'gmail');
  if (provider !== 'gmail' && provider !== 'brevo') {
    throw new Error('EMAIL_PROVIDER must be either "gmail" or "brevo".');
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

export async function sendPasswordResetEmail(email, code) {
  const provider = getProvider();
  if (provider === 'brevo') {
    await sendWithBrevo(email, code);
    return 'Brevo';
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
