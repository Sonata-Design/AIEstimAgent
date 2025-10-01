# ml/app.py
from __future__ import annotations

import io
import os
import uuid
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse
from PIL import Image
from dotenv import load_dotenv

# Roboflow Inference SDK (provided by the 'inference' package you installed)
# The package name is `inference`, but the module you import is `inference_sdk`.
from inference_sdk import InferenceHTTPClient

# ------------------------------------------------------------------------------
# Env & constants
# ------------------------------------------------------------------------------

load_dotenv()

# Provide sane defaults but allow overriding via Render env vars
ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY", "")
DEFAULT_MODEL_ID = os.getenv("DEFAULT_MODEL_ID", "")  # e.g. "workspace/project:version"

# If you want to keep multiple models (floors/columns/walls), set these in Render
FLOOR_MODEL_ID = os.getenv("FLOOR_MODEL_ID", os.getenv("MODEL_FLOOR_ID", ""))
COLUMN_MODEL_ID = os.getenv("COLUMN_MODEL_ID", os.getenv("MODEL_COLUMN_ID", ""))
WALL_MODEL_ID = os.getenv("WALL_MODEL_ID", os.getenv("MODEL_WALL_ID", ""))

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/opt/render/project/src/uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ------------------------------------------------------------------------------
# App
# ------------------------------------------------------------------------------

app = FastAPI(title="AIEstimAgent — ML API", version="1.0.0")

# CORS (relaxed; tighten for production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ALLOW_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------------------------
# Utilities
# ------------------------------------------------------------------------------

def _get_client(api_key: Optional[str] = None) -> InferenceHTTPClient:
    key = (api_key or ROBOFLOW_API_KEY or "").strip()
    if not key:
        raise RuntimeError(
            "Missing ROBOFLOW_API_KEY. Set it in Render -> Environment."
        )
    return InferenceHTTPClient(
        api_url="https://detect.roboflow.com",
        api_key=key,
    )

def _save_upload(upload: UploadFile) -> str:
    # Save to disk (Render ephemeral fs, OK for runtime)
    suffix = os.path.splitext(upload.filename or "")[-1] or ".bin"
    path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4().hex}{suffix}")
    with open(path, "wb") as f:
        f.write(upload.file.read())
    return path

def _image_size_from_bytes(data: bytes) -> tuple[int, int]:
    with Image.open(io.BytesIO(data)) as im:
        return im.width, im.height

def _normalize_predictions(
    raw: Dict[str, Any],
    img_w: int,
    img_h: int,
) -> List[Dict[str, Any]]:
    """
    Roboflow responses can include `x, y, width, height` or `points` for polygons.
    We keep both styles but also add normalized [0..1] coordinates for convenience.
    """
    preds = raw.get("predictions", []) or raw.get("data", {}).get("predictions", [])
    out: List[Dict[str, Any]] = []
    for p in preds:
        item: Dict[str, Any] = {
            "class": p.get("class") or p.get("label"),
            "confidence": float(p.get("confidence", 0.0)),
        }

        # Bounding box variant
        if all(k in p for k in ("x", "y", "width", "height")):
            x = float(p["x"])
            y = float(p["y"])
            w = float(p["width"])
            h = float(p["height"])
            item.update(
                {
                    "bbox": {"x": x, "y": y, "w": w, "h": h},
                    "bbox_norm": {
                        "x": x / img_w if img_w else 0.0,
                        "y": y / img_h if img_h else 0.0,
                        "w": w / img_w if img_w else 0.0,
                        "h": h / img_h if img_h else 0.0,
                    },
                }
            )

        # Polygon variant
        if "points" in p and isinstance(p["points"], list):
            pts = p["points"]
            item["points"] = pts
            item["points_norm"] = [
                {"x": pt["x"] / img_w, "y": pt["y"] / img_h}
                for pt in pts
                if isinstance(pt, dict) and "x" in pt and "y" in pt and img_w and img_h
            ]

        out.append(item)
    return out

