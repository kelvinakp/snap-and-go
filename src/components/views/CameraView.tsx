"use client";

import { useCartStore, type CartItem } from "@/store/cartStore";
import { API_BASE } from "@/lib/api";
import Toast from "@/components/Toast";
import { Aperture, Loader2, VideoOff, Camera } from "lucide-react";
import { useState, useCallback, useRef, useEffect } from "react";

export default function CameraView() {
  const { addItemsToCart, setStep } = useCartStore();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [detecting, setDetecting] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: 1280, height: 720 },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraReady(true);
        }
      } catch (err) {
        if (cancelled) return;

        const name = err instanceof DOMException ? err.name : "";
        if (name === "NotAllowedError" || name === "PermissionDeniedError") {
          setCameraError(
            "Camera access denied. Please enable permissions in your browser settings."
          );
        } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
          setCameraError(
            "No camera found on this device. Please connect a camera and try again."
          );
        } else if (name === "NotReadableError") {
          setCameraError(
            "Camera is already in use by another application. Please close it and try again."
          );
        } else {
          setCameraError(
            "Could not access the camera. Please check your browser settings and try again."
          );
        }
      }
    }

    initCamera();

    return () => {
      cancelled = true;

      // Stop via streamRef (primary)
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;

      // Also stop via srcObject as a safety net for iOS Safari
      if (videoRef.current?.srcObject) {
        const src = videoRef.current.srcObject as MediaStream;
        src.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  const handleCapture = useCallback(async () => {
    if (detecting) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Flash feedback
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 200);

    setDetecting(true);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.drawImage(video, 0, 0);
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.85);
    });

    if (!blob) {
      setToast({ msg: "Failed to capture frame.", type: "error" });
      setDetecting(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", blob, "snapshot.jpg");

      const res = await fetch(`${API_BASE}/api/scan-cart`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (
        data.status === "success" &&
        Array.isArray(data.detected_items) &&
        data.detected_items.length > 0
      ) {
        const items: CartItem[] = data.detected_items.map(
          (item: Record<string, unknown>) => ({
            id: item.id as string,
            yolo_class_name: item.yolo_class_name as string,
            display_name: item.display_name as string,
            price: item.price as number,
            quantity: item.quantity as number,
            image_url: (item.image_url as string) ?? undefined,
          })
        );
        addItemsToCart(items);
        setStep("post-scan");
      } else if (
        data.status === "success" &&
        data.detected_items?.length === 0
      ) {
        setToast({
          msg: "No products detected. Try moving closer to the items.",
          type: "error",
        });
      } else {
        setToast({
          msg: data.message ?? "Scan failed. Please try again.",
          type: "error",
        });
      }
    } catch {
      setToast({
        msg: "Cannot reach server. Is the backend running?",
        type: "error",
      });
    } finally {
      setDetecting(false);
    }
  }, [detecting, addItemsToCart, setStep]);

  if (cameraError) {
    return (
      <div className="relative flex-1 flex flex-col bg-black min-h-[calc(100dvh-64px)] items-center justify-center px-8">
        <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-5">
          <VideoOff className="w-9 h-9 text-white/60" />
        </div>
        <p className="text-white/80 text-center text-sm font-medium mb-8 leading-relaxed max-w-[280px]">
          {cameraError}
        </p>
        <button
          onClick={() => setStep("home")}
          className="px-8 py-3.5 bg-white text-gray-900 font-semibold rounded-2xl active:scale-95 transition-all"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex-1 flex flex-col bg-black min-h-[calc(100dvh-64px)]">
      {toast && (
        <Toast
          message={toast.msg}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}

      <canvas ref={canvasRef} className="hidden" />

      {/* Full-screen live video feed */}
      <div className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Capture flash */}
        {showFlash && (
          <div className="absolute inset-0 bg-white z-30 animate-[flash_200ms_ease-out_forwards]" />
        )}

        {/* Loading state while camera initializes */}
        {!cameraReady && (
          <div className="absolute inset-0 bg-gradient-to-b from-gray-800 via-gray-900 to-black flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
            <p className="text-white/30 text-xs font-medium tracking-wider uppercase">
              Starting camera...
            </p>
          </div>
        )}

        {/* Corner viewfinder brackets */}
        <div className="absolute inset-8 z-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-10 h-10 border-t-3 border-l-3 border-white/70 rounded-tl-xl" />
          <div className="absolute top-0 right-0 w-10 h-10 border-t-3 border-r-3 border-white/70 rounded-tr-xl" />
          <div className="absolute bottom-0 left-0 w-10 h-10 border-b-3 border-l-3 border-white/70 rounded-bl-xl" />
          <div className="absolute bottom-0 right-0 w-10 h-10 border-b-3 border-r-3 border-white/70 rounded-br-xl" />
        </div>

        {/* Scanning line animation */}
        {!detecting && cameraReady && (
          <div className="absolute left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-scan-line z-10 opacity-60" />
        )}

        {/* Center overlay text / detection spinner */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          {detecting ? (
            <div className="flex flex-col items-center gap-4 animate-fade-in-up bg-black/40 backdrop-blur-sm px-8 py-6 rounded-3xl">
              <Loader2 className="w-12 h-12 text-white animate-spin" />
              <span className="text-white text-lg font-medium tracking-wide">
                Detecting Products...
              </span>
            </div>
          ) : cameraReady ? (
            <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full">
              <Camera className="w-3.5 h-3.5 text-white/50" />
              <p className="text-white/50 text-xs font-medium tracking-wider uppercase">
                Point at your basket
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Floating capture button bar */}
      <div className="relative z-20 bg-gradient-to-t from-black/90 via-black/60 to-transparent py-8 -mt-8 flex items-center justify-center">
        <button
          onClick={handleCapture}
          disabled={detecting || !cameraReady}
          className="group relative w-20 h-20 rounded-full bg-white flex items-center justify-center active:scale-90 transition-all duration-150 disabled:opacity-40 disabled:active:scale-100 shadow-2xl"
        >
          <div className="absolute inset-1 rounded-full border-[3px] border-gray-300 group-active:border-gray-400 transition-colors" />
          <Aperture className="w-8 h-8 text-gray-700" />
        </button>
      </div>
    </div>
  );
}
