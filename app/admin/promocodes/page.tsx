'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PromoCode {
  id: string;
  code: string;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: string;
  minOrderAmount: string | null;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  validFrom: string | null;
  validUntil: string | null;
}

export default function AdminPromoCodes() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'PERCENT' as 'PERCENT' | 'FIXED',
    discountValue: '',
    minOrderAmount: '',
    maxUses: '',
    validFrom: '',
    validUntil: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const fetchPromoCodes = async () => {
    try {
      const response = await fetch('/api/admin/promocodes');
      if (response.ok) {
        const data = await response.json();
        setPromoCodes(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch promo codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch('/api/admin/promocodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          discountValue: parseFloat(formData.discountValue),
          minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : undefined,
          maxUses: formData.maxUses ? parseInt(formData.maxUses) : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPromoCodes([...promoCodes, data.data]);
        setFormData({
          code: '',
          discountType: 'PERCENT',
          discountValue: '',
          minOrderAmount: '',
          maxUses: '',
          validFrom: '',
          validUntil: '',
        });
        setShowForm(false);
      }
    } catch (error) {
      console.error('Failed to create promo code:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (promoCode: PromoCode) => {
    try {
      await fetch(`/api/admin/promocodes/${promoCode.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !promoCode.isActive }),
      });
      setPromoCodes(promoCodes.map(p => 
        p.id === promoCode.id ? { ...p, isActive: !p.isActive } : p
      ));
    } catch (error) {
      console.error('Failed to toggle promo code:', error);
    }
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Промокоды</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Отмена' : 'Добавить промокод'}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Код</label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="SAVE10"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Тип скидки</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'PERCENT' | 'FIXED' })}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="PERCENT">Процент (%)</option>
                    <option value="FIXED">Фиксированная (₽)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {formData.discountType === 'PERCENT' ? 'Процент скидки' : 'Сумма скидки (₽)'}
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    placeholder={formData.discountType === 'PERCENT' ? '10' : '100'}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Мин. сумма заказа (₽)</label>
                  <Input
                    type="number"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                    placeholder="500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Макс. использований</label>
                  <Input
                    type="number"
                    value={formData.maxUses}
                    onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Действителен с</label>
                  <Input
                    type="datetime-local"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Действителен до</label>
                  <Input
                    type="datetime-local"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  />
                </div>
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? 'Сохранение...' : 'Создать'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {promoCodes.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            Промокоды не найдены
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Код</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Скидка</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Мин. заказ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Использовано</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {promoCodes.map((promo) => (
                <tr key={promo.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-mono font-medium">{promo.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {promo.discountType === 'PERCENT' 
                      ? `${promo.discountValue}%` 
                      : `${promo.discountValue} ₽`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {promo.minOrderAmount ? `${promo.minOrderAmount} ₽` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {promo.usedCount}{promo.maxUses ? ` / ${promo.maxUses}` : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs ${promo.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {promo.isActive ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleActive(promo)}
                      className="text-primary-600 hover:underline text-sm"
                    >
                      {promo.isActive ? 'Деактивировать' : 'Активировать'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
