"use client";

import { useEffect, useState } from "react";
import { CheckCircle, AlertTriangle, X } from "lucide-react";

interface ToastProps {
  message: string;
  type?: "success" | "error";
  duration?: number;
  onDismiss: () => void;
}

export default function Toast({
  message,
  type = "success",
  duration = 3500,
  onDismiss,
}: ToastProps) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(onDismiss, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  const isError = type === "error";

  return (
    <div
      className={`fixed top-4 left-4 right-4 z-[100] max-w-md mx-auto ${
        exiting ? "animate-toast-out" : "animate-toast-in"
      }`}
    >
      <div
        className={`px-4 py-3.5 rounded-2xl shadow-lg flex items-center gap-3 ${
          isError ? "bg-red-500 text-white" : "bg-emerald-500 text-white"
        }`}
      >
        {isError ? (
          <AlertTriangle className="w-5 h-5 shrink-0" />
        ) : (
          <CheckCircle className="w-5 h-5 shrink-0" />
        )}
        <span className="font-medium text-sm flex-1">{message}</span>
        <button
          onClick={() => {
            setExiting(true);
            setTimeout(onDismiss, 300);
          }}
          className="shrink-0 p-0.5 rounded-full hover:bg-white/20 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
