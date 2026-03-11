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
  yesterdayOrders: number;
  ordersByStatus: Array<{ status: string; count: number }>;
  ordersByDay: Array<{ date: string; count: number }>;
  topProducts: Array<{ productId: string; name: string; quantity: number }>;
}

interface RecentOrder {
  id: string;
  status: string;
  totalPrice: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: '#f59e0b',
      CONFIRMED: '#3b82f6',
      PREPARING: '#3b82f6',
      READY: '#3b82f6',
      DELIVERING: '#6b7280',
      DELIVERED: '#10b981',
      CANCELLED: '#ef4444',
    };
    return colors[status] || '#6b7280';
  };

  const maxDayCount = stats?.ordersByDay?.reduce((max, d) => Math.max(max, d.count), 0) || 1;

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
            <div className="text-3xl font-bold mt-1">{stats?.totalOrders || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="text-sm font-medium text-gray-500">Выручка</div>
            <div className="text-3xl font-bold mt-1">{Number(stats?.totalRevenue || 0).toLocaleString()} ₽</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="text-sm font-medium text-gray-500">Новые заказы</div>
            <div className="text-3xl font-bold mt-1 text-yellow-600">{stats?.pendingOrders || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="text-sm font-medium text-gray-500">Сегодня</div>
            <div className="text-3xl font-bold mt-1">{stats?.todayOrders || 0}</div>
            <div className={`text-xs mt-1 ${((stats?.todayOrders || 0) >= (stats?.yesterdayOrders || 0)) ? 'text-green-600' : 'text-red-600'}`}>
              {stats?.yesterdayOrders ? `${((stats?.todayOrders || 0) - stats.yesterdayOrders) >= 0 ? '+' : ''}${((stats?.todayOrders || 0) - stats.yesterdayOrders)} вчера` : ''}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Orders by Day Chart */}
        <Card className="lg:col-span-2">
          <CardContent className="pt-4">
            <CardTitle className="mb-4">Заказы за последние 7 дней</CardTitle>
            <div className="flex items-end justify-between gap-2 h-40">
              {stats?.ordersByDay?.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-primary-500 rounded-t transition-all"
                    style={{ height: `${(day.count / maxDayCount) * 100}px`, minHeight: day.count > 0 ? '4px' : '0' }}
                  />
                  <span className="text-xs text-gray-500 mt-2 text-center">{day.date}</span>
                  <span className="text-xs font-medium">{day.count}</span>
                </div>
              ))}
              {(!stats?.ordersByDay || stats.ordersByDay.length === 0) && (
                <p className="text-gray-500 text-center w-full">Нет данных</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Orders by Status */}
        <Card>
          <CardContent className="pt-4">
            <CardTitle className="mb-4">Статусы заказов</CardTitle>
            <div className="space-y-3">
              {stats?.ordersByStatus?.map((s) => (
                <div key={s.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: getStatusColor(s.status) }}
                    />
                    <span className="text-sm text-gray-600">
                      {{
                        PENDING: 'Новые',
                        CONFIRMED: 'Подтверждённые',
                        PREPARING: 'Готовятся',
                        READY: 'Готовы',
                        DELIVERING: 'В доставке',
                        DELIVERED: 'Доставлены',
                        CANCELLED: 'Отменены',
                      }[s.status] || s.status}
                    </span>
                  </div>
                  <span className="font-medium">{s.count}</span>
                </div>
              ))}
              {(!stats?.ordersByStatus || stats.ordersByStatus.length === 0) && (
                <p className="text-gray-500">Нет данных</p>
              )}
            </div>
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

        {/* Top Products */}
        <Card>
          <CardContent className="pt-4">
            <CardTitle className="mb-4">Топ товары</CardTitle>
            <div className="space-y-3">
              {stats?.topProducts?.map((product, i) => (
                <div key={product.productId} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-medium">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.quantity} шт.</p>
                  </div>
                </div>
              ))}
              {(!stats?.topProducts || stats.topProducts.length === 0) && (
                <p className="text-gray-500">Нет данных</p>
              )}
            </div>
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
                📦 Товары ({stats?.totalProducts || 0})
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
              <a
                href="/admin/banners"
                className="block p-3 rounded-md bg-gray-50 hover:bg-gray-100 text-gray-700"
              >
                🖼️ Банеры
              </a>
              <a
                href="/admin/users"
                className="block p-3 rounded-md bg-gray-50 hover:bg-gray-100 text-gray-700"
              >
                👥 Пользователи ({stats?.totalUsers || 0})
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
