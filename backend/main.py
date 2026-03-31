import os
from io import BytesIO

import google.generativeai as genai
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image
from pydantic import BaseModel
from pyzbar.pyzbar import decode as decode_qr
from ultralytics import YOLO

load_dotenv()

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(title="Snap & Go API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Load YOLO model once at startup so it stays warm in memory.
# ---------------------------------------------------------------------------

model = YOLO("best.pt")

# ---------------------------------------------------------------------------
# Mock product database
# Maps your custom YOLO class names to store products.
# Replace with real Supabase queries in Phase 4.
# ---------------------------------------------------------------------------

MOCK_PRODUCTS_DB: dict[str, dict] = {
    "Lays Nori Seaweed 46g": {
        "id": "uuid-1",
        "display_name": "Lays Nori Seaweed 46g",
        "price": 20.00,
    },
    "Lipton Tea 445ml": {
        "id": "uuid-2",
        "display_name": "Lipton Tea 445ml",
        "price": 25.00,
    },
    "Mama Seafood Pad Kee Mao": {
        "id": "uuid-3",
        "display_name": "Mama Seafood Pad Kee Mao",
        "price": 7.00,
    },
    "Ovaltine 180ml": {
        "id": "uuid-4",
        "display_name": "Ovaltine 180ml",
        "price": 15.00,
    },
    "Sprite Can 325ml": {
        "id": "uuid-5",
        "display_name": "Sprite Can 325ml",
        "price": 18.00,
    },
}


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@app.get("/")
async def health_check():
    return {"status": "ok", "model": "best.pt"}


@app.post("/api/scan-cart")
async def scan_cart(file: UploadFile = File(...)):
    """
    Accepts an image, runs YOLOv8 inference, tallies detected classes,
    cross-references against the product DB, and returns cart items.
    """

    contents = await file.read()
    image = Image.open(BytesIO(contents)).convert("RGB")

    results = model.predict(source=image, imgsz=640, verbose=False)

    detected_classes: set[str] = set()
    names_dict = model.names
    for result in results:
        for box in result.boxes:
            class_id = int(box.cls[0])
            detected_classes.add(names_dict[class_id])

    detected_items = []
    for class_name in detected_classes:
        product = MOCK_PRODUCTS_DB.get(class_name)
        if product:
            detected_items.append(
                {
                    "id": product["id"],
                    "yolo_class_name": class_name,
                    "display_name": product["display_name"],
                    "price": product["price"],
                    "quantity": 1,
                    "image_url": None,
                }
            )

    return {
        "status": "success",
        "detected_items": detected_items,
    }


# ---------------------------------------------------------------------------
# EMVCo TLV parser
# PromptPay / EMVCo QR payloads are Tag-Length-Value encoded strings.
# Tag 54 holds the transaction amount.  This is a minimal pure-Python
# implementation equivalent to what the npm `promptparse` library does.
# ---------------------------------------------------------------------------


def parse_emvco_tlv(payload: str) -> dict[str, str]:
    """Parse an EMVCo QR TLV string into a flat {tag: value} dict."""
    tags: dict[str, str] = {}
    pos = 0
    while pos < len(payload):
        if pos + 4 > len(payload):
            break
        tag = payload[pos : pos + 2]
        length = int(payload[pos + 2 : pos + 4])
        value = payload[pos + 4 : pos + 4 + length]
        tags[tag] = value
        pos += 4 + length
    return tags


def extract_amount_from_emvco(payload: str) -> float | None:
    """
    Extract the transaction amount (tag 54) from an EMVCo QR string.
    Returns None if the tag is missing or unparseable.
    """
    tags = parse_emvco_tlv(payload)
    raw = tags.get("54")
    if raw is None:
        return None
    try:
        return float(raw)
    except ValueError:
        return None


# ---------------------------------------------------------------------------
# Payment verification endpoint
# ---------------------------------------------------------------------------


SLIP_VERIFICATION_PROMPT = """Analyze this PromptPay / bank transfer e-slip image.

Your task:
1. Determine if this looks like a valid payment receipt or transaction slip.
2. Extract the transaction AMOUNT (the money transferred).
3. Return ONLY a JSON object in this exact format (no markdown, no extra text):
   {"valid": true, "amount": 85.00}
   or if it's not a valid slip:
   {"valid": false, "amount": null}

Important:
- Look for the transferred amount in Thai Baht (฿ or THB).
- Ignore fees, balances, or account numbers — only return the transfer amount.
- Return the amount as a number, not a string."""


@app.post("/api/verify-payment")
async def verify_payment(
    file: UploadFile = File(...),
    expected_amount: float = Form(...),
):
    """
    Accepts a PromptPay e-slip image and the expected cart total.
    Uses Gemini Vision to read the slip and extract the paid amount.
    Falls back to QR-based EMVCo parsing if Gemini is unavailable.
    """

    contents = await file.read()
    pil_image = Image.open(BytesIO(contents)).convert("RGB")

    parsed_amount: float | None = None

    # Strategy 1: Gemini Vision (primary)
    try:
        import json as _json

        vision_response = gemini_model.generate_content(
            [SLIP_VERIFICATION_PROMPT, pil_image]
        )
        raw_text = vision_response.text.strip()
        # Strip markdown code fences if present
        if raw_text.startswith("```"):
            raw_text = raw_text.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
        slip_data = _json.loads(raw_text)

        if slip_data.get("valid") and slip_data.get("amount") is not None:
            parsed_amount = float(slip_data["amount"])
    except Exception:
        pass

    # Strategy 2: QR code EMVCo fallback
    if parsed_amount is None:
        try:
            qr_results = decode_qr(pil_image)
            if qr_results:
                raw_data = qr_results[0].data.decode("utf-8")
                parsed_amount = extract_amount_from_emvco(raw_data)
        except Exception:
            pass

    if parsed_amount is None:
        return JSONResponse(
            status_code=400,
            content={
                "status": "error",
                "message": "Could not read the transaction amount from your slip. Please upload a clearer photo.",
            },
        )

    if abs(parsed_amount - expected_amount) < 0.50:
        return {
            "status": "success",
            "message": "Payment verified successfully.",
            "parsed_amount": parsed_amount,
            "expected_amount": expected_amount,
        }

    return JSONResponse(
        status_code=400,
        content={
            "status": "failed",
            "message": f"Amount mismatch. Slip shows ฿{parsed_amount:.2f} but cart total is ฿{expected_amount:.2f}.",
            "parsed_amount": parsed_amount,
            "expected_amount": expected_amount,
        },
    )


# ---------------------------------------------------------------------------
# Gemini-powered store assistant chatbot
# ---------------------------------------------------------------------------

genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))

