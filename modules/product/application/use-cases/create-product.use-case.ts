import { prisma } from '@/db/prisma';
import { Product } from '@modules/product/domain';
import { ApiError } from '@/core/errors';
import type { CreateProductInput } from '../schemas';
import type { Product as PrismaProduct } from '@prisma/client';

function transliterate(text: string): string {
  const ru: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '',
    'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya', ' ': '-'
  };
  return text.toLowerCase().split('').map(c => ru[c] || c.replace(/[^a-z0-9]/g, '')).join('').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function generateSlug(name: string): string {
  let slug = transliterate(name);
  const random = Math.random().toString(36).substring(2, 6);
  return `${slug}-${random}`;
}

async function getUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 0;
  while (true) {
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (!existing) return slug;
    counter++;
    slug = `${baseSlug}-${counter}`;
  }
}

function mapPrismaProduct(product: PrismaProduct): Product {
  return Product.fromPersistence({
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description ?? undefined,
    composition: (product as unknown as { composition?: string }).composition ?? undefined,
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

export class CreateProductUseCase {
  async execute(input: CreateProductInput): Promise<Product> {
    const slug = input.slug || await getUniqueSlug(transliterate(input.name));

    const existing = await prisma.product.findUnique({
      where: { slug },
    });

    if (existing) {
      throw ApiError.conflict('SLUG_EXISTS', 'Product with this slug already exists');
    }

    const productPrisma = await prisma.product.create({
      data: {
        name: input.name,
        slug,
        description: input.description,
        composition: input.composition,
        imageUrl: input.imageUrl,
        price: input.price,
        discountPrice: input.discountPrice,
        weight: input.weight,
        subCategoryId: input.subCategoryId,
        isFeatured: input.isFeatured,
        isAvailable: true,
        sortOrder: 0,
      },
    });

    return mapPrismaProduct(productPrisma);
  }
}

export const createProductUseCase = new CreateProductUseCase();
