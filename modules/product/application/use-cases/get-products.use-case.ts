import { prisma } from '@/db/prisma';
import { Product } from '@modules/product/domain';
import type { PaginatedResult } from '@/core/validation';
import type { Product as PrismaProduct } from '@prisma/client';

function mapPrismaProduct(product: PrismaProduct): Product {
  return Product.fromPersistence({
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description ?? undefined,
    imageUrl: product.imageUrl ?? undefined,
    price: Number(product.price),
    discountPrice: product.discountPrice ? Number(product.discountPrice) : undefined,
    weight: product.weight ?? undefined,
    isAvailable: product.isAvailable,
    isFeatured: product.isFeatured,
    subCategoryId: product.subCategoryId ?? undefined,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  });
}

export interface GetProductsOptions {
  page?: number;
  limit?: number;
  subCategoryId?: string;
  isFeatured?: boolean;
  isAvailable?: boolean;
}

export class GetProductsUseCase {
  async execute(options: GetProductsOptions = {}): Promise<PaginatedResult<Product>> {
    const {
      page = 1,
      limit = 20,
      subCategoryId,
      isFeatured,
      isAvailable = true,
    } = options;

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      deletedAt: null,
    };

    if (isAvailable !== undefined) {
      where.isAvailable = isAvailable;
    }

    if (subCategoryId) {
      where.subCategoryId = subCategoryId;
    }

    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured;
    }

    const [productsPrisma, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          sortOrder: 'asc',
        },
      }),
      prisma.product.count({ where }),
    ]);

    const products = productsPrisma.map(mapPrismaProduct);

    return {
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const getProductsUseCase = new GetProductsUseCase();
