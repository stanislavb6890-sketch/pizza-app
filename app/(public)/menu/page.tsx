'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProductCard } from '@/components/features/product-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  composition?: string | null;
  imageUrl?: string | null;
  price: number;
  discountPrice?: number | null;
  weight?: number | null;
  isAvailable: boolean;
  isFeatured: boolean;
}

interface ProductExtra {
  id: string;
  name: string;
  price: number;
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
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [extras, setExtras] = useState<ProductExtra[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<Record<string, number>>({});
  const [quantity, setQuantity] = useState(1);

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

  const openProductModal = async (product: Product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setSelectedExtras({});
    
    try {
      const res = await fetch(`/api/products/${product.id}/extras`);
      if (res.ok) {
        const data = await res.json();
        setExtras(data.data || []);
      } else {
        setExtras([]);
      }
    } catch {
      setExtras([]);
    }
  };

  const closeModal = () => {
    setSelectedProduct(null);
    setExtras([]);
    setSelectedExtras({});
    setQuantity(1);
  };

  const toggleExtra = (extraId: string) => {
    setSelectedExtras(prev => {
      if (prev[extraId]) {
        const { [extraId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [extraId]: 1 };
    });
  };

  const getTotalPrice = () => {
    if (!selectedProduct) return 0;
    const basePrice = Number(selectedProduct.discountPrice || selectedProduct.price);
    const extrasPrice = Object.keys(selectedExtras).reduce((sum, id) => {
      const extra = extras.find(e => e.id === id);
      return sum + Number(extra?.price || 0);
    }, 0);
    return (basePrice + extrasPrice) * quantity;
  };

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

  const handleAddToCartFromModal = async () => {
    if (!selectedProduct) return;

    const totalPrice = getTotalPrice();
    const extraNames = Object.keys(selectedExtras).map(id => {
      const extra = extras.find(e => e.id === id);
      return extra?.name;
    }).filter(Boolean);

    try {
      const response = await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          productName: selectedProduct.name + (extraNames.length ? ` (${extraNames.join(', ')})` : ''),
          productPrice: totalPrice,
          quantity: quantity,
        }),
      });

      if (!response.ok) throw new Error('Failed to add to cart');

      setNotification(`${selectedProduct.name} добавлен в корзину`);
      setTimeout(() => setNotification(null), 3000);
      closeModal();
    } catch (err) {
      setNotification('Ошибка при добавлении в корзину');
      setTimeout(() => setNotification(null), 3000);
    }
  };

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
                onAddToCart={() => openProductModal(product)}
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
                onAddToCart={() => openProductModal(product)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Product Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Product Image */}
            {selectedProduct.imageUrl && (
              <div className="relative h-64 w-full">
                <img 
                  src={selectedProduct.imageUrl} 
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover rounded-t-lg"
                />
                <button 
                  onClick={closeModal}
                  className="absolute top-2 right-2 bg-white rounded-full p-2 shadow"
                >
                  ✕
                </button>
              </div>
            )}
            
            <div className="p-6">
              {/* Title and Price */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold">{selectedProduct.name}</h2>
                  {selectedProduct.weight && (
                    <p className="text-gray-500">{selectedProduct.weight} г</p>
                  )}
                </div>
                <div className="text-right">
                  {selectedProduct.discountPrice ? (
                    <>
                      <p className="text-2xl font-bold text-red-600">{selectedProduct.discountPrice} ₽</p>
                      <p className="text-gray-400 line-through">{selectedProduct.price} ₽</p>
                    </>
                  ) : (
                    <p className="text-2xl font-bold">{selectedProduct.price} ₽</p>
                  )}
                </div>
              </div>

              {/* Description */}
              {selectedProduct.description && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-1">Описание</h3>
                  <p className="text-gray-600 text-sm">{selectedProduct.description}</p>
                </div>
              )}

              {/* Composition */}
              {selectedProduct.composition && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-1">Состав</h3>
                  <p className="text-gray-600 text-sm">{selectedProduct.composition}</p>
                </div>
              )}

              {/* Extras */}
              {extras.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Допы</h3>
                  <div className="space-y-2">
                    {extras.map((extra) => (
                      <div 
                        key={extra.id}
                        className={`flex justify-between items-center p-3 rounded-lg border cursor-pointer ${
                          selectedExtras[extra.id] ? 'border-green-500 bg-green-50' : 'border-gray-200'
                        }`}
                        onClick={() => toggleExtra(extra.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                            selectedExtras[extra.id] ? 'bg-green-500 border-green-500' : 'border-gray-300'
                          }`}>
                            {selectedExtras[extra.id] && <span className="text-white text-sm">✓</span>}
                          </div>
                          <span>{extra.name}</span>
                        </div>
                        <span className="font-medium">+{extra.price} ₽</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Количество</h3>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-full border flex items-center justify-center text-xl"
                  >
                    -
                  </button>
                  <span className="text-xl font-medium w-8 text-center">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-full border flex items-center justify-center text-xl"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Total and Add to Cart */}
              <div className="flex justify-between items-center pt-4 border-t">
                <div>
                  <p className="text-gray-500 text-sm">Итого</p>
                  <p className="text-2xl font-bold">{getTotalPrice()} ₽</p>
                </div>
                <Button onClick={handleAddToCartFromModal} className="px-8">
                  В корзину
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
