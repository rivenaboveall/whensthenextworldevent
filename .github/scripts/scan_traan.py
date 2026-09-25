import os
import sys
import json
import re
import urllib.request
import urllib.error
import difflib
from PIL import Image, ImageOps
from paddleocr import PaddleOCR

script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(script_dir)

def load_env_file(filepath=".env"):
    if not os.path.exists(filepath):
        return
    with open(filepath, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, val = line.split("=", 1)
            key = key.strip()
            val = val.strip().strip("'\"")
            if key not in os.environ:
                os.environ[key] = val

load_env_file()

if sys.platform == "win32":
    import winreg
    for var_name in ["DISCORD_TOKEN", "CHANNEL_ID", "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"]:
        if not os.environ.get(var_name):
            try:
                reg_key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Environment")
                val, _ = winreg.QueryValueEx(reg_key, var_name)
                if val:
                    os.environ[var_name] = str(val)
                winreg.CloseKey(reg_key)
            except Exception:
                pass

upstash_url = os.environ.get("UPSTASH_REDIS_REST_URL")
upstash_token = os.environ.get("UPSTASH_REDIS_REST_TOKEN")
if not upstash_url or not upstash_token:
    sys.exit("missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN")

ITEM_DATABASE = None
try:
    req_db = urllib.request.Request(
        f"{upstash_url}/json.get/TRAAN_ALLITEMS",
        headers={"Authorization": f"Bearer {upstash_token}"}
    )
    with urllib.request.urlopen(req_db, timeout=10) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        raw = data.get("result")
        ITEM_DATABASE = json.loads(raw) if isinstance(raw, str) else raw
except Exception as e:
    sys.exit(f"Failed to fetch item database from Upstash: {e}")

if not ITEM_DATABASE:
    sys.exit("Item database is empty or unavailable.")

TOKEN = os.environ.get("DISCORD_TOKEN")
CHANNEL_ID = os.environ.get("CHANNEL_ID")

if not TOKEN or not CHANNEL_ID:
    sys.exit("missing DISCORD_TOKEN or CHANNEL_ID, somehow")

url = f"https://discord.com/api/v10/channels/{CHANNEL_ID}/messages?limit=3"
req = urllib.request.Request(
    url,
    headers={
        "Authorization": f"Bot {TOKEN}",
        "User-Agent": "DiscordBot (https://github.com, 1.0)"
    }
)

try:
    with urllib.request.urlopen(req) as resp:
        messages = json.loads(resp.read().decode())
except urllib.error.HTTPError as err:
    sys.exit(f"api err: {err.code} - {err.reason}")

messages.sort(key=lambda m: int(m["id"]), reverse=True)

def extract_image_url(message):
    for att in message.get("attachments", []):
        ctype = att.get("content_type", "")
        fname = att.get("filename", "").lower()
        if ctype.startswith("image/") or fname.endswith((".png", ".jpg", ".jpeg", ".webp")):
            return att.get("url")

    for embed in message.get("embeds", []):
        if "image" in embed and "url" in embed["image"]:
            return embed["image"]["url"]
        if "thumbnail" in embed and "url" in embed["thumbnail"]:
            return embed["thumbnail"]["url"]

    return None

target_image_url = None
target_message = None

for msg in messages:
    img_url = extract_image_url(msg)
    if img_url:
        target_image_url = img_url
        target_message = msg
        break

if not target_image_url:
    print("no images found in the last 3 messages, please stop yapping")
    sys.exit(0)

temp_img_path = "temp_scan.png"

img_req = urllib.request.Request(
    target_image_url,
    headers={"User-Agent": "Mozilla/5.0"}
)
with urllib.request.urlopen(img_req) as response, open(temp_img_path, "wb") as out_file:
    out_file.write(response.read())

def locate_shop_header(rec_texts, rec_boxes, img_height):
    for text, box in zip(rec_texts, rec_boxes):
        min_y = box[1]
        if min_y > img_height * 0.40:
            continue
        text_low = text.lower()
        if any(k in text_low for k in ["salvaged", "stock"]):
            return "stock", min_y
        if any(k in text_low for k in ["black", "cache", "market"]):
            return "cache", min_y

    for text in rec_texts:
        text_low = text.lower()
        if "black market" in text_low or "cache" in text_low:
            return "cache", None
        if "salvaged" in text_low or "stock" in text_low or "traan" in text_low:
            return "stock", None

    return None, None

def is_likely_item_title(text):
    clean = text.strip()
    if len(clean) < 3:
        return False
    if clean.lower() in {"purchase", "traan's", "salvaged", "stock", "traan", "black market", "cache"}:
        return False
    if re.fullmatch(r"^\d+\s*[\S]*$", clean):
        return False
    if any(p in clean for p in ["?", "!", "...", "*"]):
        return False
    if len(clean.split()) > 4:
        return False
    return True

def match_items_from_text(text_lines, shop_mode):
    catalog = ITEM_DATABASE.get(shop_mode, ITEM_DATABASE.get("stock", {}))
    detected_items = {}

    filtered_lines = [line for line in text_lines if is_likely_item_title(line)]

    for raw_line in filtered_lines:
        clean_line = re.sub(r"[^a-zA-Z0-9\s'-]", "", raw_line).strip()
        clean_line_low = clean_line.lower()

        best_match = None
        best_score = 0.0

        for name, data in catalog.items():
            name_low = name.lower()
            score = difflib.SequenceMatcher(None, name_low, clean_line_low).ratio()
            req_score = 0.88 if len(name.split()) > 1 else 0.92

            if score >= req_score and score > best_score:
                best_score = score
                best_match = (name, data)

        if best_match:
            name, data = best_match
            if name not in detected_items or best_score > detected_items[name]["score"]:
                detected_items[name] = {
                    "name": name,
                    "price": data["price"],
                    "currency": data["currency"],
                    "category": data["category"],
                    "score": best_score
                }

    sorted_items = sorted(detected_items.values(), key=lambda x: x["score"], reverse=True)[:8]

    return [{
        "name": item["name"],
        "price": item["price"],
        "currency": item["currency"],
        "category": item["category"]
    } for item in sorted_items]
    
try:
    img = Image.open(temp_img_path)
    img = ImageOps.expand(img, border=20, fill="black")
    img.save(temp_img_path)
    w, h = img.size

    ocr = PaddleOCR(use_textline_orientation=False, lang="en", enable_mkldnn=False)
    ocr_output = list(ocr.predict(temp_img_path))
    res = ocr_output[0] if ocr_output else {}
    rec_texts = res.get("rec_texts", [])
    rec_boxes = res.get("rec_boxes", [])

    shop_type, header_y = locate_shop_header(rec_texts, rec_boxes, h)
    is_traan = shop_type is not None

    all_lines = []
    for text, box in zip(rec_texts, rec_boxes):
        min_y = box[1]
        if header_y is not None and min_y <= header_y:
            continue
        all_lines.append(text)

    active_mode = shop_type if shop_type else "stock"
    items_found = match_items_from_text(all_lines, active_mode)

    if not is_traan and len(items_found) >= 2:
        is_traan = True

    if not is_traan:
        items_found = []

    result = {
        "found_image": True,
        "is_valid_traan": is_traan,
        "shop_type": shop_type,
        "image_url": target_image_url,
        "message_id": target_message["id"],
        "stock_count": len(items_found),
        "items": items_found
    }

    current_stock = {
        "shop_type": shop_type,
        "items": items_found
    }

    print(f"items: ({len(items_found)}):")
    for itm in items_found:
        print(f" - {itm['name']} ({itm['price']} {itm['currency']}) [{itm['category']}]")

except Exception as e:
    print(f"OCR error: {e}", file=sys.stderr)
    result = {"found_image": True, "is_valid_traan": False, "items": []}
    current_stock = {"shop_type": None, "items": []}
finally:
    if os.path.exists(temp_img_path):
        os.remove(temp_img_path)

upstash_url = os.environ.get("UPSTASH_REDIS_REST_URL")
upstash_token = os.environ.get("UPSTASH_REDIS_REST_TOKEN")
if upstash_url and upstash_token:
    cmd = ["JSON.SET", "TRAAN_STOCK", "$", json.dumps(current_stock)]
    req_upstash = urllib.request.Request(
        upstash_url,
        data=json.dumps(cmd).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {upstash_token}",
            "Content-Type": "application/json"
        },
        method="POST"
    )
    try:
        with urllib.request.urlopen(req_upstash, timeout=10) as resp:
            print("Upstash Redis TRAAN_STOCK updated successfully.")
    except Exception as e:
        print(f"Failed to update Upstash Redis: {e}", file=sys.stderr)
else:
    print(json.dumps(current_stock, indent=2))