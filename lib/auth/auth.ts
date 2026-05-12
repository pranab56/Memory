import { NextRequest } from 'next/server';

const SESSION_SECRET = process.env.SESSION_SECRET || 'media-dashboard-secret-key-2024';

export function generateToken(username: string): string {
  // Simple base64 token (for demonstration, in production use JWT)
  const payload = JSON.stringify({
    username,
    timestamp: Date.now(),
    secret: SESSION_SECRET,
  });
  return Buffer.from(payload).toString('base64');
}

export function validateToken(token: string): { isValid: boolean; username?: string } {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
    const isValidSecret = payload.secret === SESSION_SECRET;
    // Token expires in 24 hours
    const isExpired = Date.now() - payload.timestamp > 24 * 60 * 60 * 1000;
    
    if (isValidSecret && !isExpired) {
      return { isValid: true, username: payload.username };
    }
    return { isValid: false };
  } catch {
    return { isValid: false };
  }
}

export function getTokenFromRequest(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  const cookieToken = req.cookies.get('auth_token')?.value;
  return cookieToken || null;
}

export function getAuthenticatedUser(req: NextRequest): string | null {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  const result = validateToken(token);
  return result.isValid ? result.username || null : null;
}

export function isAuthenticated(req: NextRequest): boolean {
  return getAuthenticatedUser(req) !== null;
}