CHAT_SYSTEM_PROMPT = """You are a friendly and helpful store assistant for "Snap & Go", 
an AI-powered self-checkout convenience store app in Thailand.

Your knowledge:
- The store sells snacks and drinks: Lays Nori Seaweed 46g (฿20), Lipton Tea 445ml (฿25), 
  Mama Seafood Pad Kee Mao (฿7), Ovaltine 180ml (฿15), Sprite Can 325ml (฿18).
- Customers scan their basket using the phone camera (AI object detection).
- Payment is via PromptPay QR code. After paying, customers upload the e-slip for verification.
- The app flow: Home → Camera Scan → Post-Scan → Cart → Payment → Upload Slip → Success.

Rules:
- Keep answers concise (1-3 sentences max).
- Be warm, polite, and use simple English.
- If asked about products not in the store, say you currently only carry the items listed above.
- For technical issues, suggest refreshing the page or checking camera/browser permissions.
- You may answer in Thai if the customer writes in Thai."""

gemini_model = genai.GenerativeModel(
    "gemini-2.0-flash",
    system_instruction=CHAT_SYSTEM_PROMPT,
)


class ChatRequest(BaseModel):
    message: str


@app.post("/api/chat")
async def chat(body: ChatRequest):
    try:
        response = gemini_model.generate_content(body.message)
        return {"reply": response.text}
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"reply": f"Sorry, I'm having trouble right now. ({e})"},
        )
