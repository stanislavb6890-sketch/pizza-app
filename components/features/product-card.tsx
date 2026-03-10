'use client';

import Image from 'next/image';
import { Card, CardImage, CardContent, CardTitle, CardPrice, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
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
  imageUrl,
  price,
  discountPrice,
  isAvailable,
  isFeatured,
  onAddToCart,
}: ProductCardProps) {
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
            -{Math.round((1 - discountPrice / price) * 100)}%
          </Badge>
        )}
      </div>
      
      <CardContent className="flex-1 flex flex-col">
        <CardTitle className="text-base sm:text-lg">{name}</CardTitle>
        
        {description && (
          <CardDescription className="mt-1 line-clamp-2 flex-1">
            {description}
          </CardDescription>
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
