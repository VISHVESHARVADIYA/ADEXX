import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Log requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API endpoint to handle contact lead form submission
app.post('/api/submit-lead', async (req, res) => {
  try {
    const { name, email, phone, service, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, Email and Message are required fields.' });
    }

    console.log('--- NEW LEAD FORM SUBMISSION ---');
    console.log(`Name: ${name}`);
    console.log(`Email: ${email}`);
    console.log(`Phone: ${phone || 'N/A'}`);
    console.log(`Service: ${service || 'N/A'}`);
    console.log(`Message: ${message}`);
    console.log('--------------------------------');

    let smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    // Robustly clean smtpHost if it has a protocol or invalid prefix
    if (smtpHost.startsWith('://')) {
      smtpHost = smtpHost.substring(3);
    }
    if (smtpHost.includes('://')) {
      try {
        const url = new URL(smtpHost);
        smtpHost = url.hostname || smtpHost;
      } catch (e) {
        // ignore
      }
    }
    if (smtpHost === 'gmail.com') {
      smtpHost = 'smtp.gmail.com';
    }

    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (smtpUser && smtpPass) {
      // Lazy initialization of transporter
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465, // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const mailOptions = {
        from: `"${name} (AdeX Lead)" <${smtpUser}>`,
        to: 'adexcreative1010@gmail.com',
        replyTo: email,
        subject: `New Lead Form Submission: ${name}`,
        text: `New Lead Received from AdeX Website\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone || 'Not provided'}\nService: ${service || 'Not provided'}\nMessage:\n${message}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #4F75FF; border-bottom: 2px solid #4F75FF; padding-bottom: 10px;">New Lead Received from AdeX Website</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
            <p><strong>Service Requested:</strong> ${service || 'Not provided'}</p>
            <p><strong>Message:</strong></p>
            <div style="white-space: pre-wrap; background-color: #f9f9f9; padding: 15px; border-radius: 6px; border-left: 4px solid #4F75FF; color: #333;">${message}</div>
            <hr style="border: 0; border-top: 1px solid #eeeeee; margin-top: 20px;" />
            <p style="font-size: 11px; color: #999; text-align: center;">This lead was submitted via the AdeX online consultation form.</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log('Email sent successfully to adexcreative1010@gmail.com');
      return res.json({ success: true, message: 'Your request has been sent successfully!' });
    } else {
      console.warn('SMTP credentials not configured. Lead logged to server console.');
      return res.json({
        success: true,
        mocked: true,
        message: 'Lead received! (Note: Set SMTP credentials in environment variables to send real emails to adexcreative1010@gmail.com)'
      });
    }
  } catch (error) {
    console.error('Error handling lead submission:', error);
    return res.status(500).json({ error: error.message || 'Internal server error processing submission.' });
  }
});

// Serve static files from the root directory
app.use(express.static(__dirname, {
  extensions: ['html'], // support clean URLs
  index: 'index.html'
}));

// Fallback: If not found, serve the main index.html to avoid broken states
app.use((req, res) => {
  console.warn(`[404] Not Found: ${req.url}`);
  res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
