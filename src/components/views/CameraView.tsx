"use client";

import { useCartStore, type CartItem } from "@/store/cartStore";
import { API_BASE } from "@/lib/api";
import Toast from "@/components/Toast";
import {
  Aperture,
  Loader2,
  VideoOff,
  Camera,
  RefreshCw,
  ScanLine,
} from "lucide-react";
import { useState, useCallback, useRef, useEffect } from "react";

type CameraState = "idle" | "requesting" | "ready" | "error";

export default function CameraView() {
  const { addItemsToCart, setStep, cartItems } = useCartStore();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [camState, setCamState] = useState<CameraState>("idle");
  const [detecting, setDetecting] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (videoRef.current?.srcObject) {
        const src = videoRef.current.srcObject as MediaStream;
        src.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  const attachStream = useCallback((stream: MediaStream) => {
    streamRef.current = stream;

    const tryAttach = () => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setCamState("ready");
        };
      } else {
        requestAnimationFrame(tryAttach);
      }
    };
    tryAttach();
  }, []);

  const startCamera = useCallback(async () => {
    setCamState("requesting");
    setCameraError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      attachStream(stream);
    } catch (err) {
      setCamState("error");
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
      } else if (name === "OverconstrainedError") {
        setCameraError(
          "Camera does not support the requested resolution. Please try a different device."
        );
      } else {
        setCameraError(
          "Could not access the camera. Please check your browser settings and try again."
        );
      }
    }
  }, []);

  const handleCapture = useCallback(async () => {
    if (detecting) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

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

  // Video + canvas always in DOM so refs are never null
  const persistentMedia = (
    <>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
        style={{ display: camState === "ready" || camState === "requesting" ? "block" : "none" }}
      />
      <canvas ref={canvasRef} className="hidden" />
    </>
  );

  // ── Idle: tap-anywhere splash to get user gesture for getUserMedia ──
  if (camState === "idle") {
    return (
      <div
        onClick={startCamera}
        className="relative flex-1 flex flex-col bg-black min-h-dvh items-center justify-center px-8 cursor-pointer active:bg-gray-950 transition-colors select-none"
      >
        {persistentMedia}
        <div className="w-28 h-28 bg-white/10 rounded-full flex items-center justify-center mb-8">
          <ScanLine className="w-14 h-14 text-white/80" strokeWidth={1.5} />
        </div>
        <h1 className="text-white text-2xl font-bold tracking-tight mb-2">
          Snap & Go
        </h1>
        <p className="text-white/40 text-center text-sm mb-12 max-w-[240px] leading-relaxed">
          AI-powered self-checkout
        </p>
        <div className="flex flex-col items-center gap-2 animate-pulse">
          <Camera className="w-6 h-6 text-white/60" />
          <p className="text-white/60 text-sm font-semibold tracking-wide">
            Tap anywhere to start scanning
          </p>
        </div>

        {cartItems.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setStep("cart");
            }}
            className="absolute bottom-10 px-6 py-3 border-2 border-white/30 text-white/70 font-semibold rounded-2xl active:scale-95 transition-all text-sm"
          >
            View Cart ({cartItems.length} item
            {cartItems.length > 1 ? "s" : ""})
          </button>
        )}
      </div>
    );
  }

  // ── Error state ──
  if (camState === "error") {
    return (
      <div className="relative flex-1 flex flex-col bg-black min-h-dvh items-center justify-center px-8">
        {persistentMedia}
        <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-5">
          <VideoOff className="w-9 h-9 text-white/60" />
        </div>
        <p className="text-white/80 text-center text-sm font-medium mb-8 leading-relaxed max-w-[280px]">
          {cameraError}
        </p>
        <button
          onClick={startCamera}
          className="px-8 py-3.5 bg-white text-gray-900 font-semibold rounded-2xl active:scale-95 transition-all flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  // ── Requesting / Ready: camera viewfinder ──
  return (
    <div className="relative flex-1 flex flex-col bg-black min-h-dvh">
      {toast && (
        <Toast
          message={toast.msg}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}

      <div className="flex-1 relative overflow-hidden">
        {persistentMedia}

        {showFlash && (
          <div className="absolute inset-0 bg-white z-30 animate-[flash_200ms_ease-out_forwards]" />
        )}

        {camState === "requesting" && (
          <div className="absolute inset-0 bg-gradient-to-b from-gray-800 via-gray-900 to-black flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
            <p className="text-white/30 text-xs font-medium tracking-wider uppercase">
              Starting camera...
            </p>
          </div>
        )}

        <div className="absolute inset-8 z-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-10 h-10 border-t-3 border-l-3 border-white/70 rounded-tl-xl" />
          <div className="absolute top-0 right-0 w-10 h-10 border-t-3 border-r-3 border-white/70 rounded-tr-xl" />
          <div className="absolute bottom-0 left-0 w-10 h-10 border-b-3 border-l-3 border-white/70 rounded-bl-xl" />
          <div className="absolute bottom-0 right-0 w-10 h-10 border-b-3 border-r-3 border-white/70 rounded-br-xl" />
        </div>

        {!detecting && camState === "ready" && (
          <div className="absolute left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-scan-line z-10 opacity-60" />
        )}

        <div className="absolute inset-0 flex items-center justify-center z-10">
          {detecting ? (
            <div className="flex flex-col items-center gap-4 animate-fade-in-up bg-black/40 backdrop-blur-sm px-8 py-6 rounded-3xl">
              <Loader2 className="w-12 h-12 text-white animate-spin" />
              <span className="text-white text-lg font-medium tracking-wide">
                Detecting Products...
              </span>
            </div>
          ) : camState === "ready" ? (
            <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full">
              <Camera className="w-3.5 h-3.5 text-white/50" />
              <p className="text-white/50 text-xs font-medium tracking-wider uppercase">
                Point at your basket
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="relative z-20 bg-gradient-to-t from-black/90 via-black/60 to-transparent py-8 -mt-8 flex items-center justify-center">
        <button
          onClick={handleCapture}
          disabled={detecting || camState !== "ready"}
          className="group relative w-20 h-20 rounded-full bg-white flex items-center justify-center active:scale-90 transition-all duration-150 disabled:opacity-40 disabled:active:scale-100 shadow-2xl"
        >
          <div className="absolute inset-1 rounded-full border-[3px] border-gray-300 group-active:border-gray-400 transition-colors" />
          <Aperture className="w-8 h-8 text-gray-700" />
        </button>
      </div>
    </div>
  );
}
