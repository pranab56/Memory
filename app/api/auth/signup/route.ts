import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import User from '@/models/User';
import Otp from '@/models/Otp';
import bcrypt from 'bcryptjs';
import { sendOtpEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { username, email, password } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      const field = existingUser.email === email ? 'Email' : 'Username';
      return NextResponse.json(
        { error: `${field} already exists` },
        { status: 400 }
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Create user (unverified)
    const newUser = await User.create({
      username,
      email,
      passwordHash,
      isVerified: false,
    });

    // Save OTP
    await Otp.create({
      email,
      otp: otpCode,
    });

    // Send Email
    try {
      await sendOtpEmail(email, otpCode);
    } catch (emailErr) {
      console.error('Failed to send verification email:', emailErr);
      // We still created the user, but we should inform them if email failed
      return NextResponse.json({
        success: true,
        message: 'Account created but failed to send verification email. Please try resending OTP.',
        email,
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Verification code sent to your email',
        email,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Signup error:', err);
    return NextResponse.json({ error: 'Internal server error: ' + err.message }, { status: 500 });
  }
}
