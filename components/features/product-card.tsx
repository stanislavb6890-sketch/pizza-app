'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardImage, CardContent, CardTitle, CardPrice, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  composition?: string | null;
  imageUrl?: string | null;
  price: number;
  discountPrice?: number | null;
  isAvailable: boolean;
  isFeatured?: boolean;
  onAddToCart: (productId: string, name: string, price: number) => void;
}

export function ProductCard({
  id,
  name,
  description,
  composition,
  imageUrl,
  price,
  discountPrice,
  isAvailable,
  isFeatured,
  onAddToCart,
}: ProductCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    checkFavorite();
  }, [id]);

  const checkFavorite = async () => {
    try {
      const response = await fetch('/api/favorites');
      if (response.ok) {
        const data = await response.json();
        const favorites = data.data || [];
        setIsFavorite(favorites.some((p: { id: string }) => p.id === id));
      }
    } catch {
      // Not logged in or error
    }
  };

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoriteLoading(true);
    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: id }),
      });
      const data = await response.json();
      if (response.ok) {
        setIsFavorite(data.data.favorited);
      } else if (data.error === 'SESSION_EXPIRED') {
        alert('Сессия истекла. Войдите снова.');
      } else {
        alert(data.message || 'Войдите, чтобы добавить в избранное');
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      alert('Ошибка при добавлении в избранное');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const hasDiscount = discountPrice && Number(discountPrice) < price;
  const displayPrice = hasDiscount ? Number(discountPrice) : Number(price);

  const handleAddToCart = () => {
    onAddToCart(id, name, displayPrice);
  };

  return (
    <Card className="h-full flex flex-col transition-shadow hover:shadow-lg">
      <div className="relative">
        <CardImage 
          src={imageUrl || ''} 
          alt={name}
          className="h-48 sm:h-56"
        />
        {isFeatured && (
          <Badge variant="info" className="absolute top-2 left-2">
            Хит
          </Badge>
        )}
        {!isAvailable && (
          <Badge variant="danger" className="absolute top-2 right-2">
            Нет в наличии
          </Badge>
        )}
        {hasDiscount && isAvailable && (
          <Badge variant="success" className="absolute top-2 right-2">
            -{Math.round((1 - Number(discountPrice) / Number(price)) * 100)}%
          </Badge>
        )}
        <button
          type="button"
          onClick={handleFavorite}
          className={`absolute bottom-2 right-2 p-2 rounded-full bg-white shadow-md hover:bg-gray-50 transition-colors ${favoriteLoading ? 'opacity-50' : ''}`}
        >
          <svg
            className={`w-5 h-5 ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-400'}`}
            fill={isFavorite ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>
      
      <CardContent className="flex-1 flex flex-col">
        <CardTitle className="text-base sm:text-lg">{name}</CardTitle>
        
        {description && (
          <CardDescription className="mt-1 line-clamp-2 flex-1">
            {description}
          </CardDescription>
        )}

        {composition && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-1">
            Состав: {composition}
          </p>
        )}
        
        <div className="mt-4 flex items-center justify-between">
          <CardPrice price={price} discountPrice={discountPrice || undefined} />
          
          <Button
            onClick={handleAddToCart}
            disabled={!isAvailable}
            size="sm"
            variant={isAvailable ? 'secondary' : 'secondary'}
          >
            {!isAvailable ? 'Нет' : 'Подробнее'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
