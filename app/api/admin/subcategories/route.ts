import { NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { ApiError } from '@/core/errors';
import { z } from 'zod';

const subCategorySchema = z.object({
  categoryId: z.string().uuid('Invalid category ID'),
  name: z.string().min(1, 'Name is required').max(100),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format'),
  description: z.string().max(1000).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export async function GET() {
  try {
    const subCategories = await prisma.subCategory.findMany({
      where: { deletedAt: null },
      orderBy: { sortOrder: 'asc' },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: subCategories,
    });
  } catch (error) {
    console.error('Failed to fetch subcategories:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch subcategories' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = subCategorySchema.parse(body);

    const existingCategory = await prisma.category.findUnique({
      where: { id: validatedData.categoryId },
    });

    if (!existingCategory) {
      throw ApiError.notFound('CATEGORY_NOT_FOUND', 'Category not found');
    }

    const existing = await prisma.subCategory.findUnique({
      where: { slug: validatedData.slug },
    });

    if (existing) {
      throw ApiError.conflict('SLUG_EXISTS', 'SubCategory with this slug already exists');
    }

    const subCategory = await prisma.subCategory.create({
      data: validatedData,
    });

    return NextResponse.json({
      success: true,
      data: subCategory,
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
    console.error('Failed to create subcategory:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create subcategory' },
      { status: 500 }
    );
  }
}
