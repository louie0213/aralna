import nodemailer from 'nodemailer';

let transporter;

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const password = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, '');
  if (!user || !password) {
    throw new Error('Set GMAIL_USER and GMAIL_APP_PASSWORD in server/.env to enable password reset emails.');
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      connectionTimeout: 6000,
      greetingTimeout: 6000,
      socketTimeout: 12000,
      auth: { user, pass: password },
    });
  }

  return transporter;
}

export async function sendPasswordResetEmail(email, code) {
  const user = process.env.GMAIL_USER;
  await getTransporter().sendMail({
    from: `"AralNa" <${user}>`,
    to: email,
    subject: 'Your AralNa password reset code',
    text: `Your AralNa password reset code is ${code}. It expires in 10 minutes. If you did not request this, you can ignore this email.`,
    html: `<p>Your AralNa password reset code is:</p><p style="font-size:24px;font-weight:bold;letter-spacing:5px">${code}</p><p>This code expires in 10 minutes. If you did not request this, you can ignore this email.</p>`,
  });
}
