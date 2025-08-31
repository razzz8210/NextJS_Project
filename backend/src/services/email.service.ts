import nodemailer from 'nodemailer';

// Create SMTP transporter
let transporter: nodemailer.Transporter;

async function createTransporter() {
  console.log('Creating Brevo SMTP transporter...');
  
  // Use Brevo SMTP
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    debug: true
  });
}

export const emailService = {
  async sendOtpEmail(to: string, otp: string, firstName: string) {
    if (!transporter) {
      await createTransporter();
    }

    // Test SMTP connection first
    try {
      const connectionResult = await transporter.verify();
      console.log('SMTP Connection test result:', connectionResult);
    } catch (error) {
      console.error('SMTP Connection test failed:', error);
      throw error;
    }

    const mailOptions = {
      from: '"NextJS Project" <95fad0001@smtp-brevo.com>',
      to,
      subject: 'Email Verification OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Verify Your Email</h2>
          <p>Hello ${firstName},</p>
          <p>Thank you for registering! Please use the following OTP to verify your email address:</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px; margin: 20px 0;">
            <strong>${otp}</strong>
          </div>
          <p>This OTP will expire in 5 minutes.</p>
          <p>If you didn't request this verification, please ignore this email.</p>
          <p>Best regards,<br>Your App Team</p>
        </div>
      `,
    };

    try {
      console.log('Email configuration:', {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject,
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_SECURE,
        hasAuth: !!process.env.EMAIL_USER && !!process.env.EMAIL_PASS
      });

      console.log('Attempting to send email to:', to);
      const info = await transporter.verify();
      console.log('SMTP connection verified:', info);
      
      const result = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', {
        messageId: result.messageId,
        response: result.response,
        accepted: result.accepted,
        rejected: result.rejected
      });
      
      if (!process.env.EMAIL_USER) {
        console.log('Preview URL:', nodemailer.getTestMessageUrl(result));
      }
      return true;
    } catch (err) {
      const error = err as any;
      console.error('Error sending email:', error);
      console.error('Error details:', {
        code: error?.code,
        command: error?.command,
        response: error?.response,
        message: error?.message,
        stack: error?.stack
      });
      return false;
    }
  },
};
