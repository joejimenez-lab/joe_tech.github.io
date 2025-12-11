const nodemailer = require('nodemailer');

const REQUIRED_ENV = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS', 'EMAIL_TO'];

const jsonResponse = (statusCode, payload) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});

function ensureEnv() {
  const missing = REQUIRED_ENV.filter(key => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

function createTransporter() {
  ensureEnv();
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: Number(process.env.EMAIL_PORT) === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { success: false, message: 'Method Not Allowed' });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (error) {
    return jsonResponse(400, { success: false, message: 'Invalid JSON payload' });
  }

  const requiredFields = ['name', 'email', 'phone', 'service', 'message'];
  const missingFields = requiredFields.filter(field => !payload[field]);
  if (missingFields.length) {
    return jsonResponse(400, { success: false, message: `Missing fields: ${missingFields.join(', ')}` });
  }

  const transporter = createTransporter();
  const html = `
    <h2>New Contact Request</h2>
    <p><strong>Name:</strong> ${payload.name}</p>
    <p><strong>Email:</strong> ${payload.email}</p>
    <p><strong>Phone:</strong> ${payload.phone}</p>
    <p><strong>Service:</strong> ${payload.service}</p>
    <p><strong>Message:</strong></p>
    <p>${payload.message}</p>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_TO,
      replyTo: payload.email,
      subject: 'Joe’s Tech - New Contact Form Submission',
      html
    });

    return jsonResponse(201, {
      success: true,
      message: 'Your request has been queued. Expect a confirmation shortly.'
    });
  } catch (error) {
    console.error('Failed to send contact email', error);
    return jsonResponse(500, {
      success: false,
      message: 'Unable to process your request right now. Please try again later.'
    });
  }
};
