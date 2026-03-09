import { prisma } from '@/db/prisma';
import { Product } from '@modules/product/domain';
import type { ProductRepository } from '@modules/product/domain/repositories';
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

export class PrismaProductRepository implements ProductRepository {
  async findById(id: string): Promise<Product | null> {
    const productPrisma = await prisma.product.findUnique({
      where: { id, deletedAt: null },
    });

    if (!productPrisma) return null;
    return mapPrismaProduct(productPrisma);
  }

  async findBySlug(slug: string): Promise<Product | null> {
    const productPrisma = await prisma.product.findUnique({
      where: { slug, deletedAt: null },
    });

    if (!productPrisma) return null;
    return mapPrismaProduct(productPrisma);
  }

  async findBySubCategoryId(subCategoryId: string): Promise<Product[]> {
    const productsPrisma = await prisma.product.findMany({
      where: {
        subCategoryId,
        deletedAt: null,
        isAvailable: true,
      },
      orderBy: { sortOrder: 'asc' },
    });

    return productsPrisma.map(mapPrismaProduct);
  }

  async findAvailable(): Promise<Product[]> {
    const productsPrisma = await prisma.product.findMany({
      where: {
        deletedAt: null,
        isAvailable: true,
      },
      orderBy: { sortOrder: 'asc' },
    });

    return productsPrisma.map(mapPrismaProduct);
  }

  async findFeatured(): Promise<Product[]> {
    const productsPrisma = await prisma.product.findMany({
      where: {
        deletedAt: null,
        isAvailable: true,
        isFeatured: true,
      },
      orderBy: { sortOrder: 'asc' },
    });

    return productsPrisma.map(mapPrismaProduct);
  }

  async save(product: Product): Promise<Product> {
    const data = product.toJSON();
    const productPrisma = await prisma.product.create({
      data: {
        id: data.id,
        name: data.name,
        slug: data.slug,
        description: data.description,
        imageUrl: data.imageUrl,
        price: data.price,
        discountPrice: data.discountPrice,
        weight: data.weight,
        subCategoryId: data.subCategoryId,
        isAvailable: data.isAvailable,
        isFeatured: data.isFeatured,
        sortOrder: 0,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
    });

    return mapPrismaProduct(productPrisma);
  }

  async update(product: Product): Promise<Product> {
    const data = product.toJSON();
    const productPrisma = await prisma.product.update({
      where: { id: data.id },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        imageUrl: data.imageUrl,
        price: data.price,
        discountPrice: data.discountPrice,
        weight: data.weight,
        subCategoryId: data.subCategoryId,
        isAvailable: data.isAvailable,
        isFeatured: data.isFeatured,
        updatedAt: data.updatedAt,
      },
    });

    return mapPrismaProduct(productPrisma);
  }

  async delete(id: string): Promise<void> {
    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export const prismaProductRepository = new PrismaProductRepository();
