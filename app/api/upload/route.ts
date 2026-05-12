import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { getAuthenticatedUser } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongoose';
import Media from '@/models/Media';
import { MAX_UPLOAD_FILE_BYTES, MAX_UPLOAD_FILE_LABEL } from '@/lib/upload/limits';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';
/** Allow long uploads on hosted platforms (e.g. Vercel); adjust per plan */
export const maxDuration = 3600;

// Ensure upload dirs exist
const UPLOAD_BASE = path.join(process.cwd(), 'uploads');
const IMAGE_DIR = path.join(UPLOAD_BASE, 'images');
const VIDEO_DIR = path.join(UPLOAD_BASE, 'videos');
[UPLOAD_BASE, IMAGE_DIR, VIDEO_DIR].forEach((d) => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

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
    const errors: { name: string; error: string }[] = [];

    for (const file of files) {
      try {
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');

        if (!isImage && !isVideo) {
          errors.push({ name: file.name, error: 'Unsupported file type' });
          continue;
        }

        if (file.size > MAX_UPLOAD_FILE_BYTES) {
          errors.push({
            name: file.name,
            error: `File exceeds maximum size of ${MAX_UPLOAD_FILE_LABEL}`,
          });
          continue;
        }

        const ext = path.extname(file.name).toLowerCase();
        const uniqueName = `${uuidv4()}${ext}`;
        const destDir = isImage ? IMAGE_DIR : VIDEO_DIR;
        const filePath = path.join(destDir, uniqueName);
        const relativePath = isImage ? `/images/${uniqueName}` : `/videos/${uniqueName}`;

        const webStream = file.stream();
        const nodeReadable = Readable.fromWeb(webStream as Parameters<typeof Readable.fromWeb>[0]);
        const writeStream = fs.createWriteStream(filePath);

        try {
          await pipeline(nodeReadable, writeStream);
        } catch (pipeErr) {
          if (fs.existsSync(filePath)) {
            try {
              fs.unlinkSync(filePath);
            } catch {
              /* ignore */
            }
          }
          throw pipeErr;
        }

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
