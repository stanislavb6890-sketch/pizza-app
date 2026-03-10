'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

interface Address {
  id: string;
  street: string;
  building: string;
  apartment?: string;
  entrance?: string;
  floor?: string;
  comment?: string;
  isDefault: boolean;
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    street: '',
    building: '',
    apartment: '',
    entrance: '',
    floor: '',
    comment: '',
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const response = await fetch('/api/addresses');
      if (response.ok) {
        const data = await response.json();
        setAddresses(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingId ? `/api/addresses/${editingId}` : '/api/addresses';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchAddresses();
        resetForm();
      } else {
        const data = await response.json();
        alert(data.message || 'Ошибка сохранения');
      }
    } catch (error) {
      console.error('Failed to save address:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить адрес?')) return;

    try {
      const response = await fetch(`/api/addresses/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setAddresses(addresses.filter(a => a.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete address:', error);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const response = await fetch(`/api/addresses/${id}/default`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchAddresses();
      }
    } catch (error) {
      console.error('Failed to set default:', error);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      street: '',
      building: '',
      apartment: '',
      entrance: '',
      floor: '',
      comment: '',
    });
  };

  const startEdit = (address: Address) => {
    setEditingId(address.id);
    setFormData({
      street: address.street,
      building: address.building,
      apartment: address.apartment || '',
      entrance: address.entrance || '',
      floor: address.floor || '',
      comment: address.comment || '',
    });
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Мои адреса</h2>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>Добавить адрес</Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Input
                    label="Улица *"
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    placeholder="ул. Примерная"
                    required
                  />
                </div>
                <Input
                  label="Дом *"
                  value={formData.building}
                  onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                  placeholder="10"
                  required
                />
                <Input
                  label="Квартира"
                  value={formData.apartment}
                  onChange={(e) => setFormData({ ...formData, apartment: e.target.value })}
                  placeholder="42"
                />
                <Input
                  label="Подъезд"
                  value={formData.entrance}
                  onChange={(e) => setFormData({ ...formData, entrance: e.target.value })}
                  placeholder="1"
                />
                <Input
                  label="Этаж"
                  value={formData.floor}
                  onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                  placeholder="5"
                />
                <div className="md:col-span-2">
                  <Input
                    label="Комментарий"
                    value={formData.comment}
                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                    placeholder="Код домофона, где встретить и т.д."
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <Button type="submit">{editingId ? 'Сохранить' : 'Добавить'}</Button>
                <Button type="button" variant="outline" onClick={resetForm}>Отмена</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {addresses.length === 0 && !showForm ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          <p className="mt-2 text-gray-600">У вас пока нет сохранённых адресов</p>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((address) => (
            <Card key={address.id}>
              <CardContent className="pt-6 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      ул. {address.street}, д. {address.building}
                      {address.apartment && `, кв. ${address.apartment}`}
                    </p>
                    {address.isDefault && (
                      <span className="text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded">
                        Основной
                      </span>
                    )}
                  </div>
                  {(address.entrance || address.floor) && (
                    <p className="text-sm text-gray-500 mt-1">
                      Подъезд {address.entrance || '-'}, этаж {address.floor || '-'}
                    </p>
                  )}
                  {address.comment && (
                    <p className="text-sm text-gray-500 mt-1">{address.comment}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {!address.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(address.id)}
                    >
                      По умолчанию
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEdit(address)}
                  >
                    Изменить
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => handleDelete(address.id)}
                  >
                    Удалить
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