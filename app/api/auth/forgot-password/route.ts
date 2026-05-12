import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import User from '@/models/User';
import Otp from '@/models/Otp';
import { sendResetPasswordEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // For security, don't reveal if user exists? 
      // User requirement says "Forgot Password -> Send OTP". 
      // I'll show error if not found to guide the user as requested.
      return NextResponse.json({ error: 'User not found with this email' }, { status: 404 });
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP
    await Otp.findOneAndUpdate(
      { email: email.toLowerCase() },
      { otp: otpCode, createdAt: new Date() },
      { upsert: true }
    );

    // Send Email
    try {
      await sendResetPasswordEmail(email, otpCode);
    } catch (emailErr) {
      console.error('Failed to send reset email:', emailErr);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Reset code sent to your email' });
  } catch (err: any) {
    console.error('Forgot password error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
