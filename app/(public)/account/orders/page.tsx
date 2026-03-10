'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface OrderItem {
  id: string;
  quantity: number;
  price: string;
  product: {
    name: string;
    imageUrl: string | null;
  };
}

interface Order {
  id: string;
  status: string;
  totalPrice: string;
  deliveryPrice: string;
  createdAt: string;
  orderItems: OrderItem[];
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Новый',
  CONFIRMED: 'Подтверждён',
  PREPARING: 'Готовится',
  READY: 'Готов',
  DELIVERING: 'В доставке',
  DELIVERED: 'Доставлен',
  CANCELLED: 'Отменён',
};

export default function UserOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const response = await fetch('/api/orders');
      if (response.ok) {
        const data = await response.json();
        setOrders(data.data || []);
      } else if (response.status === 401) {
        setIsAuthenticated(false);
      }
    } catch (err) {
      setError('Не удалось загрузить заказы');
    } finally {
      setLoading(false);
    }
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        setIsAuthenticated(true);
        fetchOrders();
      } else {
        setIsAuthenticated(false);
        setLoading(false);
      }
    } catch {
      setIsAuthenticated(false);
      setLoading(false);
    }
  }, [fetchOrders]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      PENDING: 'warning',
      CONFIRMED: 'info',
      PREPARING: 'info',
      READY: 'info',
      DELIVERING: 'default',
      DELIVERED: 'success',
      CANCELLED: 'danger',
    };
    return <Badge variant={variants[status] || 'default'}>{STATUS_LABELS[status] || status}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (isAuthenticated === false) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Card>
          <CardContent className="py-12 text-center">
            <h2 className="text-xl font-semibold mb-4">Войдите в аккаунт</h2>
            <p className="text-gray-600 mb-6">Чтобы просмотреть историю заказов, необходимо войти</p>
            <Link href="/login">
              <Button>Войти</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Мои заказы</h1>

      {error && (
        <Card className="mb-6">
          <CardContent className="py-4 text-center text-red-600">{error}</CardContent>
        </Card>
      )}

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <p className="mb-4">У вас пока нет заказов</p>
            <Link href="/menu">
              <Button>Перейти в меню</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="font-mono text-sm text-gray-500">Заказ #{order.id.slice(0, 8)}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleString('ru-RU')}
                    </p>
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                <div className="border-t pt-4">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {order.orderItems.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                        {item.product.imageUrl && (
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                        )}
                        <div>
                          <p className="text-sm font-medium">{item.product.name}</p>
                          <p className="text-xs text-gray-500">{item.quantity} x {Number(item.price)} ₽</p>
                        </div>
                      </div>
                    ))}
                    {order.orderItems.length > 3 && (
                      <div className="flex items-center bg-gray-50 rounded-lg p-2 text-sm text-gray-500">
                        +{order.orderItems.length - 3} ещё
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-lg font-bold">
                    Итого: {Number(order.totalPrice)} ₽
                  </div>
                  <Button variant="secondary" size="sm">
                    Подробнее
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
