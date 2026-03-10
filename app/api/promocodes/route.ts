import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, orderAmount } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'CODE_REQUIRED', message: 'Promo code is required' },
        { status: 400 }
      );
    }

    const promoCode = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promoCode) {
      return NextResponse.json(
        { error: 'INVALID_CODE', message: 'Промокод не найден' },
        { status: 400 }
      );
    }

    if (!promoCode.isActive) {
      return NextResponse.json(
        { error: 'INACTIVE_CODE', message: 'Промокод неактивен' },
        { status: 400 }
      );
    }

    if (promoCode.maxUses && promoCode.usedCount >= promoCode.maxUses) {
      return NextResponse.json(
        { error: 'CODE_EXHAUSTED', message: 'Промокод больше нельзя использовать' },
        { status: 400 }
      );
    }

    const now = new Date();
    if (promoCode.validFrom && now < promoCode.validFrom) {
      return NextResponse.json(
        { error: 'CODE_NOT_YET_VALID', message: 'Промокод ещё не действует' },
        { status: 400 }
      );
    }

    if (promoCode.validUntil && now > promoCode.validUntil) {
      return NextResponse.json(
        { error: 'CODE_EXPIRED', message: 'Срок действия промокода истёк' },
        { status: 400 }
      );
    }

    if (promoCode.minOrderAmount && orderAmount < Number(promoCode.minOrderAmount)) {
      return NextResponse.json(
        { error: 'MIN_AMOUNT_NOT_MET', message: `Минимальная сумма заказа: ${promoCode.minOrderAmount} ₽` },
        { status: 400 }
      );
    }

    let discount = 0;
    if (promoCode.discountType === 'PERCENT') {
      discount = (orderAmount * Number(promoCode.discountValue)) / 100;
    } else {
      discount = Number(promoCode.discountValue);
    }

    return NextResponse.json({
      success: true,
      data: {
        id: promoCode.id,
        code: promoCode.code,
        discountType: promoCode.discountType,
        discountValue: promoCode.discountValue,
        discount: discount,
      },
    });
  } catch (error) {
    console.error('Failed to validate promo code:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to validate promo code' },
      { status: 500 }
    );
  }
}
