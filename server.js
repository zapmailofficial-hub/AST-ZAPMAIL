// AST ZAPMAIL server.js
const express = require('express');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();
const app = express();

// Serve static files from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Parse JSON bodies
app.use(express.json());

// GET homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// POST /send to send emails
app.post('/send', async (req, res) => {
  const { fromAccount, to, subject, text } = req.body;

  // Pick the correct Gmail account from environment variables
  let email, appPass;
  if (fromAccount === 'server01') {
    email = process.env.SERVER01_EMAIL;
    appPass = process.env.SERVER01_APP_PASS;
  } else if (fromAccount === 'server02') {
    email = process.env.SERVER02_EMAIL;
    appPass = process.env.SERVER02_APP_PASS;
  } else if (fromAccount === 'server03') {
    email = process.env.SERVER03_EMAIL;
    appPass = process.env.SERVER03_APP_PASS;
  } else {
    return res.status(400).json({ error: 'Invalid fromAccount' });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: email, pass: appPass }
    });

    const info = await transporter.sendMail({
      from: email,
      to,
      subject,
      text
    });

    res.json({ ok: true, id: info.messageId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`AST ZAPMAIL running on port ${PORT}`);
});
