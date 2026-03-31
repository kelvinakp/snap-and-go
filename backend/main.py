from collections import Counter
from io import BytesIO

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image
from pyzbar.pyzbar import decode as decode_qr
from ultralytics import YOLO

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
    "singha_can": {"id": "uuid-1", "display_name": "Singha Beer Can", "price": 35.00},
    "lays_green": {
        "id": "uuid-2",
        "display_name": "Lays (Sour Cream & Onion)",
        "price": 20.00,
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

    class_counts: Counter[str] = Counter()
    names_dict = model.names
    for result in results:
        for box in result.boxes:
            class_id = int(box.cls[0])
            class_name = names_dict[class_id]
            class_counts[class_name] += 1

    detected_items = []
    for class_name, quantity in class_counts.items():
        product = MOCK_PRODUCTS_DB.get(class_name)
        if product:
            detected_items.append(
                {
                    "id": product["id"],
                    "yolo_class_name": class_name,
                    "display_name": product["display_name"],
                    "price": product["price"],
                    "quantity": quantity,
                    "image_url": None,
                }
            )

    return {
        "status": "success",
        "detected_items": detected_items,
        "raw_detection_counts": dict(class_counts),
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


@app.post("/api/verify-payment")
async def verify_payment(
    file: UploadFile = File(...),
    expected_amount: float = Form(...),
):
    """
    Accepts a PromptPay e-slip image and the expected cart total.
    Decodes the QR code, parses the EMVCo payload, and validates
    that the paid amount matches.
    """

    contents = await file.read()
    image = Image.open(BytesIO(contents)).convert("RGB")

    qr_results = decode_qr(image)

    if not qr_results:
        return JSONResponse(
            status_code=400,
            content={
                "status": "error",
                "message": "No QR code found in the uploaded image. Please upload a clear photo of the PromptPay e-slip.",
            },
        )

    raw_data = qr_results[0].data.decode("utf-8")

    parsed_amount = extract_amount_from_emvco(raw_data)

    if parsed_amount is None:
        return JSONResponse(
            status_code=400,
            content={
                "status": "error",
                "message": "Could not extract a transaction amount from the QR code. The slip may be invalid or not a PromptPay EMVCo payload.",
                "raw_qr_data": raw_data,
            },
        )

    if abs(parsed_amount - expected_amount) < 0.01:
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
