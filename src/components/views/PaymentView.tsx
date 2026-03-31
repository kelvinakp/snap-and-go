"use client";

import { useCartStore } from "@/store/cartStore";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Clock, RefreshCw, Upload } from "lucide-react";
import generatePayload from "promptpay-qr";
import { QRCodeSVG } from "qrcode.react";

const TIMER_DURATION = 60;
const STORE_PROMPTPAY_ID = "0628814077";

export default function PaymentView() {
  const { cartItems, setStep } = useCartStore();
  const [seconds, setSeconds] = useState(TIMER_DURATION);
  const [expired, setExpired] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const qrPayload = useMemo(
    () => generatePayload(STORE_PROMPTPAY_ID, { amount: totalAmount }),
    [totalAmount]
  );

  const startTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSeconds(TIMER_DURATION);
    setExpired(false);

    intervalRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    startTimer();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startTimer]);

  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  const isWarning = seconds <= 10 && seconds > 0;

  return (
    <div className="flex flex-col min-h-[calc(100dvh-64px)]">
      {/* Total amount header */}
      <div className="px-6 pt-6 pb-2 text-center animate-fade-in-up">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
          Amount Due
        </p>
        <p className="text-4xl font-bold text-gray-900 tabular-nums">
          ฿{totalAmount.toFixed(2)}
        </p>
      </div>

      {/* QR card area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-6">
        {/* Timer */}
        <div
          className={`flex items-center gap-2 mb-5 px-4 py-2 rounded-full transition-colors duration-300 ${
            expired
              ? "bg-gray-100 text-gray-400"
              : isWarning
                ? "bg-red-50 text-red-600"
                : "bg-gray-100 text-gray-600"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span
            className={`text-lg font-bold tabular-nums tracking-wider ${
              isWarning ? "animate-pulse" : ""
            }`}
          >
            {mins}:{secs}
          </span>
        </div>

        {/* QR Card */}
        <div
          className="w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-6 flex flex-col items-center animate-fade-in-up"
          style={{ animationDelay: "100ms" }}
        >
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-5">
            Scan with your banking app
          </p>

          {/* QR code with high-contrast white background */}
          <div
            className={`bg-white p-4 rounded-2xl shadow-sm border border-gray-100 transition-opacity duration-300 ${
              expired ? "opacity-30" : "opacity-100"
            }`}
          >
            <QRCodeSVG
              value={qrPayload}
              size={220}
              level="M"
              bgColor="#ffffff"
              fgColor="#1f2937"
              includeMargin={false}
            />
          </div>

          {/* Amount badge below QR */}
          {!expired && (
            <div className="mt-4 bg-gray-50 px-4 py-2 rounded-xl">
              <p className="text-sm font-bold text-gray-900 tabular-nums text-center">
                ฿{totalAmount.toFixed(2)}
              </p>
            </div>
          )}

          {/* Expired overlay */}
          {expired && (
            <div className="mt-5 animate-fade-in-up">
              <p className="text-sm text-gray-400 text-center mb-3">
                QR code has expired
              </p>
              <button
                onClick={startTimer}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl active:scale-95 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh QR
              </button>
            </div>
          )}

          {!expired && (
            <p className="text-xs text-gray-400 mt-3 text-center">
              Pay to{" "}
              <span className="font-semibold text-gray-600">
                Snap & Go Store
              </span>
            </p>
          )}
        </div>

        {/* PromptPay branding */}
        <div className="flex items-center gap-2 mt-5 opacity-60">
          <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center">
            <span className="text-white text-[8px] font-bold">PP</span>
          </div>
          <span className="text-xs text-gray-400 font-medium">
            Powered by PromptPay
          </span>
        </div>
      </div>

      {/* Bottom action */}
      <div className="px-6 pb-8">
        <button
          onClick={() => setStep("upload")}
          disabled={expired}
          className="w-full py-4 bg-gray-900 text-white font-semibold rounded-2xl active:scale-[0.97] transition-all shadow-lg text-base flex items-center justify-center gap-2.5 disabled:opacity-40 disabled:active:scale-100"
        >
          <Upload className="w-5 h-5" />
          I have paid (Upload Slip)
        </button>
      </div>
    </div>
  );
}
