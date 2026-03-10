import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { z } from 'zod';

const promoCodeSchema = z.object({
  code: z.string().min(1).max(50).toUpperCase(),
  discountType: z.enum(['PERCENT', 'FIXED']),
  discountValue: z.number().positive(),
  minOrderAmount: z.number().optional(),
  maxUses: z.number().int().positive().optional(),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
});

export async function GET() {
  try {
    const promoCodes = await prisma.promoCode.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: promoCodes,
    });
  } catch (error) {
    console.error('Failed to fetch promo codes:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch promo codes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = promoCodeSchema.parse(body);

    const promoCode = await prisma.promoCode.create({
      data: {
        code: data.code,
        discountType: data.discountType,
        discountValue: data.discountValue,
        minOrderAmount: data.minOrderAmount,
        maxUses: data.maxUses,
        validFrom: data.validFrom ? new Date(data.validFrom) : null,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
      },
    });

    return NextResponse.json({
      success: true,
      data: promoCode,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('Failed to create promo code:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create promo code' },
      { status: 500 }
    );
  }
}
