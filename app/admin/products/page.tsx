'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  discountPrice?: number;
  description?: string;
  composition?: string;
  imageUrl?: string;
  weight?: number;
  isAvailable: boolean;
  isFeatured: boolean;
  sortOrder: number;
  subCategory?: {
    id: string;
    name: string;
    slug: string;
  };
  extras?: ProductExtra[];
  createdAt: string;
}

interface ProductExtra {
  id: string;
  name: string;
  slug: string;
  price: number;
  isDefault: boolean;
  isActive: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  subCategories: { id: string; name: string; slug: string }[];
}

function transliterate(text: string): string {
  const ru: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '',
    'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya', ' ': '-'
  };
  return text.toLowerCase().split('').map(c => ru[c] || c.replace(/[^a-z0-9]/g, '')).join('').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [showExtras, setShowExtras] = useState(false);
  const [extras, setExtras] = useState<ProductExtra[]>([]);
  const [newExtra, setNewExtra] = useState({ name: '', price: '' });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    composition: '',
    price: '',
    discountPrice: '',
    weight: '',
    imageUrl: '',
    subCategoryId: '',
    isFeatured: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch('/api/admin/products'),
        fetch('/api/admin/categories'),
      ]);
      if (productsRes.ok) {
        const pData = await productsRes.json();
        setProducts(pData.data || []);
      }
      if (categoriesRes.ok) {
        const cData = await categoriesRes.json();
        setCategories(cData.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return transliterate(name);
  };

  const handleNameChange = (name: string) => {
    setFormData({ ...formData, name, slug: generateSlug(name) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        composition: formData.composition || undefined,
        price: parseFloat(formData.price),
        discountPrice: formData.discountPrice ? parseFloat(formData.discountPrice) : undefined,
        weight: formData.weight ? parseInt(formData.weight) : undefined,
        imageUrl: formData.imageUrl || undefined,
        subCategoryId: formData.subCategoryId || undefined,
        isFeatured: formData.isFeatured,
      };

      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const newProduct = await response.json();
        setProducts([newProduct.data, ...products]);
        setShowForm(false);
        resetForm();
      } else {
        const error = await response.json();
        alert(error.message || 'Ошибка при создании товара');
      }
    } catch (error) {
      console.error('Failed to create product:', error);
      alert('Ошибка при создании товара');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (product: Product) => {
    setEditProduct(product);
    setFormData({
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      composition: product.composition || '',
      price: String(product.price),
      discountPrice: product.discountPrice ? String(product.discountPrice) : '',
      weight: product.weight ? String(product.weight) : '',
      imageUrl: product.imageUrl || '',
      subCategoryId: product.subCategory?.id || '',
      isFeatured: product.isFeatured,
    });
    
    try {
      const res = await fetch(`/api/admin/extras?productId=${product.id}`);
      if (res.ok) {
        const data = await res.json();
        setExtras(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch extras:', error);
      setExtras([]);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProduct) return;
    setSaving(true);

    try {
      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        composition: formData.composition || undefined,
        price: parseFloat(formData.price),
        discountPrice: formData.discountPrice ? parseFloat(formData.discountPrice) : undefined,
        weight: formData.weight ? parseInt(formData.weight) : undefined,
        imageUrl: formData.imageUrl || undefined,
        subCategoryId: formData.subCategoryId || undefined,
        isFeatured: formData.isFeatured,
      };

      const response = await fetch(`/api/admin/products/${editProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const updated = await response.json();
        setProducts(products.map(p => p.id === editProduct.id ? { ...p, ...updated.data } : p));
        setEditProduct(null);
        resetForm();
      } else {
        const error = await response.json();
        alert(error.message || 'Ошибка при обновлении товара');
      }
    } catch (error) {
      console.error('Failed to update product:', error);
      alert('Ошибка при обновлении товара');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить товар?')) return;

    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setProducts(products.filter(p => p.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  const fetchExtras = async (productId: string) => {
    try {
      const res = await fetch(`/api/admin/extras?productId=${productId}`);
      if (res.ok) {
        const data = await res.json();
        setExtras(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch extras:', error);
    }
  };

  const handleAddExtra = async () => {
    if (!editProduct || !newExtra.name || !newExtra.price) return;
    
    try {
      const slug = transliterate(newExtra.name);
      const response = await fetch('/api/admin/extras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: editProduct.id,
          name: newExtra.name,
          slug,
          price: parseFloat(newExtra.price),
        }),
      });

      if (response.ok) {
        const extra = await response.json();
        setExtras([...extras, extra.data]);
        setNewExtra({ name: '', price: '' });
      }
    } catch (error) {
      console.error('Failed to add extra:', error);
    }
  };

  const handleDeleteExtra = async (extraId: string) => {
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

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      composition: '',
      price: '',
      discountPrice: '',
      weight: '',
      imageUrl: '',
      subCategoryId: '',
      isFeatured: false,
    });
    setExtras([]);
  };

  const closeModal = () => {
    setEditProduct(null);
    resetForm();
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
        <h1 className="text-2xl font-bold text-gray-900">Управление товарами</h1>
        <Button onClick={() => setShowForm(true)}>Добавить товар</Button>
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
                  <Label htmlFor="slug">Slug (формируется автоматически)</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Описание</Label>
                <textarea
                  id="description"
                  className="w-full border rounded-md px-3 py-2"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="composition">Состав</Label>
                <textarea
                  id="composition"
                  className="w-full border rounded-md px-3 py-2"
                  rows={2}
                  value={formData.composition}
                  onChange={(e) => setFormData({ ...formData, composition: e.target.value })}
                  placeholder="Например: тесто, сыр моцарелла, томатный соус, пепперони"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="price">Цена *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="discountPrice">Цена со скидкой</Label>
                  <Input
                    id="discountPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.discountPrice}
                    onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="weight">Вес (г)</Label>
                  <Input
                    id="weight"
                    type="number"
                    min="0"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Изображение</Label>
                
                <Input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      if (event.target?.result) {
                        setFormData(prev => ({ ...prev, imageUrl: event.target?.result as string }));
                      }
                    };
                    reader.readAsDataURL(file);
                    
                    setUploadingImage(true);
                    let uploadError = '';
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
                        } else {
                          uploadError = 'Ошибка загрузки';
                        }
                      } else {
                        uploadError = 'Ошибка сервера';
                      }
                    } catch (error) {
                      console.error('Upload failed:', error);
                      uploadError = 'Ошибка загрузки';
                    } finally {
                      setUploadingImage(false);
                      if (uploadError) {
                        alert(uploadError + '. Проверьте права на папку uploads на сервере.');
                      }
                    }
                  }}
                />
                {uploadingImage && <span className="text-sm text-gray-500 mt-1 block">Загрузка...</span>}
                {formData.imageUrl && (
                  <div className="mt-2">
                    <img src={formData.imageUrl} alt="Preview" className="h-20 w-20 object-cover rounded" />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                      className="text-red-500 text-sm mt-1 block"
                    >
                      Удалить
                    </button>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="subCategoryId">Категория</Label>
                <select
                  id="subCategoryId"
                  className="w-full border rounded-md px-3 py-2"
                  value={formData.subCategoryId}
                  onChange={(e) => setFormData({ ...formData, subCategoryId: e.target.value })}
                >
                  <option value="">Без категории</option>
                  {categories.map((cat) =>
                    cat.subCategories.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {cat.name} / {sub.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="isFeatured"
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="isFeatured" className="mb-0">
                  Рекомендуемый товар
                </Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>
                  Отмена
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {products.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            Товары не найдены
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Название
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Цена
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Вес
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Статус
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {product.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.discountPrice ? (
                      <>
                        <span className="text-red-600">{product.discountPrice} ₽</span>
                        <span className="ml-2 line-through text-gray-400">{product.price} ₽</span>
                      </>
                    ) : (
                      `${product.price} ₽`
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.weight ? `${product.weight} г` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.isAvailable
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {product.isAvailable ? 'В наличии' : 'Нет в наличии'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button variant="outline" size="sm" className="mr-2" onClick={() => handleEdit(product)}>
                      Изменить
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDelete(product.id)}>
                      Удалить
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Редактирование товара</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Название *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-slug">Slug</Label>
                  <Input
                    id="edit-slug"
                    value={formData.slug}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-description">Описание</Label>
                <textarea
                  id="edit-description"
                  className="w-full border rounded-md px-3 py-2"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="edit-composition">Состав</Label>
                <textarea
                  id="edit-composition"
                  className="w-full border rounded-md px-3 py-2"
                  rows={2}
                  value={formData.composition}
                  onChange={(e) => setFormData({ ...formData, composition: e.target.value })}
                  placeholder="Например: тесто, сыр моцарелла, томатный соус, пепперони"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-price">Цена *</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-discountPrice">Цена со скидкой</Label>
                  <Input
                    id="edit-discountPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.discountPrice}
                    onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-weight">Вес (г)</Label>
                  <Input
                    id="edit-weight"
                    type="number"
                    min="0"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-imageUrl">URL изображения</Label>
                <Input
                  id="edit-imageUrl"
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label htmlFor="edit-subCategoryId">Категория</Label>
                <select
                  id="edit-subCategoryId"
                  className="w-full border rounded-md px-3 py-2"
                  value={formData.subCategoryId}
                  onChange={(e) => setFormData({ ...formData, subCategoryId: e.target.value })}
                >
                  <option value="">Без категории</option>
                  {categories.map((cat) =>
                    cat.subCategories.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {cat.name} / {sub.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="edit-isFeatured"
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="edit-isFeatured" className="mb-0">
                  Рекомендуемый товар
                </Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </Button>
                <Button type="button" variant="outline" onClick={closeModal}>
                  Отмена
                </Button>
              </div>
            </form>

            <div className="mt-6 border-t pt-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold">Допы (опции)</h3>
                <Button size="sm" onClick={() => setShowExtras(!showExtras)}>
                  {showExtras ? 'Скрыть' : 'Показать'}
                </Button>
              </div>
              
              {showExtras && (
                <>
                  <div className="flex gap-2 mb-3">
                    <Input
                      placeholder="Название допа"
                      value={newExtra.name}
                      onChange={(e) => setNewExtra({ ...newExtra, name: e.target.value })}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Цена"
                      type="number"
                      step="0.01"
                      value={newExtra.price}
                      onChange={(e) => setNewExtra({ ...newExtra, price: e.target.value })}
                      className="w-24"
                    />
                    <Button onClick={handleAddExtra}>Добавить</Button>
                  </div>
                  
                  {extras.length > 0 ? (
                    <div className="space-y-2">
                      {extras.map((extra) => (
                        <div key={extra.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                          <span>{extra.name} - {extra.price} ₽</span>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600"
                            onClick={() => handleDeleteExtra(extra.id)}
                          >
                            Удалить
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">Нет допов</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
