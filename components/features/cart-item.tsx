'use client';

import Image from 'next/image';
import { QuantityControl } from '@/components/features/quantity-control';
import { Button } from '@/components/ui/button';

interface CartItemProps {
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  imageUrl?: string | null;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

export function CartItemComponent({
  productId,
  productName,
  productPrice,
  quantity,
  imageUrl,
  onUpdateQuantity,
  onRemove,
}: CartItemProps) {
  const totalPrice = productPrice * quantity;

  const handleQuantityChange = (newQuantity: number) => {
    onUpdateQuantity(productId, newQuantity);
  };

  const handleRemove = () => {
    onRemove(productId);
  };

  return (
    <div className="flex gap-4 py-4 border-b last:border-b-0">
      <div className="relative w-20 h-20 flex-shrink-0 bg-gray-200 rounded-md overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={productName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-gray-900 truncate">{productName}</h3>
        <p className="text-sm text-gray-500 mt-1">{productPrice} ₽ за шт.</p>
        
        <div className="mt-2 flex items-center gap-4">
          <QuantityControl
            value={quantity}
            min={1}
            max={99}
            onChange={handleQuantityChange}
          />
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemove}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            Удалить
          </Button>
        </div>
      </div>

      <div className="text-right">
        <p className="text-lg font-semibold text-gray-900">{totalPrice} ₽</p>
      </div>
    </div>
  );
}
