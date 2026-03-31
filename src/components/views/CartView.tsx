"use client";

import { useCartStore } from "@/store/cartStore";
import ProductRow from "@/components/ProductRow";
import { ScanLine, ShoppingBag } from "lucide-react";

export default function CartView() {
  const { cartItems, setStep } = useCartStore();

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-8 h-full min-h-[calc(100dvh-64px)]">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-5">
          <ShoppingBag className="w-9 h-9 text-gray-300" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Cart is empty</h2>
        <p className="text-sm text-gray-400 mb-8 text-center">
          Scan some items to get started.
        </p>
        <button
          onClick={() => setStep("camera")}
          className="w-full py-4 bg-gray-900 text-white font-semibold rounded-2xl active:scale-[0.97] transition-all shadow-lg"
        >
          Scan Items
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100dvh-64px)]">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <h2 className="text-xl font-bold text-gray-900">Your Cart</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          {totalItems} item{totalItems !== 1 ? "s" : ""} from your scans
        </p>
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-gray-100">
          {cartItems.map((item, i) => (
            <ProductRow key={item.id} item={item} index={i} />
          ))}
        </div>

        {/* Scan more */}
        <div className="px-5 py-5">
          <button
            onClick={() => setStep("camera")}
            className="w-full py-3.5 border-2 border-dashed border-gray-300 text-gray-500 font-semibold rounded-2xl active:scale-[0.97] transition-all flex items-center justify-center gap-2 hover:border-gray-400 hover:text-gray-600"
          >
            <ScanLine className="w-4.5 h-4.5" />
            + Scan More Items
          </button>
        </div>
      </div>

      {/* Sticky footer */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 pt-4 pb-8 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-500 font-medium">
            Total Amount
          </span>
          <span className="text-2xl font-bold text-gray-900 tabular-nums">
            ฿{totalAmount.toFixed(2)}
          </span>
        </div>
        <button
          onClick={() => setStep("payment")}
          className="w-full py-4 bg-gray-900 text-white font-semibold rounded-2xl active:scale-[0.97] transition-all shadow-lg text-base"
        >
          Confirm & Proceed to Pay
        </button>
      </div>
    </div>
  );
}
