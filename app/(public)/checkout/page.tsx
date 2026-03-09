'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CartItem {
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
}

interface CartData {
  items: CartItem[];
  totalQuantity: number;
  totalPrice: number;
}

interface Address {
  street: string;
  building: string;
  apartment: string;
  entrance: string;
  floor: string;
  comment: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cartData, setCartData] = useState<CartData>({ items: [], totalQuantity: 0, totalPrice: 0 });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [address, setAddress] = useState<Address>({
    street: '',
    building: '',
    apartment: '',
    entrance: '',
    floor: '',
    comment: '',
  });

  const fetchCart = async () => {
    try {
      const response = await fetch('/api/cart');
      if (response.ok) {
        const data = await response.json();
        if (data.data.items.length === 0) {
          router.push('/menu');
          return;
        }
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
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newAddress: {
            street: address.street,
            building: address.building,
            apartment: address.apartment,
            entrance: address.entrance,
            floor: address.floor,
            comment: address.comment,
          },
          paymentMethod: 'card' as const,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create order');
      }

      // Redirect to success page with order ID
      router.push(`/checkout/success?orderId=${data.data.orderId}`);
    } catch (error) {
      console.error('Order creation error:', error);
      alert('Ошибка при создании заказа. Попробуйте снова.');
    } finally {
      setIsSubmitting(false);
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Оформление заказа</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Delivery Address */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Адрес доставки</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Улица *"
              value={address.street}
              onChange={(e) => setAddress({ ...address, street: e.target.value })}
              placeholder="ул. Примерная"
              required
            />
            <Input
              label="Дом *"
              value={address.building}
              onChange={(e) => setAddress({ ...address, building: e.target.value })}
              placeholder="1"
              required
            />
            <Input
              label="Квартира"
              value={address.apartment}
              onChange={(e) => setAddress({ ...address, apartment: e.target.value })}
              placeholder="10"
            />
            <Input
              label="Подъезд"
              value={address.entrance}
              onChange={(e) => setAddress({ ...address, entrance: e.target.value })}
              placeholder="1"
            />
            <Input
              label="Этаж"
              value={address.floor}
              onChange={(e) => setAddress({ ...address, floor: e.target.value })}
              placeholder="5"
            />
          </div>
          
          <div className="mt-4">
            <Input
              label="Комментарий к заказу"
              value={address.comment}
              onChange={(e) => setAddress({ ...address, comment: e.target.value })}
              placeholder="Домофон не работает, позвоните заранее"
            />
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Ваш заказ</h2>
          
          <div className="space-y-3 divide-y">
            {cartData.items.map((item) => (
              <div key={item.productId} className="flex justify-between py-2">
                <span className="text-gray-700">
                  {item.productName} x {item.quantity}
                </span>
                <span className="font-medium">{item.productPrice * item.quantity} ₽</span>
              </div>
            ))}
          </div>

          <div className="border-t mt-4 pt-4 space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Товары ({cartData.totalQuantity} шт.)</span>
              <span>{cartData.totalPrice} ₽</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Доставка</span>
              <span className="text-green-600">Бесплатно</span>
            </div>
            <div className="border-t pt-2 flex justify-between text-lg font-semibold text-gray-900">
              <span>Итого</span>
              <span>{cartData.totalPrice} ₽</span>
            </div>
          </div>
        </div>

        {/* Payment Method - Placeholder */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Способ оплаты</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="radio" name="payment" value="card" defaultChecked className="w-4 h-4" />
              <span>Банковской картой онлайн</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="radio" name="payment" value="cash" className="w-4 h-4" />
              <span>Наличными курьеру</span>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="flex-1"
          >
            Назад
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            className="flex-1"
            size="lg"
          >
            {isSubmitting ? 'Создаем заказ...' : `Заказать на ${cartData.totalPrice} ₽`}
          </Button>
        </div>
      </form>
    </div>
  );
}
