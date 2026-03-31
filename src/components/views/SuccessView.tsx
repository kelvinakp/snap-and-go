"use client";

import { useCartStore } from "@/store/cartStore";
import { RotateCcw } from "lucide-react";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export default function SuccessView() {
  const { lastReceipt, clearCart } = useCartStore();

  const receipt = lastReceipt ?? {
    totalPaid: 0,
    transactionId: "SNG-00000000",
    timestamp: new Date().toISOString(),
    itemCount: 0,
  };

  return (
    <div className="flex flex-col items-center min-h-[calc(100dvh-64px)] px-6 pt-10 pb-8">
      {/* Animated checkmark */}
      <div className="animate-check-scale mb-6">
        <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
          <circle
            cx="48"
            cy="48"
            r="42"
            stroke="#22c55e"
            strokeWidth="4"
            fill="#f0fdf4"
            className="animate-check-circle"
          />
          <path
            d="M30 50 L42 62 L66 36"
            stroke="#22c55e"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            className="animate-check-tick"
          />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-1 animate-fade-in-up">
        Payment Verified
      </h2>
      <p
        className="text-sm text-gray-400 mb-8 animate-fade-in-up"
        style={{ animationDelay: "100ms" }}
      >
        Your transaction was successful
      </p>

      {/* Digital receipt card */}
      <div
        className="w-full bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-fade-in-up"
        style={{ animationDelay: "200ms" }}
      >
        {/* Card header */}
        <div className="bg-gray-900 px-5 py-4 flex items-center justify-between">
          <span className="text-white font-bold text-sm">Snap & Go</span>
          <span className="text-white/60 text-xs font-medium">
            Digital Receipt
          </span>
        </div>

        {/* Receipt rows */}
        <div className="px-5 py-4 space-y-3.5">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
              Amount Paid
            </span>
            <span className="text-xl font-bold text-gray-900 tabular-nums">
              ฿{receipt.totalPaid.toFixed(2)}
            </span>
          </div>

          <div className="h-px bg-gray-100" />

          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
              Items
            </span>
            <span className="text-sm font-semibold text-gray-700">
              {receipt.itemCount} item{receipt.itemCount !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
              Transaction ID
            </span>
            <span className="text-sm font-semibold text-gray-700 font-mono tracking-wider">
              {receipt.transactionId}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
              Date
            </span>
            <span className="text-sm font-semibold text-gray-700">
              {formatDate(receipt.timestamp)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
              Time
            </span>
            <span className="text-sm font-semibold text-gray-700 tabular-nums">
              {formatTime(receipt.timestamp)}
            </span>
          </div>

          <div className="h-px bg-gray-100" />

          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
              Payment Method
            </span>
            <span className="text-sm font-semibold text-gray-700">
              PromptPay
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
              Status
            </span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              CONFIRMED
            </span>
          </div>
        </div>

        {/* Dashed tear line */}
        <div className="border-t-2 border-dashed border-gray-200 mx-5" />

        <div className="px-5 py-3 text-center">
          <p className="text-[10px] text-gray-300 font-medium">
            Thank you for shopping with Snap & Go
          </p>
        </div>
      </div>

      {/* Start new session */}
      <div className="w-full mt-auto pt-8">
        <button
          onClick={clearCart}
          className="w-full py-4 bg-gray-900 text-white font-semibold rounded-2xl active:scale-[0.97] transition-all shadow-lg text-base flex items-center justify-center gap-2.5"
        >
          <RotateCcw className="w-5 h-5" />
          Start New Session
        </button>
      </div>
    </div>
  );
}
