'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Stats {
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  totalRevenue: number;
  pendingOrders: number;
  todayOrders: number;
}

interface RecentOrder {
  id: string;
  status: string;
  totalPrice: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    todayOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/admin/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    }

    async function fetchRecentOrders() {
      try {
        const response = await fetch('/api/admin/orders');
        if (response.ok) {
          const data = await response.json();
          setRecentOrders(data.data?.slice(0, 5) || []);
        }
      } catch (error) {
        console.error('Failed to fetch recent orders:', error);
      }
    }

    fetchStats();
    fetchRecentOrders();
  }, []);

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
    const labels: Record<string, string> = {
      PENDING: 'Новый',
      CONFIRMED: 'Подтверждён',
      PREPARING: 'Готовится',
      READY: 'Готов',
      DELIVERING: 'В доставке',
      DELIVERED: 'Доставлен',
      CANCELLED: 'Отменён',
    };
    return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Панель управления</h1>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm font-medium text-gray-500">Всего заказов</div>
            <div className="text-3xl font-bold mt-1">{stats.totalOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="text-sm font-medium text-gray-500">Выручка</div>
            <div className="text-3xl font-bold mt-1">{Number(stats.totalRevenue || 0).toLocaleString()} ₽</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="text-sm font-medium text-gray-500">Новые заказы</div>
            <div className="text-3xl font-bold mt-1 text-yellow-600">{stats.pendingOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="text-sm font-medium text-gray-500">Сегодня</div>
            <div className="text-3xl font-bold mt-1">{stats.todayOrders}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <Card className="lg:col-span-2">
          <CardContent className="pt-4">
            <CardTitle className="mb-4">Последние заказы</CardTitle>
            {recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-mono text-sm text-gray-500">#{order.id.slice(0, 8)}</p>
                      <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString('ru-RU')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{Number(order.totalPrice)} ₽</p>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Заказов пока нет</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardContent className="pt-4">
            <CardTitle className="mb-4">Управление</CardTitle>
            <div className="space-y-2">
              <a
                href="/admin/products"
                className="block p-3 rounded-md bg-gray-50 hover:bg-gray-100 text-gray-700"
              >
                📦 Товары ({stats.totalProducts})
              </a>
              <a
                href="/admin/orders"
                className="block p-3 rounded-md bg-gray-50 hover:bg-gray-100 text-gray-700"
              >
                📋 Заказы
              </a>
              <a
                href="/admin/categories"
                className="block p-3 rounded-md bg-gray-50 hover:bg-gray-100 text-gray-700"
              >
                📂 Категории
              </a>
              <a
                href="/admin/extras"
                className="block p-3 rounded-md bg-gray-50 hover:bg-gray-100 text-gray-700"
              >
                ➕ Допы
              </a>
              <a
                href="/admin/promocodes"
                className="block p-3 rounded-md bg-gray-50 hover:bg-gray-100 text-gray-700"
              >
                🎟 Промокоды
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
