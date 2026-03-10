import { NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { ApiError } from '@/core/errors';
import { z } from 'zod';

const updateProductSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).optional(),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format').optional(),
  description: z.string().max(5000).optional(),
  composition: z.string().max(2000).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')).optional(),
  price: z.number().positive().optional(),
  discountPrice: z.number().positive().optional(),
  weight: z.number().positive().optional(),
  subCategoryId: z.string().uuid().optional().or(z.literal('')),
  isFeatured: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        subCategory: {
          include: {
            category: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
    });

    if (!product) {
      throw ApiError.notFound('NOT_FOUND', 'Product not found');
    }

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    console.error('Failed to fetch product:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch product' },
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
    const validatedData = updateProductSchema.parse(body);

    if (validatedData.slug) {
      const existing = await prisma.product.findFirst({
        where: {
          slug: validatedData.slug,
          NOT: { id: params.id }
        },
      });
      if (existing) {
        throw ApiError.conflict('SLUG_EXISTS', 'Product with this slug already exists');
      }
    }

    const updateData: Record<string, unknown> = { ...validatedData };
    if (validatedData.subCategoryId === '') {
      updateData.subCategoryId = null;
    }

    const product = await prisma.product.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: product,
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
    console.error('Failed to update product:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.product.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: 'Product deleted',
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    console.error('Failed to delete product:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
