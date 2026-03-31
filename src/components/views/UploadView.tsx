"use client";

import { useCartStore } from "@/store/cartStore";
import { API_BASE } from "@/lib/api";
import Toast from "@/components/Toast";
import { useState, useCallback, useRef } from "react";
import {
  Upload,
  FileImage,
  CheckCircle,
  ShieldCheck,
  Loader2,
} from "lucide-react";

function generateTxnId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "SNG-";
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadView() {
  const { cartItems, setStep, setReceipt } = useCartStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) setSelectedFile(file);
    },
    []
  );

  const handleVerify = useCallback(async () => {
    if (verifying || !selectedFile) return;
    setVerifying(true);
    setToast(null);

    const totalItems = cartItems.reduce((s, i) => s + i.quantity, 0);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("expected_amount", totalAmount.toString());

      const res = await fetch(`${API_BASE}/api/verify-payment`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.status === "success") {
        setReceipt({
          totalPaid: totalAmount,
          transactionId: generateTxnId(),
          timestamp: new Date().toISOString(),
          itemCount: totalItems,
        });
        setStep("success");
      } else {
        setToast({
          msg: data.message ?? "Verification failed. Please try again.",
          type: "error",
        });
        setVerifying(false);
      }
    } catch {
      setToast({
        msg: "Cannot reach server. Is the backend running?",
        type: "error",
      });
      setVerifying(false);
    }
  }, [verifying, selectedFile, cartItems, totalAmount, setReceipt, setStep]);

  return (
    <div className="flex flex-col min-h-[calc(100dvh-64px)] relative">
      {toast && (
        <Toast
          message={toast.msg}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Verifying overlay */}
      {verifying && (
        <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in-up">
          <div className="relative mb-5">
            <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-gray-900 animate-spin" />
            </div>
          </div>
          <p className="text-lg font-bold text-gray-900 mb-1">
            Verifying Payment
          </p>
          <p className="text-sm text-gray-400">
            Validating EMVCo cryptogram...
          </p>
        </div>
      )}

      {/* Header */}
      <div className="px-6 pt-6 pb-2 text-center">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
          Upload Payment Proof
        </p>
        <p className="text-3xl font-bold text-gray-900 tabular-nums">
          ฿{totalAmount.toFixed(2)}
        </p>
      </div>

      {/* Dropzone area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-6">
        {!selectedFile ? (
          <button
            onClick={handleFileSelect}
            className="w-full aspect-[4/3] border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center gap-4 active:scale-[0.98] active:border-gray-400 transition-all hover:border-gray-400 hover:bg-gray-50/50"
          >
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <Upload className="w-7 h-7 text-gray-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-700">
                Tap to upload PromptPay e-slip
              </p>
              <p className="text-xs text-gray-400 mt-1">
                JPG, PNG or PDF accepted
              </p>
            </div>
          </button>
        ) : (
          <div className="w-full animate-fade-in-up">
            <div className="w-full border-2 border-emerald-200 bg-emerald-50/50 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0 shadow-sm">
                <FileImage className="w-7 h-7 text-gray-500" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {selectedFile.type.split("/")[1]?.toUpperCase() ?? "File"}{" "}
                  &middot; {formatFileSize(selectedFile.size)}
                </p>
              </div>

              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="mt-3 text-xs text-gray-400 font-medium underline underline-offset-2 mx-auto block"
            >
              Choose a different file
            </button>
          </div>
        )}
      </div>

      {/* Bottom action */}
      <div className="px-6 pb-8">
        <button
          onClick={handleVerify}
          disabled={!selectedFile || verifying}
          className="w-full py-4 bg-gray-900 text-white font-semibold rounded-2xl active:scale-[0.97] transition-all shadow-lg text-base flex items-center justify-center gap-2.5 disabled:opacity-40 disabled:active:scale-100"
        >
          <ShieldCheck className="w-5 h-5" />
          Verify Payment
        </button>
      </div>
    </div>
  );
}
