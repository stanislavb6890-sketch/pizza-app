import { NextRequest, NextResponse } from 'next/server';
import { getProductsUseCase } from '@/modules/product/application';
import { paginationSchema } from '@/core/validation';
import { ApiError } from '@/core/errors';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const validatedData = paginationSchema.parse({
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
    });

    const result = await getProductsUseCase.execute({
      page: validatedData.page,
      limit: validatedData.limit,
      isAvailable: true,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.statusCode },
      );
    }

    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch products' },
      { status: 500 },
    );
  }
}
