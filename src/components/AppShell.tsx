"use client";

import { useCartStore } from "@/store/cartStore";
import TopNav from "@/components/TopNav";
import ChatWidget from "@/components/ChatWidget";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { step } = useCartStore();
  const isFullscreen = step === "camera";

  return (
    <>
      <main className="w-full max-w-md bg-white min-h-dvh shadow-2xl flex flex-col relative overflow-hidden">
        {!isFullscreen && <TopNav />}
        <div className="flex-1 flex flex-col overflow-y-auto">{children}</div>
      </main>
      <ChatWidget />
    </>
  );
}
