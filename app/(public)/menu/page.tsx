'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProductCard } from '@/components/features/product-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  price: number;
  discountPrice?: number | null;
  isAvailable: boolean;
  isFeatured: boolean;
}

interface CartResponse {
  success: boolean;
  data: {
    items: Array<{
      productId: string;
      productName: string;
      productPrice: number;
      quantity: number;
      imageUrl?: string | null;
    }>;
    totalQuantity: number;
    totalPrice: number;
  };
}

export default function MenuPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const addToCart = useCallback(async (productId: string, name: string, price: number) => {
    try {
      const response = await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          productName: name,
          productPrice: price,
          quantity: 1,
        }),
      });

      if (!response.ok) throw new Error('Failed to add to cart');

      setNotification(`${name} добавлен в корзину`);
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      setNotification('Ошибка при добавлении в корзину');
      setTimeout(() => setNotification(null), 3000);
    }
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <Badge variant="danger">Ошибка</Badge>
          <p className="mt-4 text-gray-600">{error}</p>
          <Button onClick={fetchProducts} className="mt-4">
            Попробовать снова
          </Button>
        </div>
      </div>
    );
  }

  const featuredProducts = products.filter((p) => p.isFeatured);
  const regularProducts = products.filter((p) => !p.isFeatured);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Notification */}
      {notification && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in">
          {notification}
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Наше меню</h1>
        <p className="text-gray-600">
          Выберите свою идеальную пиццу из {products.length} вариантов
        </p>
      </div>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Хиты продаж</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                {...product}
                onAddToCart={addToCart}
              />
            ))}
          </div>
        </section>
      )}

      {/* All Products */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Все пиццы</h2>
        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Товары временно отсутствуют</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                {...product}
                onAddToCart={addToCart}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
