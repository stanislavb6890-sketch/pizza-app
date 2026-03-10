import { NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { ApiError } from '@/core/errors';
import { z } from 'zod';

const updateSubCategorySchema = z.object({
  categoryId: z.string().uuid('Invalid category ID').optional(),
  name: z.string().min(1, 'Name is required').max(100).optional(),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format').optional(),
  description: z.string().max(1000).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const subCategory = await prisma.subCategory.findUnique({
      where: { id: params.id },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!subCategory) {
      throw ApiError.notFound('NOT_FOUND', 'SubCategory not found');
    }

    return NextResponse.json({
      success: true,
      data: subCategory,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    console.error('Failed to fetch subcategory:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch subcategory' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = updateSubCategorySchema.parse(body);

    if (validatedData.categoryId) {
      const existingCategory = await prisma.category.findUnique({
        where: { id: validatedData.categoryId },
      });
      if (!existingCategory) {
        throw ApiError.notFound('CATEGORY_NOT_FOUND', 'Category not found');
      }
    }

    if (validatedData.slug) {
      const existing = await prisma.subCategory.findFirst({
        where: { 
          slug: validatedData.slug,
          NOT: { id: params.id }
        },
      });
      if (existing) {
        throw ApiError.conflict('SLUG_EXISTS', 'SubCategory with this slug already exists');
      }
    }

    const subCategory = await prisma.subCategory.update({
      where: { id: params.id },
      data: validatedData,
    });

    return NextResponse.json({
      success: true,
      data: subCategory,
    });
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
    console.error('Failed to update subcategory:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update subcategory' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.subCategory.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: 'SubCategory deleted',
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    console.error('Failed to delete subcategory:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to delete subcategory' },
      { status: 500 }
    );
  }
}
