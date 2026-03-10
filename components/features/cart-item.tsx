'use client';

import { QuantityControl } from '@/components/features/quantity-control';
import { Button } from '@/components/ui/button';

interface CartItemProps {
  uniqueKey: string;
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  imageUrl?: string | null;
  extras?: Array<{
    id: string;
    name: string;
    price: number;
  }>;
  onUpdateQuantity: (uniqueKey: string, quantity: number) => void;
  onRemove: (uniqueKey: string) => void;
}

export function CartItemComponent({
  uniqueKey,
  productName,
  productPrice,
  quantity,
  imageUrl,
  extras = [],
  onUpdateQuantity,
  onRemove,
}: CartItemProps) {
  const extrasPrice = extras.reduce((sum, extra) => sum + extra.price, 0);
  const totalPrice = (productPrice + extrasPrice) * quantity;

  const handleQuantityChange = (newQuantity: number) => {
    onUpdateQuantity(uniqueKey, newQuantity);
  };

  const handleRemove = () => {
    onRemove(uniqueKey);
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
        
        {extras.length > 0 && (
          <div className="text-xs text-gray-500 mt-1">
            {extras.map(extra => (
              <span key={extra.id} className="mr-2">
                + {extra.name} ({extra.price} ₽)
              </span>
            ))}
          </div>
        )}
        
        <p className="text-sm text-gray-500">
          {productPrice} ₽ {extrasPrice > 0 && `+ ${extrasPrice} ₽`} за шт.
        </p>
        
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
