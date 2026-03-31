"use client";

import { useCartStore } from '@/store/cartStore';
import { ChevronLeft } from 'lucide-react';
import React from 'react';

export default function TopNav() {
  const { step, setStep } = useCartStore();

  const handleBack = () => {
    if (step === 'camera') setStep('home');
    else if (step === 'post-scan') setStep('camera');
    else if (step === 'cart') setStep('post-scan');
    else if (step === 'payment') setStep('cart');
    else if (step === 'upload') setStep('payment');
    else if (step === 'success') setStep('home');
    else setStep('home');
  };

  return (
    <div className="flex items-center justify-between px-4 py-4 bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm rounded-t-2xl md:rounded-t-none">
      <div className="w-8">
        {step !== 'home' && step !== 'success' && (
          <button
            onClick={handleBack}
            className="p-1 rounded-full hover:bg-gray-100 active:scale-95 transition-all"
            aria-label="Back"
          >
            <ChevronLeft className="w-6 h-6 text-gray-800" />
          </button>
        )}
      </div>
      <h1 className="text-xl font-bold tracking-tight text-gray-900">
        Snap & Go
      </h1>
      <div className="w-8" />
    </div>
  );
}
