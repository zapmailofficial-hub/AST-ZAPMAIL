// AST ZAPMAIL with attachments
const express = require('express');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

dotenv.config();
const app = express();

// Serve static files from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Parse JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup multer for file uploads (stored temporarily in 'uploads/')
const upload = multer({ dest: 'uploads/' });

// GET homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// POST /send with attachments
// 'attachments' field in form can handle multiple files
app.post('/send', upload.array('attachments'), async (req, res) => {
  const { fromAccount, to, subject, text } = req.body;

  // Select the Gmail account
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

    // Prepare attachments from uploaded files
    let mailAttachments = [];
    if (req.files) {
      mailAttachments = req.files.map(file => ({
        filename: file.originalname,
        path: file.path
      }));
    }

    const info = await transporter.sendMail({
      from: email,
      to,
      subject,
      text,
      attachments: mailAttachments
    });

    // Delete uploaded files after sending
    if (req.files) {
      req.files.forEach(file => fs.unlinkSync(file.path));
    }

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
