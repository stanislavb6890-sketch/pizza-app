'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SubCategory {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
  subCategories: SubCategory[];
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showSubForm, setShowSubForm] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    imageUrl: '',
    sortOrder: 0,
    isActive: true,
  });
  const [subFormData, setSubFormData] = useState({
    categoryId: '',
    name: '',
    slug: '',
    description: '',
    sortOrder: 0,
    isActive: true,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData({ ...formData, name, slug: generateSlug(name) });
  };

  const handleSubNameChange = (name: string) => {
    setSubFormData({ ...subFormData, name, slug: generateSlug(name) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newCategory = await response.json();
        setCategories([...categories, newCategory.data]);
        setShowForm(false);
        setFormData({
          name: '',
          slug: '',
          description: '',
          imageUrl: '',
          sortOrder: 0,
          isActive: true,
        });
      } else {
        const error = await response.json();
        alert(error.message || 'Ошибка при создании категории');
      }
    } catch (error) {
      console.error('Failed to create category:', error);
      alert('Ошибка при создании категории');
    } finally {
      setSaving(false);
    }
  };

  const handleSubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/admin/subcategories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subFormData),
      });

      if (response.ok) {
        await fetchCategories();
        setShowSubForm(false);
        setSubFormData({
          categoryId: '',
          name: '',
          slug: '',
          description: '',
          sortOrder: 0,
          isActive: true,
        });
      } else {
        const error = await response.json();
        alert(error.message || 'Ошибка при создании подкатегории');
      }
    } catch (error) {
      console.error('Failed to create subcategory:', error);
      alert('Ошибка при создании подкатегории');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить категорию?')) return;

    try {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCategories(categories.filter((c) => c.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  const handleDeleteSubCategory = async (subId: string, categoryId: string) => {
    if (!confirm('Вы уверены, что хотите удалить подкатегорию?')) return;

    try {
      const response = await fetch(`/api/admin/subcategories/${subId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchCategories();
      }
    } catch (error) {
      console.error('Failed to delete subcategory:', error);
    }
  };

  const openSubForm = (categoryId: string) => {
    setSubFormData({ ...subFormData, categoryId });
    setShowSubForm(true);
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
        <h1 className="text-2xl font-bold text-gray-900">Управление категориями</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setSubFormData({ ...subFormData, categoryId: '' }); setShowSubForm(true); }}>
            Добавить подкатегорию
          </Button>
          <Button onClick={() => setShowForm(true)}>Добавить категорию</Button>
        </div>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Название *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Описание</Label>
                <textarea
                  id="description"
                  className="w-full border rounded-md px-3 py-2"
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="imageUrl">URL изображения</Label>
                  <Input
                    id="imageUrl"
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label htmlFor="sortOrder">Сортировка</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    id="isActive"
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="isActive" className="mb-0">Активна</Label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Отмена
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {showSubForm && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form onSubmit={handleSubSubmit} className="space-y-4">
              <div>
                <Label htmlFor="categoryId">Категория *</Label>
                <select
                  id="categoryId"
                  className="w-full border rounded-md px-3 py-2"
                  value={subFormData.categoryId}
                  onChange={(e) => setSubFormData({ ...subFormData, categoryId: e.target.value })}
                  required
                >
                  <option value="">Выберите категорию</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="subName">Название *</Label>
                  <Input
                    id="subName"
                    value={subFormData.name}
                    onChange={(e) => handleSubNameChange(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="subSlug">Slug *</Label>
                  <Input
                    id="subSlug"
                    value={subFormData.slug}
                    onChange={(e) => setSubFormData({ ...subFormData, slug: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="subSortOrder">Сортировка</Label>
                  <Input
                    id="subSortOrder"
                    type="number"
                    value={subFormData.sortOrder}
                    onChange={(e) => setSubFormData({ ...subFormData, sortOrder: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    id="subIsActive"
                    type="checkbox"
                    checked={subFormData.isActive}
                    onChange={(e) => setSubFormData({ ...subFormData, isActive: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="subIsActive" className="mb-0">Активна</Label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowSubForm(false)}>
                  Отмена
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {categories.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            Категории не найдены
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {categories.map((category) => (
            <Card key={category.id}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{category.name}</h3>
                      <span className={`px-2 text-xs rounded-full ${category.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {category.isActive ? 'Активна' : 'Неактивна'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">/{category.slug}</p>
                    {category.description && (
                      <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openSubForm(category.id)}>
                      + Подкатегория
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteCategory(category.id)}>
                      Удалить
                    </Button>
                  </div>
                </div>

                {category.subCategories && category.subCategories.length > 0 && (
                  <div className="mt-4 pl-4 border-l-2 border-gray-200">
                    <p className="text-sm font-medium text-gray-500 mb-2">Подкатегории:</p>
                    <div className="flex flex-wrap gap-2">
                      {category.subCategories.map((sub) => (
                        <div key={sub.id} className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded">
                          <span className="text-sm">{sub.name}</span>
                          <span className={`text-xs ${sub.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                            ({sub.isActive ? 'акт' : 'неакт'})
                          </span>
                          <button
                            onClick={() => handleDeleteSubCategory(sub.id, category.id)}
                            className="text-red-500 text-xs hover:underline"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
