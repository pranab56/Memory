import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import User from '@/models/User';
import Otp from '@/models/Otp';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email, otp, type } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    const otpRecord = await Otp.findOne({ email, otp });

    if (!otpRecord) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }

    // OTP is valid, delete it
    await Otp.deleteOne({ _id: otpRecord._id });

    if (type === 'signup') {
      await User.findOneAndUpdate({ email }, { isVerified: true });
      return NextResponse.json({ success: true, message: 'Account verified successfully' });
    } else if (type === 'reset-password') {
      // For reset password, we just confirm verification
      return NextResponse.json({ success: true, message: 'OTP verified' });
    }

    return NextResponse.json({ error: 'Invalid verification type' }, { status: 400 });
  } catch (err: any) {
    console.error('Verification error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
