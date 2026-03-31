"use client";

import { useCartStore, type CartItem } from "@/store/cartStore";
import { Minus, Plus, Package } from "lucide-react";

interface ProductRowProps {
  item: CartItem;
  index: number;
}

export default function ProductRow({ item, index }: ProductRowProps) {
  const { updateQuantity } = useCartStore();

  return (
    <div
      className="flex items-center gap-4 px-5 py-4 animate-fade-in-up"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Thumbnail */}
      <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.display_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Package className="w-6 h-6 text-gray-400" />
        )}
      </div>

      {/* Name + price */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">
          {item.display_name}
        </p>
        <p className="text-sm text-gray-400 mt-0.5">
          ฿{item.price.toFixed(2)} each
        </p>
      </div>

      {/* Quantity stepper */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => updateQuantity(item.id, -1)}
          className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center active:scale-90 active:bg-gray-100 transition-all"
          aria-label={`Decrease ${item.display_name}`}
        >
          <Minus className="w-3.5 h-3.5 text-gray-600" />
        </button>

        <span className="w-8 text-center text-sm font-bold text-gray-900 tabular-nums">
          {item.quantity}
        </span>

        <button
          onClick={() => updateQuantity(item.id, 1)}
          className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center active:scale-90 transition-all"
          aria-label={`Increase ${item.display_name}`}
        >
          <Plus className="w-3.5 h-3.5 text-white" />
        </button>
      </div>

      {/* Line total */}
      <p className="text-sm font-bold text-gray-900 w-16 text-right tabular-nums">
        ฿{(item.price * item.quantity).toFixed(2)}
      </p>
    </div>
  );
}
