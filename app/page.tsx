import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

interface Banner {
  id: string;
  title: string | null;
  subtitle: string | null;
  imageUrl: string;
  link: string | null;
  linkText: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  price: number;
  discountPrice: number | null;
  isFeatured: boolean;
}

async function getBanners() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/banners`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

async function getCategories() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/categories`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

async function getProducts() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/products?limit=100`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data?.data || [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const banners = await getBanners() as Banner[];
  const categories = await getCategories() as Category[];
  const products = await getProducts() as Product[];

  const availableProducts = products.filter(p => p.discountPrice !== null || p.isFeatured);
  const featuredProducts = availableProducts.filter(p => p.isFeatured);
  const discountedProducts = availableProducts.filter(p => p.discountPrice && Number(p.discountPrice) < Number(p.price));

  return (
    <div>
      {/* Categories Navigation */}
      {categories.length > 0 && (
        <section className="bg-white border-b sticky top-16 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              <Link href="/menu">
                <button className="px-4 py-2 bg-primary-600 text-white rounded-full text-sm font-medium whitespace-nowrap hover:bg-primary-700 transition-colors">
                  Всё меню
                </button>
              </Link>
              {categories.map((category) => (
                <Link key={category.id} href={`/menu?category=${category.slug}`}>
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium whitespace-nowrap hover:bg-gray-200 transition-colors">
                    {category.name}
                  </button>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Banner Section */}
      {banners.length > 0 ? (
        <section className="relative">
          <div className="max-w-7xl mx-auto">
            {banners[0] && (
              <div className="relative h-[300px] md:h-[400px] lg:h-[500px]">
                <Image
                  src={banners[0].imageUrl}
                  alt={banners[0].title || 'Banner'}
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex items-center">
                  <div className="px-4 sm:px-6 lg:px-8 max-w-xl">
                    {banners[0].title && (
                      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                        {banners[0].title}
                      </h1>
                    )}
                    {banners[0].subtitle && (
                      <p className="text-lg sm:text-xl text-white/90 mb-6">
                        {banners[0].subtitle}
                      </p>
                    )}
                    {banners[0].link && (
                      <Link href={banners[0].link}>
                        <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
                          {banners[0].linkText || 'Подробнее'}
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="relative bg-gradient-to-r from-primary-600 to-primary-700 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
            <div className="text-center">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
                Вкусная пицца
                <br />
                <span className="text-primary-200">за 30 минут</span>
              </h1>
              <p className="text-lg sm:text-xl text-primary-100 max-w-2xl mx-auto mb-8">
                Свежие ингредиенты, традиционные рецепты и быстрая доставка
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/menu">
                  <Button size="lg" className="bg-white text-primary-600 hover:bg-primary-50">
                    Заказать сейчас
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Leader Sales - Хиты */}
      {featuredProducts.length > 0 && (
        <section className="py-12 bg-orange-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="text-3xl">🔥</span> Лидеры продаж
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {featuredProducts.slice(0, 5).map((product) => (
                <Link key={product.id} href={`/menu?product=${product.slug}`}>
                  <div className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
                    <div className="relative h-36 bg-gray-200">
                      {product.imageUrl ? (
                        <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <span className="text-3xl">🍕</span>
                        </div>
                      )}
                      <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                        Хит
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-gray-900 text-sm truncate">{product.name}</h3>
                      <p className="text-lg font-bold text-primary-600 mt-1">
                        {product.discountPrice ? Number(product.discountPrice) : Number(product.price)} ₽
                        {product.discountPrice && (
                          <span className="text-xs text-gray-400 line-through ml-1">{Number(product.price)} ₽</span>
                        )}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-6">
              <Link href="/menu?filter=hits">
                <Button variant="outline">Все хиты</Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Discounts - Акции */}
      {discountedProducts.length > 0 && (
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="text-3xl">🏷️</span> Акции и скидки
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {discountedProducts.slice(0, 5).map((product) => (
                <Link key={product.id} href={`/menu?product=${product.slug}`}>
                  <div className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
                    <div className="relative h-36 bg-gray-200">
                      {product.imageUrl ? (
                        <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <span className="text-3xl">🍕</span>
                        </div>
                      )}
                      <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                        -{Math.round((1 - Number(product.discountPrice!) / Number(product.price)) * 100)}%
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-gray-900 text-sm truncate">{product.name}</h3>
                      <p className="text-lg font-bold text-primary-600 mt-1">
                        {Number(product.discountPrice)} ₽
                        <span className="text-xs text-gray-400 line-through ml-1">{Number(product.price)} ₽</span>
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-6">
              <Link href="/menu?filter=sales">
                <Button variant="outline">Все акции</Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Быстрая доставка</h3>
              <p className="text-gray-600 text-sm">За 30 минут или пицца бесплатно</p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Свежие продукты</h3>
              <p className="text-gray-600 text-sm">Только качественные ингредиенты</p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Вкусно</h3>
              <p className="text-gray-600 text-sm">По итальянским рецептам</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Готовы заказать?
          </h2>
          <Link href="/menu">
            <Button size="lg">
              Перейти в меню
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
