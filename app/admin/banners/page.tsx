'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

interface Banner {
  id: string;
  title: string | null;
  subtitle: string | null;
  imageUrl: string;
  link: string | null;
  linkText: string | null;
  isActive: boolean;
  sortOrder: number;
}

export default function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    imageUrl: '',
    link: '',
    linkText: '',
    isActive: true,
    sortOrder: 0,
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const response = await fetch('/api/admin/banners');
      if (response.ok) {
        const data = await response.json();
        setBanners(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingBanner ? `/api/admin/banners/${editingBanner.id}` : '/api/admin/banners';
      const method = editingBanner ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchBanners();
        resetForm();
      } else {
        const data = await response.json();
        alert(data.message || 'Ошибка сохранения');
      }
    } catch (error) {
      console.error('Failed to save banner:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить банер?')) return;

    try {
      const response = await fetch(`/api/admin/banners/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setBanners(banners.filter(b => b.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete banner:', error);
    }
  };

  const handleToggleActive = async (banner: Banner) => {
    try {
      const response = await fetch(`/api/admin/banners/${banner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !banner.isActive }),
      });

      if (response.ok) {
        fetchBanners();
      }
    } catch (error) {
      console.error('Failed to toggle banner:', error);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingBanner(null);
    setFormData({
      title: '',
      subtitle: '',
      imageUrl: '',
      link: '',
      linkText: '',
      isActive: true,
      sortOrder: 0,
    });
  };

  const startEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      imageUrl: banner.imageUrl,
      link: banner.link || '',
      linkText: banner.linkText || '',
      isActive: banner.isActive,
      sortOrder: banner.sortOrder,
    });
    setShowForm(true);
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Банеры</h1>
        <Button onClick={() => setShowForm(true)}>Добавить банер</Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Заголовок</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Акция на пиццу!"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Подзаголовок</label>
                  <Input
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    placeholder="Скидка 20% при заказе от 1000 ₽"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Изображение баннера *</label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      
                      // Показать локальный preview сразу
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        if (event.target?.result) {
                          setFormData(prev => ({ ...prev, imageUrl: event.target?.result as string }));
                        }
                      };
                      reader.readAsDataURL(file);
                      
                      // Затем загрузить на сервер
                      setUploadingImage(true);
                      try {
                        const uploadFormData = new FormData();
                        uploadFormData.append('file', file);
                        const response = await fetch('/api/upload', {
                          method: 'POST',
                          body: uploadFormData,
                        });
                        if (response.ok) {
                          const data = await response.json();
                          if (data.success && data.data?.url) {
                            setFormData(prev => ({ ...prev, imageUrl: data.data.url }));
                          }
                        }
                      } catch (error) {
                        console.error('Upload failed:', error);
                      } finally {
                        setUploadingImage(false);
                      }
                    }}
                  />
                  {uploadingImage && <span className="text-sm text-gray-500 mt-1 block">Загрузка...</span>}
                  {formData.imageUrl && (
                    <div className="mt-2">
                      <img src={formData.imageUrl} alt="Preview" className="h-20 w-20 object-cover rounded" />
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Рекомендуемый размер: 1920x600px</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ссылка</label>
                  <Input
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    placeholder="/menu"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Текст кнопки</label>
                  <Input
                    value={formData.linkText}
                    onChange={(e) => setFormData({ ...formData, linkText: e.target.value })}
                    placeholder="Заказать"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Сортировка</label>
                  <Input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700">Активен</label>
                </div>
              </div>
              <div className="flex gap-4">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Сохранение...' : editingBanner ? 'Сохранить' : 'Добавить'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>Отмена</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {banners.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <p className="text-gray-500">Банеров пока нет</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {banners.map((banner) => (
            <Card key={banner.id} className={!banner.isActive ? 'opacity-60' : ''}>
              <div className="relative h-40 bg-gray-200">
                <img
                  src={banner.imageUrl}
                  alt={banner.title || 'Banner'}
                  className="w-full h-full object-cover"
                />
                {!banner.isActive && (
                  <div className="absolute top-2 right-2 bg-gray-500 text-white text-xs px-2 py-1 rounded">
                    Неактивен
                  </div>
                )}
              </div>
              <CardContent className="pt-4">
                <h3 className="font-semibold">{banner.title || 'Без заголовка'}</h3>
                <p className="text-sm text-gray-500">{banner.subtitle || 'Без подзаголовка'}</p>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" onClick={() => startEdit(banner)}>Изменить</Button>
                  <Button 
                    size="sm" 
                    variant={banner.isActive ? 'outline' : 'secondary'} 
                    onClick={() => handleToggleActive(banner)}
                  >
                    {banner.isActive ? 'Деактивировать' : 'Активировать'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => handleDelete(banner.id)}
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