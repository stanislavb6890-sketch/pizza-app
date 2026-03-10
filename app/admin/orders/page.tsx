'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface OrderItem {
  id: string;
  quantity: number;
  price: string;
  product: {
    id: string;
    name: string;
    imageUrl: string | null;
  };
}

interface Order {
  id: string;
  status: string;
  totalPrice: string;
  deliveryPrice: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phone: string | null;
  };
  address: {
    street: string;
    building: string;
    apartment: string | null;
  };
  orderItems: OrderItem[];
  deliveryZone: {
    name: string;
  } | null;
}

const STATUSES = [
  { value: 'PENDING', label: 'Новый', color: 'warning' },
  { value: 'CONFIRMED', label: 'Подтверждён', color: 'info' },
  { value: 'PREPARING', label: 'Готовится', color: 'info' },
  { value: 'READY', label: 'Готов', color: 'info' },
  { value: 'DELIVERING', label: 'В доставке', color: 'default' },
  { value: 'DELIVERED', label: 'Доставлен', color: 'success' },
  { value: 'CANCELLED', label: 'Отменён', color: 'danger' },
];

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/admin/orders');
      if (response.ok) {
        const data = await response.json();
        setOrders(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const openOrderModal = async (orderId: string) => {
    setModalLoading(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedOrder(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch order:', error);
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedOrder(null);
  };

  const updateOrderStatus = async (newStatus: string) => {
    if (!selectedOrder) return;
    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedOrder({ ...selectedOrder, status: data.data.status });
        fetchOrders();
      }
    } catch (error) {
      console.error('Failed to update order:', error);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = STATUSES.find(s => s.value === status);
    return <Badge variant={statusInfo?.color as any || 'default'}>{statusInfo?.label || status}</Badge>;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-blue-100 text-blue-800',
      PREPARING: 'bg-blue-100 text-blue-800',
      READY: 'bg-purple-100 text-purple-800',
      DELIVERING: 'bg-gray-100 text-gray-800',
      DELIVERED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Управление заказами</h1>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            Заказы не найдены
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Заказ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Клиент
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Сумма
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Дата
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                    #{order.id.slice(0, 8)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.user.firstName || 'Гость'} {order.user.lastName || ''}
                    <br />
                    <span className="text-gray-500 text-xs">{order.user.phone || order.user.email}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(order.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {Number(order.totalPrice)} ₽
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleString('ru-RU')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Button size="sm" variant="secondary" onClick={() => openOrderModal(order.id)}>
                      Подробнее
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Заказ #{selectedOrder.id.slice(0, 8)}</h2>
                  <p className="text-gray-500">
                    {new Date(selectedOrder.createdAt).toLocaleString('ru-RU')}
                  </p>
                </div>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-2xl">
                  &times;
                </button>
              </div>

              {/* Customer Info */}
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Клиент</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium">
                    {selectedOrder.user.firstName || 'Гость'} {selectedOrder.user.lastName || ''}
                  </p>
                  <p className="text-sm text-gray-600">{selectedOrder.user.email}</p>
                  {selectedOrder.user.phone && (
                    <p className="text-sm text-gray-600">{selectedOrder.user.phone}</p>
                  )}
                </div>
              </div>

              {/* Delivery Address */}
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Адрес доставки</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p>
                    {selectedOrder.address.street}, {selectedOrder.address.building}
                    {selectedOrder.address.apartment && `, кв. ${selectedOrder.address.apartment}`}
                  </p>
                  {selectedOrder.deliveryZone && (
                    <p className="text-sm text-gray-500 mt-1">{selectedOrder.deliveryZone.name}</p>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Состав заказа</h3>
                <div className="border rounded-lg divide-y">
                  {selectedOrder.orderItems.map((item) => (
                    <div key={item.id} className="p-4 flex items-center gap-4">
                      {item.product.imageUrl && (
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-sm text-gray-500">
                          {item.quantity} x {Number(item.price)} ₽
                        </p>
                      </div>
                      <p className="font-medium">{Number(item.price) * item.quantity} ₽</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="mb-6 border-t pt-4">
                <div className="flex justify-between mb-2">
                  <span>Доставка:</span>
                  <span>{Number(selectedOrder.deliveryPrice) > 0 ? `${Number(selectedOrder.deliveryPrice)} ₽` : 'Бесплатно'}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Итого:</span>
                  <span>{Number(selectedOrder.totalPrice)} ₽</span>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Комментарий</h3>
                  <div className="bg-yellow-50 rounded-lg p-4 text-gray-700">
                    {selectedOrder.notes}
                  </div>
                </div>
              )}

              {/* Status Change */}
              <div>
                <h3 className="font-semibold mb-2">Изменить статус</h3>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map((status) => (
                    <button
                      key={status.value}
                      onClick={() => updateOrderStatus(status.value)}
                      disabled={updating || selectedOrder.status === status.value}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedOrder.status === status.value
                          ? getStatusColor(status.value) + ' ring-2 ring-offset-2 ring-gray-400'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