def _infer_image(
    image_path: str,
    model_id: str,
    api_key: Optional[str] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """
    Calls Roboflow Inference API for a single model_id.
    `model_id` format: "workspace/project:version"
    """
    client = _get_client(api_key)
    # You can pass extra params like `confidence`, `overlap`, `visualize`, etc. via kwargs.
    return client.infer(image_path, model_id=model_id, **kwargs)

# ------------------------------------------------------------------------------
# Routes
# ------------------------------------------------------------------------------

@app.get("/", response_class=JSONResponse)
def root() -> Dict[str, Any]:
    """
    Simple index so Render doesn't 404 and you get a quick health view.
    """
    return {
        "name": "AIEstimAgent — ML API",
        "status": "ok",
        "docs": "/docs",
        "endpoints": ["/healthz", "/analyze"],
    }

@app.head("/", response_class=PlainTextResponse)
def head_root():
    return PlainTextResponse("ok", status_code=200)

@app.get("/healthz", response_class=PlainTextResponse)
def healthz():
    return PlainTextResponse("ok", status_code=200)

@app.post("/analyze", response_class=JSONResponse)
async def analyze(
    file: UploadFile = File(..., description="Image file (plans/photo)"),
    # choose one explicit model (takes precedence) OR let switches run multiple
    model_id: Optional[str] = Form(
        None,
        description='Roboflow model id like "workspace/project:version". Overrides switches below if provided.',
    ),
    # optional switches to run multiple models in one call
    detect_floors: bool = Form(True),
    detect_columns: bool = Form(True),
    detect_walls: bool = Form(True),
    # optional numeric helpers you might post from the UI
    scale: Optional[float] = Form(
        None, description="Scale in units per pixel (optional; echoed back)."
    ),
    # optional inference params
    confidence: Optional[float] = Form(None),
    overlap: Optional[float] = Form(None),
) -> Dict[str, Any]:
    """
    Upload an image and run Roboflow inference.
    You can either:
      - pass one explicit `model_id`, or
      - let the service run any of the configured switches (floors/columns/walls).
    """
    try:
        # Read bytes for quick dimension probe; also save a temp file for inference call
        data = await file.read()
        if not data:
            raise HTTPException(status_code=400, detail="Empty upload.")

        img_w, img_h = _image_size_from_bytes(data)

        ext = os.path.splitext(file.filename or "")[-1].lower() or ".jpg"
        temp_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4().hex}{ext}")
        with open(temp_path, "wb") as f:
            f.write(data)

        # Common kwargs to inference call
        infer_kwargs: Dict[str, Any] = {}
        if confidence is not None:
            infer_kwargs["confidence"] = confidence
        if overlap is not None:
            infer_kwargs["overlap"] = overlap

        results: Dict[str, Any] = {
            "image": {"width": img_w, "height": img_h},
            "scale": scale,
            "filename": file.filename,
            "models": {},
        }

        # If explicit model_id is provided, only run that one
        if model_id:
            raw = _infer_image(temp_path, model_id=model_id, **infer_kwargs)
            results["models"][model_id] = _normalize_predictions(raw, img_w, img_h)
            return results

        # Otherwise, use the configured switches (if their env var exists)
        errors: Dict[str, str] = {}

        def maybe_run(_switch: bool, _model: str | None, _name: str):
            if not _switch:
                return
            if not _model:
                errors[_name] = f"{_name} model not configured"
                return
            try:
                raw = _infer_image(temp_path, model_id=_model, **infer_kwargs)
                results["models"][_name] = _normalize_predictions(raw, img_w, img_h)
            except Exception as e:  # noqa: BLE001
                errors[_name] = str(e)

        maybe_run(detect_floors, FLOOR_MODEL_ID, "floors")
        maybe_run(detect_columns, COLUMN_MODEL_ID, "columns")
        maybe_run(detect_walls, WALL_MODEL_ID, "walls")

        if errors:
            results["errors"] = errors

        return results

    except HTTPException:
        raise
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(e))


# Convenience: allow Render’s periodic HEAD health probe on /analyze (return 200 quickly)
@app.head("/analyze", response_class=PlainTextResponse)
def head_analyze():
    return PlainTextResponse("ok", status_code=200)
