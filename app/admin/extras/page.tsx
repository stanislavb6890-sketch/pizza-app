'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Extra {
  id: string;
  name: string;
  slug: string;
  price: string;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  product: {
    id: string;
    name: string;
    slug: string;
  };
}

export default function AdminExtras() {
  const [extras, setExtras] = useState<Extra[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    name: '',
    price: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchExtras();
    fetchProducts();
  }, []);

  const fetchExtras = async () => {
    try {
      const response = await fetch('/api/admin/extras');
      if (response.ok) {
        const data = await response.json();
        setExtras(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch extras:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/admin/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const transliterate = (text: string): string => {
    const ru: Record<string, string> = {
      а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh',
      з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
      п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c',
      ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
    };
    return text.toLowerCase().split('').map(char => ru[char] || char).join('').replace(/[^a-z0-9]/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId || !formData.name || !formData.price) return;

    setSaving(true);
    try {
      const slug = transliterate(formData.name);
      const response = await fetch('/api/admin/extras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: formData.productId,
          name: formData.name,
          slug,
          price: parseFloat(formData.price),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setExtras([...extras, data.data]);
        setFormData({ productId: '', name: '', price: '' });
        setShowForm(false);
      }
    } catch (error) {
      console.error('Failed to create extra:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (extra: Extra) => {
    try {
      const response = await fetch(`/api/admin/extras/${extra.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !extra.isActive }),
      });

      if (response.ok) {
        setExtras(extras.map(e => 
          e.id === extra.id ? { ...e, isActive: !e.isActive } : e
        ));
      }
    } catch (error) {
      console.error('Failed to toggle extra:', error);
    }
  };

  const handleDelete = async (extraId: string) => {
    if (!confirm('Удалить этот доп?')) return;

    try {
      const response = await fetch(`/api/admin/extras/${extraId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setExtras(extras.filter(e => e.id !== extraId));
      }
    } catch (error) {
      console.error('Failed to delete extra:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const groupedExtras = extras.reduce((acc, extra) => {
    const productName = extra.product.name;
    if (!acc[productName]) {
      acc[productName] = [];
    }
    acc[productName].push(extra);
    return acc;
  }, {} as Record<string, Extra[]>);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Управление допами</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Отмена' : 'Добавить доп'}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Товар</label>
                <select
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  required
                >
                  <option value="">Выберите товар</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Название</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Например: Сыр моцарелла"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Цена (₽)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0"
                  required
                />
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? 'Сохранение...' : 'Создать'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {extras.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            Допы не найдены. Создайте товары и добавьте к ним допы.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedExtras).map(([productName, productExtras]) => (
            <Card key={productName}>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4">{productName}</h3>
                <div className="space-y-2">
                  {productExtras.map((extra) => (
                    <div
                      key={extra.id}
                      className={`flex justify-between items-center p-4 rounded-lg border ${
                        extra.isActive ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium">{extra.name}</p>
                          <p className="text-sm text-gray-500">
                            +{Number(extra.price)} ₽
                            {extra.isDefault && (
                              <Badge variant="info" className="ml-2">По умолчанию</Badge>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleActive(extra)}
                          className={`px-3 py-1 rounded text-sm ${
                            extra.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {extra.isActive ? 'Активен' : 'Неактивен'}
                        </button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(extra.id)}
                        >
                          Удалить
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
