// ============================================
// 📧 Email Notification Service
// ============================================
const nodemailer = require('nodemailer');

/**
 * Create a reusable email transporter
 * Uses Gmail SMTP by default (configurable via .env)
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Send email notification when a new contact message is received
 * @param {Object} contact - The contact form data
 * @returns {boolean} - Success status
 */
const sendContactNotification = async (contact) => {
  try {
    // Skip if email is not configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('⚠️  Email not configured, skipping notification...');
      return false;
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: `"Portfolio Contact" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_TO || process.env.EMAIL_USER,
      subject: `📬 New Portfolio Message: ${contact.subject}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; border-radius: 12px; overflow: hidden; border: 1px solid #1a1a2e;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #0ef 0%, #0066ff 100%); padding: 30px; text-align: center;">
            <h1 style="color: #0a0a0a; margin: 0; font-size: 24px; font-weight: 700;">
              📬 New Contact Message
            </h1>
            <p style="color: #0a0a0a; margin: 8px 0 0; opacity: 0.8;">
              Someone reached out through your portfolio!
            </p>
          </div>

          <!-- Body -->
          <div style="padding: 30px;">
            
            <!-- Name -->
            <div style="margin-bottom: 20px;">
              <label style="color: #0ef; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
                👤 Name
              </label>
              <p style="color: #ffffff; font-size: 16px; margin: 6px 0 0; padding: 12px; background: #1a1a2e; border-radius: 8px; border-left: 3px solid #0ef;">
                ${contact.name}
              </p>
            </div>

            <!-- Email -->
            <div style="margin-bottom: 20px;">
              <label style="color: #0ef; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
                📧 Email
              </label>
              <p style="color: #ffffff; font-size: 16px; margin: 6px 0 0; padding: 12px; background: #1a1a2e; border-radius: 8px; border-left: 3px solid #0ef;">
                <a href="mailto:${contact.email}" style="color: #0ef; text-decoration: none;">${contact.email}</a>
              </p>
            </div>

            <!-- Subject -->
            <div style="margin-bottom: 20px;">
              <label style="color: #0ef; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
                📝 Subject
              </label>
              <p style="color: #ffffff; font-size: 16px; margin: 6px 0 0; padding: 12px; background: #1a1a2e; border-radius: 8px; border-left: 3px solid #0ef;">
                ${contact.subject}
              </p>
            </div>

            <!-- Message -->
            <div style="margin-bottom: 20px;">
              <label style="color: #0ef; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
                💬 Message
              </label>
              <p style="color: #ffffff; font-size: 16px; margin: 6px 0 0; padding: 16px; background: #1a1a2e; border-radius: 8px; border-left: 3px solid #0ef; line-height: 1.6; white-space: pre-wrap;">
${contact.message}
              </p>
            </div>

            <!-- Reply Button -->
            <div style="text-align: center; margin-top: 30px;">
              <a href="mailto:${contact.email}?subject=Re: ${contact.subject}" 
                 style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #0ef 0%, #0066ff 100%); color: #0a0a0a; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                Reply Now →
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="padding: 20px 30px; background: #050505; text-align: center; border-top: 1px solid #1a1a2e;">
            <p style="color: #666; font-size: 12px; margin: 0;">
              Sent from your Portfolio Contact Form · ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('📧 Email notification sent successfully');
    return true;
  } catch (error) {
    console.error('❌ Email send error:', error.message);
    return false;
  }
};

module.exports = { sendContactNotification };
