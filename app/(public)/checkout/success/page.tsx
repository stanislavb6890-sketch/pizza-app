'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    // Get order ID from URL or session
    const params = new URLSearchParams(window.location.search);
    const id = params.get('orderId');
    if (id) {
      setOrderId(id);
    }
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center">
        {/* Success Icon */}
        <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <svg
            className="w-10 h-10 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Заказ оформлен!
        </h1>

        <p className="text-lg text-gray-600 mb-2">
          Спасибо за ваш заказ. Мы уже начали его готовить.
        </p>

        {orderId && (
          <p className="text-sm text-gray-500 mb-6">
            Номер заказа: <span className="font-mono font-medium">{orderId}</span>
          </p>
        )}

        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            Что дальше?
          </h2>
          <ul className="text-sm text-gray-600 space-y-2 text-left">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Подтверждение заказа в течение 5 минут</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Приготовление пиццы: 15-20 минут</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Доставка: 30 минут от подтверждения</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/menu">
            <Button variant="outline">
              Заказать ещё
            </Button>
          </Link>
          <Link href={`/orders${orderId ? `/${orderId}` : ''}`}>
            <Button>
              Отследить заказ
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
