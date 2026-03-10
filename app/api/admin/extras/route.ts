import { NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { ApiError } from '@/core/errors';
import { z } from 'zod';

const productExtraSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  name: z.string().min(1, 'Name is required').max(100),
  slug: z.string().min(1, 'Slug is required'),
  price: z.number().positive('Price must be positive'),
  isDefault: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    const where = productId ? { productId } : {};

    const extras = await prisma.productExtra.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: {
        product: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: extras,
    });
  } catch (error) {
    console.error('Failed to fetch extras:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch extras' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = productExtraSchema.parse(body);

    const product = await prisma.product.findUnique({
      where: { id: validatedData.productId },
    });

    if (!product) {
      throw ApiError.notFound('PRODUCT_NOT_FOUND', 'Product not found');
    }

    const existing = await prisma.productExtra.findFirst({
      where: {
        productId: validatedData.productId,
        slug: validatedData.slug,
      },
    });

    if (existing) {
      throw ApiError.conflict('SLUG_EXISTS', 'Extra with this slug already exists for this product');
    }

    const extra = await prisma.productExtra.create({
      data: validatedData,
    });

    return NextResponse.json({
      success: true,
      data: extra,
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
    console.error('Failed to create extra:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create extra' },
      { status: 500 }
    );
  }
}
