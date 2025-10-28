require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// transporter factory
function makeTransporter(email, appPass) {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // STARTTLS
    auth: {
      user: email,
      pass: appPass
    }
  });
}

// accounts
const accounts = {
  server01: { email: process.env.SERVER01_EMAIL, pass: process.env.SERVER01_APP_PASS },
  server02: { email: process.env.SERVER02_EMAIL, pass: process.env.SERVER02_APP_PASS },
  server03: { email: process.env.SERVER03_EMAIL, pass: process.env.SERVER03_APP_PASS },
};

// send endpoint
app.post('/send', async (req, res) => {
  try {
    const { fromAccount = 'server01', to, subject, text, html } = req.body;

    if (!to || !subject || (!text && !html)) {
      return res.status(400).json({ error: 'to, subject and text/html required' });
    }

    const acct = accounts[fromAccount];
    if (!acct || !acct.email || !acct.pass) {
      return res.status(500).json({ error: 'sender account not configured' });
    }

    const transporter = makeTransporter(acct.email, acct.pass);

    const info = await transporter.sendMail({
      from: `"A SOCIETY ZAPMAIL" <${acct.email}>`,
      to,
      subject,
      text,
      html
    });

    console.log('Message sent:', info.messageId);
    return res.json({ ok: true, id: info.messageId });
  } catch (err) {
    console.error('send error', err);
    return res.status(500).json({ error: 'send_failed', details: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`AST ZAPMAIL running at http://localhost:${PORT}`));
