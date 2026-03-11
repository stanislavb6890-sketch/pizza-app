import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';

function getUploadDir() {
  const isStandalone = process.env.NEXT_RUNTIME === 'nodejs' && existsSync(join(process.cwd(), 'standalone'));
  if (isStandalone) {
    return join(process.cwd(), 'standalone', 'public', 'uploads');
  }
  return join(process.cwd(), 'public', 'uploads');
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'NO_FILE', message: 'No file provided' },
        { status: 400 }
      );
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'INVALID_TYPE', message: 'Only images are allowed' },
        { status: 400 }
      );
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'FILE_TOO_LARGE', message: 'File must be less than 5MB' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = getUploadDir();
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;
    const filepath = join(uploadDir, filename);

    await writeFile(filepath, buffer);

    const url = `/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      data: { url },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'UPLOAD_FAILED', message: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
