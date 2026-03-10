import { NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { ApiError } from '@/core/errors';
import { z } from 'zod';

const updateCategorySchema = z.object({
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
    const category = await prisma.category.findUnique({
      where: { id: params.id },
      include: {
        subCategories: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!category) {
      throw ApiError.notFound('NOT_FOUND', 'Category not found');
    }

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    console.error('Failed to fetch category:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch category' },
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
    const validatedData = updateCategorySchema.parse(body);

    if (validatedData.slug) {
      const existing = await prisma.category.findFirst({
        where: { 
          slug: validatedData.slug,
          NOT: { id: params.id }
        },
      });
      if (existing) {
        throw ApiError.conflict('SLUG_EXISTS', 'Category with this slug already exists');
      }
    }

    const category = await prisma.category.update({
      where: { id: params.id },
      data: validatedData,
    });

    return NextResponse.json({
      success: true,
      data: category,
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
    console.error('Failed to update category:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update category' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.category.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: 'Category deleted',
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    console.error('Failed to delete category:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
