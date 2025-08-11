import nodemailer from 'nodemailer';
import { htmlEmailTemplate } from './emailTemplates.js'; 

// For Gmail
const createGmailTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USERNAME, // Your actual Gmail
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });
};

const sendEmail = async (options) => {
  // 1) Create transporter
  let transporter;
  if (process.env.EMAIL_PROVIDER === 'gmail') {
    transporter = createGmailTransporter();
  } else {
    throw new Error('No email provider configured');
  }

  // 2) Define email options with custom "From"
  const mailOptions = {
    from: `"Price Signal" <${process.env.EMAIL_FROM || 'no-reply@pricesignal.com'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || htmlEmailTemplate(options.message),
    headers: {
      'X-Entity-Ref-ID': crypto.randomUUID(),
      'Return-Path': process.env.GMAIL_USERNAME 
    }
  };

  // 3) Send email
  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error('Email sending error:', err);
    throw err;
  }
};

export default sendEmail;