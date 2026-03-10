import { NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { createProductUseCase, createProductSchema, updateProductSchema } from '@/modules/product/application';
import { ApiError } from '@/core/errors';
import { z } from 'zod';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        subCategory: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = createProductSchema.parse(body);
    
    const product = await createProductUseCase.execute(validatedData);
    
    return NextResponse.json({
      success: true,
      data: product,
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
    console.error('Failed to create product:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create product' },
      { status: 500 }
    );
  }
}
