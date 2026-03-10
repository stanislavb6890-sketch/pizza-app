'use client';

import { useState, useEffect } from 'react';
import { Cart } from '@/components/features/cart';

interface CartItem {
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  imageUrl?: string | null;
  extras?: Array<{
    id: string;
    name: string;
    price: number;
  }>;
}

interface CartData {
  items: CartItem[];
  totalQuantity: number;
  totalPrice: number;
}

function generateUniqueKey(item: CartItem): string {
  const extrasStr = (item.extras || [])
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(e => e.id)
    .join(',');
  return `${item.productId}:${extrasStr}`;
}

export default function CartPage() {
  const [cartData, setCartData] = useState<CartData>({ items: [], totalQuantity: 0, totalPrice: 0 });
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    try {
      const response = await fetch('/api/cart');
      if (response.ok) {
        const data = await response.json();
        setCartData(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const updateQuantity = async (uniqueKey: string, quantity: number) => {
    try {
      const response = await fetch(`/api/cart/items/${encodeURIComponent(uniqueKey)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });

      if (response.ok) {
        const data = await response.json();
        setCartData(data.data);
      }
    } catch (error) {
      console.error('Failed to update quantity:', error);
    }
  };

  const removeItem = async (uniqueKey: string) => {
    try {
      const response = await fetch(`/api/cart/items/${encodeURIComponent(uniqueKey)}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        setCartData(data.data);
      }
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  const clearCart = async () => {
    try {
      await fetch('/api/cart/clear', { method: 'POST' });
      setCartData({ items: [], totalQuantity: 0, totalPrice: 0 });
    } catch (error) {
      console.error('Failed to clear cart:', error);
    }
  };

  const itemsWithKeys = cartData.items.map(item => ({
    ...item,
    uniqueKey: generateUniqueKey(item),
  }));

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Cart
        items={itemsWithKeys}
        onUpdateQuantity={updateQuantity}
        onRemove={removeItem}
        onClear={clearCart}
      />
    </div>
  );
}
