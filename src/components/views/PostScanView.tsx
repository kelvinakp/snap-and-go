"use client";

import { useCartStore } from "@/store/cartStore";
import { Camera, ShoppingCart, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";

export default function PostScanView() {
  const { setStep, cartItems } = useCartStore();
  const [showToast, setShowToast] = useState(true);
  const [toastExiting, setToastExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setToastExiting(true);
      setTimeout(() => setShowToast(false), 300);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-64px)] relative">
      {/* Toast notification */}
      {showToast && (
        <div
          className={`absolute top-4 left-4 right-4 z-50 ${
            toastExiting ? "animate-toast-out" : "animate-toast-in"
          }`}
        >
          <div className="bg-emerald-500 text-white px-4 py-3.5 rounded-2xl shadow-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span className="font-medium text-sm">Items added to cart!</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        {/* Success icon */}
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6 animate-fade-in-up">
          <CheckCircle className="w-10 h-10 text-emerald-500" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
          Scan Complete
        </h2>
        <p className="text-gray-400 text-center text-sm mb-2">
          Products detected and added to your cart.
        </p>

        {/* Mini cart summary */}
        <div className="w-full bg-gray-50 rounded-2xl p-4 mt-6 mb-10 animate-fade-in-up">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Cart Summary
            </span>
            <span className="text-xs font-medium text-gray-500">
              {totalItems} item{totalItems !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="space-y-2.5">
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <span className="text-sm text-gray-700 font-medium">
                  {item.display_name}
                  {item.quantity > 1 && (
                    <span className="text-gray-400 ml-1">x{item.quantity}</span>
                  )}
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  ฿{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 mt-3 pt-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-500">Total</span>
            <span className="text-base font-bold text-gray-900">
              ฿
              {cartItems
                .reduce((sum, item) => sum + item.price * item.quantity, 0)
                .toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-8 pb-10 space-y-3">
        <button
          onClick={() => setStep("cart")}
          className="w-full py-4 bg-gray-900 text-white font-semibold rounded-2xl active:scale-[0.97] transition-all duration-150 shadow-lg flex items-center justify-center gap-2.5"
        >
          <ShoppingCart className="w-5 h-5" />
          View Cart & Checkout
        </button>

        <button
          onClick={() => setStep("camera")}
          className="w-full py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-2xl active:scale-[0.97] transition-all duration-150 flex items-center justify-center gap-2.5"
        >
          <Camera className="w-5 h-5" />
          Take Another Photo
        </button>
      </div>
    </div>
  );
}
