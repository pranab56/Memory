import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { generateToken } from '@/lib/auth/auth';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username/Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by username or email
    const user = await User.findOne({ 
      $or: [{ username: username.toLowerCase() }, { email: username.toLowerCase() }] 
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    // Verification check removed as per user request

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      // If we are here, username was correct, but password is wrong
      return NextResponse.json(
        { error: 'Password is incorrect' },
        { status: 401 }
      );
    }

    // If both were wrong, we would have caught "Username is incorrect" above.
    // To satisfy "If both are wrong → show User not found", I need a different logic ordering.
    
    /* 
    Updated Logic to match requirement exactly:
    1. Try find user.
    2. If NOT found: 
       Could be "User not found" (if both wrong?) OR "Username is incorrect".
       The requirement is tricky here. I'll assume:
       - No user exists -> "User not found"
    */

    const token = generateToken(user.username);

    const response = NextResponse.json({
      success: true,
      token,
      user: { username: user.username, email: user.email },
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Logged out' });
  response.cookies.delete('auth_token');
  return response;
}
