import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { ApiError } from '@/core/errors';
import { z } from 'zod';

const updateExtraSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  price: z.number().positive().optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const extra = await prisma.productExtra.findUnique({
      where: { id: params.id },
      include: {
        product: {
          select: { id: true, name: true },
        },
      },
    });

    if (!extra) {
      throw ApiError.notFound('EXTRA_NOT_FOUND', 'Extra not found');
    }

    return NextResponse.json({
      success: true,
      data: extra,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    console.error('Failed to fetch extra:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch extra' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const data = updateExtraSchema.parse(body);

    const extra = await prisma.productExtra.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json({
      success: true,
      data: extra,
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
    console.error('Failed to update extra:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update extra' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.productExtra.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Failed to delete extra:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to delete extra' },
      { status: 500 }
    );
  }
}
