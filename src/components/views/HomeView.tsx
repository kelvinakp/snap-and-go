"use client";

import { useCartStore } from "@/store/cartStore";
import { ScanLine } from "lucide-react";

export default function HomeView() {
  const { setStep, cartItems } = useCartStore();

  return (
    <div className="flex flex-col items-center justify-center px-8 h-full min-h-[calc(100vh-64px)]">
      {/* Logo area */}
      <div className="relative mb-10">
        <div className="absolute inset-0 rounded-full bg-gray-900 animate-pulse-ring" />
        <div className="relative w-28 h-28 bg-gray-900 rounded-full flex items-center justify-center shadow-xl">
          <ScanLine className="w-12 h-12 text-white" strokeWidth={1.5} />
        </div>
      </div>

      <h2 className="text-3xl font-bold text-gray-900 text-center mb-2 tracking-tight">
        Snap & Go
      </h2>
      <p className="text-gray-400 text-center text-base leading-relaxed mb-14 max-w-[260px]">
        Scan your basket with AI and checkout in seconds.
      </p>

      {/* Primary CTA */}
      <button
        onClick={() => setStep("camera")}
        className="relative w-full py-4.5 bg-gray-900 text-white text-lg font-semibold rounded-2xl active:scale-[0.97] transition-all duration-150 shadow-lg"
      >
        <span className="relative z-10">Tap to Scan Basket</span>
      </button>

      {/* Cart indicator if returning */}
      {cartItems.length > 0 && (
        <button
          onClick={() => setStep("cart")}
          className="mt-4 w-full py-3.5 border-2 border-gray-900 text-gray-900 font-semibold rounded-2xl active:scale-[0.97] transition-all duration-150"
        >
          View Cart ({cartItems.length} item{cartItems.length > 1 ? "s" : ""})
        </button>
      )}
    </div>
  );
}
