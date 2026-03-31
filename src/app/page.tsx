"use client";

import { useCartStore } from "@/store/cartStore";
import HomeView from "@/components/views/HomeView";
import CameraView from "@/components/views/CameraView";
import PostScanView from "@/components/views/PostScanView";
import CartView from "@/components/views/CartView";
import PaymentView from "@/components/views/PaymentView";
import UploadView from "@/components/views/UploadView";
import SuccessView from "@/components/views/SuccessView";

export default function Home() {
  const { step } = useCartStore();

  switch (step) {
    case "home":
      return <HomeView />;
    case "camera":
      return <CameraView />;
    case "post-scan":
      return <PostScanView />;
    case "cart":
      return <CartView />;
    case "payment":
      return <PaymentView />;
    case "upload":
      return <UploadView />;
    case "success":
      return <SuccessView />;
  }
}
