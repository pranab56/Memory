import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongoose';
import Media from '@/models/Media';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Ensure upload dirs exist
const UPLOAD_BASE = path.join(process.cwd(), 'uploads');
const IMAGE_DIR = path.join(UPLOAD_BASE, 'images');
const VIDEO_DIR = path.join(UPLOAD_BASE, 'videos');
[UPLOAD_BASE, IMAGE_DIR, VIDEO_DIR].forEach((d) => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

export const config = {
  api: { bodyParser: false },
};

export async function POST(req: NextRequest) {
  const username = getAuthenticatedUser(req);
  if (!username) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();

    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const savedMedia = [];
    const errors = [];

    for (const file of files) {
      try {
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');

        if (!isImage && !isVideo) {
          errors.push({ name: file.name, error: 'Unsupported file type' });
          continue;
        }

        const ext = path.extname(file.name).toLowerCase();
        const uniqueName = `${uuidv4()}${ext}`;
        const destDir = isImage ? IMAGE_DIR : VIDEO_DIR;
        const filePath = path.join(destDir, uniqueName);
        const relativePath = isImage ? `/images/${uniqueName}` : `/videos/${uniqueName}`;

        // Stream file to disk
        const buffer = Buffer.from(await file.arrayBuffer());
        fs.writeFileSync(filePath, buffer);

        const mediaDoc = await Media.create({
          type: isImage ? 'image' : 'video',
          image: isImage ? relativePath : null,
          video: isVideo ? relativePath : null,
          filename: uniqueName,
          originalName: file.name,
          size: file.size,
          mimeType: file.type,
          uploadedBy: username,
        });

        savedMedia.push(mediaDoc);
      } catch (fileErr) {
        console.error(`Error processing file ${file.name}:`, fileErr);
        errors.push({ name: file.name, error: 'Failed to process file' });
      }
    }

    return NextResponse.json({
      success: true,
      uploaded: savedMedia.length,
      media: savedMedia,
      errors,
    });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
