# ml/app.py  — FULL UPDATED

import os
import shutil
import json
import math
from typing import List, Dict, Any, Tuple
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from inference_sdk import InferenceHTTPClient

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://127.0.0.1:5001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ROOM_API_KEY = os.getenv("ROOM_API_KEY")
ROOM_WORKSPACE = os.getenv("ROOM_WORKSPACE")
ROOM_PROJECT = os.getenv("ROOM_PROJECT")
ROOM_VERSION = os.getenv("ROOM_VERSION")

WALL_API_KEY = os.getenv("WALL_API_KEY")
WALL_WORKSPACE = os.getenv("WALL_WORKSPACE")
WALL_PROJECT = os.getenv("WALL_PROJECT")
WALL_VERSION = os.getenv("WALL_VERSION")

DOORWINDOW_API_KEY = os.getenv("DOORWINDOW_API_KEY")
DOORWINDOW_WORKSPACE = os.getenv("DOORWINDOW_WORKSPACE")
DOORWINDOW_PROJECT = os.getenv("DOORWINDOW_PROJECT")
DOORWINDOW_VERSION = os.getenv("DOORWINDOW_VERSION")

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def _shoelace_area(points: List[Tuple[float, float]]) -> float:
    # polygon area (pixels^2)
    if len(points) < 3:
        return 0.0
    s = 0.0
    for i in range(len(points)):
        x1, y1 = points[i]
        x2, y2 = points[(i + 1) % len(points)]
        s += x1 * y2 - x2 * y1
    return abs(s) / 2.0

def _poly_perimeter(points: List[Tuple[float, float]]) -> float:
    if len(points) < 2:
        return 0.0
    d = 0.0
    for i in range(len(points)):
        x1, y1 = points[i]
        x2, y2 = points[(i + 1) % len(points)]
        d += math.hypot(x2 - x1, y2 - y1)
    return d

def _rect_to_points(x: float, y: float, w: float, h: float) -> List[Tuple[float, float]]:
    # Roboflow bbox often gives center x,y + width + height. Convert to rect points clockwise.
    x0 = x - w / 2.0
    y0 = y - h / 2.0
    return [(x0, y0), (x0 + w, y0), (x0 + w, y0 + h), (x0, y0 + h)]

def _norm_mask(points: List[Tuple[float, float]], img_w: int, img_h: int) -> List[Dict[str, float]]:
    # normalize to [0..1] so frontend can scale easily
    return [{"x": p[0] / img_w, "y": p[1] / img_h} for p in points]

def _bbox_metrics(x: float, y: float, w: float, h: float) -> Dict[str, float]:
    area = w * h
    perimeter = 2 * (w + h)
    return {"area_px2": area, "perimeter_px": perimeter, "width_px": w, "height_px": h}

def run_inference(api_key: str, workspace: str, project: str, version: str, image_path: str):
    if not all([api_key, workspace, project, version]):
        return {"error": f"Missing API config for {project}"}
    try:
        client = InferenceHTTPClient(api_url="https://outline.roboflow.com", api_key=api_key)
        model_id = f"{project}/{version}"
        print(f"[DEBUG] Running: {model_id}")
        result = client.infer(image_path, model_id=model_id)
        return result
    except Exception as e:
        return {"error": str(e)}

