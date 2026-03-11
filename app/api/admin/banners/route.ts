import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';

export async function GET() {
  try {
    const banners = await prisma.banner.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: banners,
    });
  } catch (error) {
    console.error('Failed to fetch banners:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch banners' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, subtitle, imageUrl, link, linkText, isActive, sortOrder } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'IMAGE_REQUIRED', message: 'Image URL is required' },
        { status: 400 }
      );
    }

    const banner = await prisma.banner.create({
      data: {
        title: title || null,
        subtitle: subtitle || null,
        imageUrl,
        link: link || null,
        linkText: linkText || null,
        isActive: isActive ?? true,
        sortOrder: sortOrder ?? 0,
      },
    });

    return NextResponse.json({
      success: true,
      data: banner,
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create banner:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create banner' },
      { status: 500 }
    );
  }
}