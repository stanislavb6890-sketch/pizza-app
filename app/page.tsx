import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Banner {
  id: string;
  title: string | null;
  subtitle: string | null;
  imageUrl: string;
  link: string | null;
  linkText: string | null;
}

interface Product {
  id: string;
  name: string;
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
  const products = await getProducts() as Product[];

  const featuredProducts = products.filter(p => p.isFeatured);
  const discountedProducts = products.filter(p => p.discountPrice && p.discountPrice < p.price);

  return (
    <div>
      {/* Banner Section */}
      {banners.length > 0 ? (
        <section className="relative">
          <div className="max-w-7xl mx-auto">
            {banners[0] && (
              <div className="relative h-[400px] md:h-[500px] lg:h-[600px]">
                <img
                  src={banners[0].imageUrl}
                  alt={banners[0].title || 'Banner'}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center">
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
        /* Hero Section (fallback) */
        <section className="relative bg-gradient-to-r from-primary-600 to-primary-700 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
            <div className="text-center">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
                Горячая пицца
                <br />
                <span className="text-primary-200">за 30 минут</span>
              </h1>
              <p className="text-lg sm:text-xl text-primary-100 max-w-2xl mx-auto mb-8">
                Свежие ингредиенты, традиционные рецепты и быстрая доставка прямо к вашей двери
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/menu">
                  <Button size="lg" className="bg-white text-primary-600 hover:bg-primary-50">
                    Заказать сейчас
                  </Button>
                </Link>
                <Link href="/menu">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-primary-800">
                    Смотреть меню
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Hits & Discounts */}
      {(featuredProducts.length > 0 || discountedProducts.length > 0) && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Hits */}
              {featuredProducts.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <span className="text-3xl">🔥</span> Хиты продаж
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {featuredProducts.slice(0, 4).map((product) => (
                      <Link key={product.id} href="/menu">
                        <div className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
                          <div className="relative h-32 bg-gray-200">
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <span className="text-4xl">🍕</span>
                              </div>
                            )}
                            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                              Хит
                            </div>
                          </div>
                          <div className="p-3">
                            <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                            <p className="text-lg font-bold text-primary-600">
                              {product.discountPrice ? product.discountPrice : product.price} ₽
                              {product.discountPrice && (
                                <span className="text-sm text-gray-400 line-through ml-2">{product.price} ₽</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Discounts */}
              {discountedProducts.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <span className="text-3xl">🏷️</span> Акции
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {discountedProducts.slice(0, 4).map((product) => (
                      <Link key={product.id} href="/menu">
                        <div className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
                          <div className="relative h-32 bg-gray-200">
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <span className="text-4xl">🍕</span>
                              </div>
                            )}
                            <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                              -{Math.round((1 - (product.discountPrice || 0) / product.price) * 100)}%
                            </div>
                          </div>
                          <div className="p-3">
                            <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                            <p className="text-lg font-bold text-primary-600">
                              {product.discountPrice} ₽
                              <span className="text-sm text-gray-400 line-through ml-2">{product.price} ₽</span>
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="text-center mt-8">
              <Link href="/menu">
                <Button size="lg">Смотреть все меню</Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Features / Advantages */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Быстрая доставка</h3>
              <p className="text-gray-600">Доставим за 30 минут или пицца бесплатно</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Свежие продукты</h3>
              <p className="text-gray-600">Используем только качественные ингредиенты</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Сделано с любовью</h3>
              <p className="text-gray-600">Готовим по традиционным итальянским рецептам</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Готовы заказать?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Выберите любимую пиццу и оформите заказ за пару минут
          </p>
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
