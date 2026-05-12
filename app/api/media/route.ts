import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongoose';
import Media from '@/models/Media';

export async function GET(req: NextRequest) {
  const username = getAuthenticatedUser(req);
  if (!username) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'image' | 'video' | null
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { uploadedBy: username };
    if (type && ['image', 'video'].includes(type)) query.type = type;
    if (search) {
      query.originalName = { $regex: search, $options: 'i' };
    }

    const [media, total] = await Promise.all([
      Media.find(query).sort({ uploadedAt: -1 }).skip(skip).limit(limit).lean(),
      Media.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      media,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('Fetch media error:', err);
    return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
  }
}
