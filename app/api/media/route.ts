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
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { uploadedBy: username };
    if (type && ['image', 'video'].includes(type)) query.type = type;
    if (search) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      query.originalName = { $regex: search, $options: 'i' } as any;
    }

    // Month & Year filtering
    if (year) {
      const y = parseInt(year);
      if (month) {
        const m = parseInt(month);
        const start = new Date(y, m - 1, 1);
        const end = new Date(y, m, 1);
        query.uploadedAt = { $gte: start, $lt: end };
      } else {
        const start = new Date(y, 0, 1);
        const end = new Date(y + 1, 0, 1);
        query.uploadedAt = { $gte: start, $lt: end };
      }
    } else if (month) {
      const m = parseInt(month);
      query.$expr = { $eq: [{ $month: '$uploadedAt' }, m] };
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
