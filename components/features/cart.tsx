'use client';

import { CartItemComponent } from '@/components/features/cart-item';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface CartItem {
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  imageUrl?: string | null;
}

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  onClear?: () => void;
}

export function Cart({ items, onUpdateQuantity, onRemove, onClear }: CartProps) {
  const router = useRouter();
  
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.productPrice * item.quantity, 0);

  const handleCheckout = () => {
    router.push('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">Корзина пуста</h3>
        <p className="mt-1 text-sm text-gray-500">
          Добавьте товары из меню, чтобы оформить заказ
        </p>
        <div className="mt-6">
          <Button onClick={() => router.push('/menu')}>
            Перейти в меню
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Cart Items */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Корзина ({totalQuantity} {totalQuantity === 1 ? 'товар' : totalQuantity < 5 ? 'товара' : 'товаров'})
          </h2>
          
          <div className="divide-y">
            {items.map((item) => (
              <CartItemComponent
                key={item.productId}
                productId={item.productId}
                productName={item.productName}
                productPrice={item.productPrice}
                quantity={item.quantity}
                imageUrl={item.imageUrl}
                onUpdateQuantity={onUpdateQuantity}
                onRemove={onRemove}
              />
            ))}
          </div>

          {onClear && (
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" onClick={onClear} size="sm">
                Очистить корзину
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Order Summary */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 sticky top-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ваш заказ</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Товары ({totalQuantity} шт.)</span>
              <span>{totalPrice} ₽</span>
            </div>
            
            <div className="flex justify-between text-sm text-gray-600">
              <span>Доставка</span>
              <span className="text-green-600">Бесплатно</span>
            </div>
            
            <div className="border-t pt-3 flex justify-between text-base font-semibold text-gray-900">
              <span>Итого</span>
              <span>{totalPrice} ₽</span>
            </div>
          </div>

          <Button 
            onClick={handleCheckout} 
            className="w-full mt-4" 
            size="lg"
          >
            Оформить заказ
          </Button>

          <Button 
            variant="outline" 
            onClick={() => router.push('/menu')} 
            className="w-full mt-2"
          >
            Продолжить покупки
          </Button>
        </div>
      </div>
    </div>
  );
}