def _shape_items(result: Dict[str, Any], category: str, img_w: int, img_h: int) -> List[Dict[str, Any]]:
    """
    Reshape raw roboflow response into per-object items with geometry.
    Expects predictions list with either:
      - bbox: x, y, width, height
      - polygon: 'points' ([[x,y], ...])
    """
    items: List[Dict[str, Any]] = []
    preds = result.get("predictions", []) if isinstance(result, dict) else []
    for i, p in enumerate(preds):
        cls = p.get("class") or p.get("label") or category
        conf = float(p.get("confidence", 0.0))

        # figure out polygon
        points = p.get("points")  # segmentation points (if any)
        if points and isinstance(points, list) and len(points) >= 3:
            # Debug: print the actual structure of points
            print(f"[DEBUG] Points structure for {cls}: {points[:2]}...")  # Show first 2 points
            
            # Handle different point formats from Roboflow API
            try:
                if isinstance(points[0], dict) and 'x' in points[0] and 'y' in points[0]:
                    # Format: [{"x": 100, "y": 200}, ...]
                    poly = [(float(px['x']), float(px['y'])) for px in points]
                elif isinstance(points[0], list) and len(points[0]) >= 2:
                    # Format: [[100, 200], ...]
                    poly = [(float(px[0]), float(px[1])) for px in points]
                else:
                    # Fallback: try to extract x,y from whatever format
                    poly = []
                    for px in points:
                        if hasattr(px, '__getitem__') and len(px) >= 2:
                            poly.append((float(px[0]), float(px[1])))
                        elif isinstance(px, dict):
                            x = px.get('x') or px.get(0)
                            y = px.get('y') or px.get(1)
                            if x is not None and y is not None:
                                poly.append((float(x), float(y)))
                    
                if not poly:
                    raise ValueError("Could not parse points format")
                        
            except (KeyError, IndexError, TypeError, ValueError) as e:
                print(f"[ERROR] Failed to parse points for {cls}: {e}")
                print(f"[ERROR] Points sample: {points[:3] if len(points) > 3 else points}")
                # Fall back to bbox processing
                points = None
                
        if points and isinstance(points, list) and len(points) >= 3:
            area = _shoelace_area(poly)
            perim = _poly_perimeter(poly)
            width = max(px for px, _ in poly) - min(px for px, _ in poly)
            height = max(py for _, py in poly) - min(py for _, py in poly)
            mask = _norm_mask(poly, img_w, img_h)
            bbox_metrics = {
                "area_px2": area,
                "perimeter_px": perim,
                "width_px": width,
                "height_px": height,
            }
        else:
            # fall back to bbox
            x = float(p.get("x", 0.0))
            y = float(p.get("y", 0.0))
            w = float(p.get("width", 0.0))
            h = float(p.get("height", 0.0))
            rect = _rect_to_points(x, y, w, h)
            mask = _norm_mask(rect, img_w, img_h)
            bbox_metrics = _bbox_metrics(w=w, h=h, x=x, y=y)

        item = {
            "id": f"{category}-{i}",
            "class": cls,
            "confidence": conf,
            "category": category,
            "metrics": bbox_metrics,
            "mask": mask,  # normalized polygon points
        }

        # Category-specific extras for the sidebar
        if category in ("openings", "doors", "windows"):
            item["display"] = {
                "width": bbox_metrics["width_px"],
                "height": bbox_metrics["height_px"],
            }
        elif category in ("rooms", "flooring"):
            item["display"] = {
                "area": bbox_metrics["area_px2"],
                "perimeter": bbox_metrics["perimeter_px"],
            }
            # Provide editable default name
            item["name"] = cls.capitalize()
        elif category == "walls":
            # Heuristic: use polygon perimeter as “outer”, bbox 2*(w+h) as “inner”
            outer_p = bbox_metrics["perimeter_px"]
            inner_p = max(0.0, outer_p * 0.94)  # tiny reduction as a placeholder
            item["display"] = {
                "inner_perimeter": inner_p,
                "outer_perimeter": outer_p,
            }

        items.append(item)
    return items

def _image_dims(path: str) -> Tuple[int, int]:
    # lightweight PIL-free approach: try to import Pillow if available
    try:
        from PIL import Image
        with Image.open(path) as im:
            return im.width, im.height
    except Exception:
        # fallback: assume common size if unknown
        return (2000, 1500)

@app.post("/analyze")
async def analyze(file: UploadFile = File(...), types: str = Form(...), scale: str = Form(default="1/4\" = 1'")):
    selected_types = json.loads(types)

    save_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(save_path, "wb") as buf:
        shutil.copyfileobj(file.file, buf)

    img_w, img_h = _image_dims(save_path)
    predictions = {}
    errors = {}

    # Doors & Windows
    if "openings" in selected_types:
        r = run_inference(DOORWINDOW_API_KEY, DOORWINDOW_WORKSPACE, DOORWINDOW_PROJECT, DOORWINDOW_VERSION, save_path)
        if "error" in r:
            errors["openings"] = r["error"]
            predictions["openings"] = []
        else:
            predictions["openings"] = _shape_items(r, "openings", img_w, img_h)

    # Rooms / Flooring
    if "flooring" in selected_types:
        r = run_inference(ROOM_API_KEY, ROOM_WORKSPACE, ROOM_PROJECT, ROOM_VERSION, save_path)
        if "error" in r:
            errors["rooms"] = r["error"]
            predictions["rooms"] = []
        else:
            predictions["rooms"] = _shape_items(r, "rooms", img_w, img_h)

    # Walls
    if "walls" in selected_types:
        r = run_inference(WALL_API_KEY, WALL_WORKSPACE, WALL_PROJECT, WALL_VERSION, save_path)
        if "error" in r:
            errors["walls"] = r["error"]
            predictions["walls"] = []
        else:
            predictions["walls"] = _shape_items(r, "walls", img_w, img_h)

    return JSONResponse({
        "filename": file.filename,
        "image": {"width": img_w, "height": img_h},
        "scale": scale,
        "predictions": predictions,
        "errors": errors
    })
