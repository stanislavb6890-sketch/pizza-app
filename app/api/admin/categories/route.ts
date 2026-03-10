import { NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { ApiError } from '@/core/errors';
import { z } from 'zod';

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format'),
  description: z.string().max(1000).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: { sortOrder: 'asc' },
      include: {
        subCategories: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = categorySchema.parse(body);

    const existing = await prisma.category.findUnique({
      where: { slug: validatedData.slug },
    });

    if (existing) {
      throw ApiError.conflict('SLUG_EXISTS', 'Category with this slug already exists');
    }

    const category = await prisma.category.create({
      data: validatedData,
    });

    return NextResponse.json({
      success: true,
      data: category,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('Failed to create category:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create category' },
      { status: 500 }
    );
  }
}
