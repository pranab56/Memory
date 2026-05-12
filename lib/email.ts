import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail', // You can change this to your email provider
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendOtpEmail(email: string, otp: string) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verification Code for Media Dashboard',
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2>Verify your email</h2>
          <p>Use the following 6-digit code to verify your account:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #7c3aed; padding: 10px 0;">
            ${otp}
          </div>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `,
    };

    return await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Nodemailer Error (OTP):', error);
    throw error;
  }
}

export async function sendResetPasswordEmail(email: string, otp: string) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Reset Password for Media Dashboard',
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2>Reset your password</h2>
          <p>Use the following 6-digit code to reset your password:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #ef4444; padding: 10px 0;">
            ${otp}
          </div>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `,
    };

    return await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Nodemailer Error (Reset):', error);
    throw error;
  }
}
