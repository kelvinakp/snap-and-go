# Snap and Go - Full-Stack Architecture & Development Plan

## 1. Project Initialization & Infrastructure
* [cite_start]Frontend: Bootstrap Next.js App Router with TypeScript and Tailwind[cite: 11]. [cite_start]Configure PWA manifest[cite: 8].
* Backend: Initialize a Python virtual environment. [cite_start]Install `fastapi`, `uvicorn`, `python-multipart`, `ultralytics`, `pyzbar`, and `promptparse`[cite: 12, 14, 16]. **Ensure `zbar` system dependency is installed on the OS.**
* [cite_start]Database: Set up a Supabase project[cite: 13]. [cite_start]Create the `products` table (columns: `id`, `yolo_class_name`, `display_name`, `price`, `stock_level`) and populate it[cite: 41, 42, 43, 44, 45, 46].

## 2. Core Frontend Views & Flow
* Home View: "Tap to Scan Basket" CTA.
* [cite_start]Camera View: Full-screen video feed with a floating capture button[cite: 19].
* Post-Scan View: "Items added to cart!" toast. Options to "Take Another Photo" (multi-scan) or "View Cart & Checkout".
* Cart View: Displays accumulated items with +/- quantity controls, dynamic total calculation, and a "+ Scan More Items" sticky button.
* [cite_start]Payment View: 60-second countdown timer, dynamic total, and static PromptPay QR code[cite: 32, 22].
* [cite_start]Upload/Success View: e-slip upload interface[cite: 23]. Transitions to a final digital receipt upon successful backend validation.

## 3. Backend AI & API Endpoints
* [cite_start]`POST /api/scan-cart`[cite: 39]: 
    * [cite_start]Receives the image Blob from the Next.js frontend[cite: 19].
    * [cite_start]Loads the image into memory and runs inference using `YOLOv8 Nano` (downscaled to 640x640 for speed)[cite: 19, 20].
    * Tallies up the detected bounding box classes.
    * [cite_start]Queries the Supabase `products` table using the detected `yolo_class_name`s to fetch real-time `display_name` and `price`[cite: 21].
    * Returns a structured JSON array of the detected items.
* `POST /api/verify-payment`: 
    * Receives the e-slip image and the `expected_amount`.
    * [cite_start]Uses `pyzbar` to locate and extract the raw EMVCo string from the QR code[cite: 24].
    * [cite_start]Uses `promptparse` to decode the string and extract the `transaction_amount`[cite: 25].
    * [cite_start]Validates that the parsed amount exactly matches the `expected_amount`[cite: 25].
    * Returns a success/failure status and message to the frontend.

## 4. Integration & Development Phases
* [cite_start]Phase 1 (UI Shell): Build the static Next.js frontend UI[cite: 11].
* [cite_start]Phase 2 (Backend AI & Logic): Stand up the FastAPI server, get YOLOv8 and `pyzbar` running locally, and test endpoints via Swagger UI[cite: 12].
* Phase 3 (The Bridge): Connect the frontend to the backend. Wire up the Camera component to `/api/scan-cart` and the Upload component to `/api/verify-payment`.
* [cite_start]Phase 4 (Database): Replace the mock Python dictionary in the FastAPI backend with actual Supabase database queries[cite: 13].
* Phase 5 (Polish): Add error handling for blurry photos, network timeouts, invalid QR uploads, and refine the mobile UI animations.