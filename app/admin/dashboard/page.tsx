'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Stats {
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
  });
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
    fetchStats();
  }, []);

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm font-medium text-gray-500">Всего заказов</div>
            <div className="text-3xl font-bold mt-1">{stats.totalOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="text-sm font-medium text-gray-500">Товаров</div>
            <div className="text-3xl font-bold mt-1">{stats.totalProducts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="text-sm font-medium text-gray-500">Пользователей</div>
            <div className="text-3xl font-bold mt-1">{stats.totalUsers}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-4">
            <CardTitle>Быстрые действия</CardTitle>
            <div className="mt-4 space-y-2">
              <a
                href="/admin/products"
                className="block p-3 rounded-md bg-gray-50 hover:bg-gray-100 text-gray-700"
              >
                + Добавить товар
              </a>
              <a
                href="/admin/orders"
                className="block p-3 rounded-md bg-gray-50 hover:bg-gray-100 text-gray-700"
              >
                Просмотреть заказы
              </a>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <CardTitle>Статусы заказов</CardTitle>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="default">PENDING</Badge>
              <Badge variant="info">CONFIRMED</Badge>
              <Badge variant="warning">PREPARING</Badge>
              <Badge variant="info">READY</Badge>
              <Badge variant="default">DELIVERING</Badge>
              <Badge variant="success">DELIVERED</Badge>
              <Badge variant="danger">CANCELLED</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
