"""
TRUSTTRACE Multi-Layer Image Forensic Engine (Vectorized & Memory-Optimized)
Executes Error Level Analysis (ELA), Vectorized Noise Variance Analysis, EXIF Integrity Extraction,
and OCR Typography / Baseline Alignment Verification with Edge-Case Normalization.
"""

from __future__ import annotations

import io
import math
import base64
import logging
from typing import Dict, Any, List, Tuple, Optional
from pydantic import BaseModel, Field

import numpy as np
from PIL import Image, ImageChops, ImageEnhance, ExifTags
from edge_cases import EdgeCaseMitigationEngine, ImageNormalizationResult

logger = logging.getLogger("trusttrace.forensics")

# Try importing OpenCV, fallback to NumPy implementations if headless/missing
try:
    import cv2
    HAS_OPENCV = True
except ImportError:
    HAS_OPENCV = False
    logger.warning("OpenCV not found. Using pure NumPy/Pillow fallback implementations.")

# Try importing pytesseract
try:
    import pytesseract
    HAS_TESSERACT = True
except ImportError:
    HAS_TESSERACT = False
    logger.warning("Pytesseract not found. Layout analyzer will utilize geometric fallback.")

# Known photo editing software signatures in EXIF/XMP
KNOWN_EDITING_SUITES = [
    "photoshop", "adobe", "gimp", "canva", "pixlr", "lightroom",
    "procreate", "snapseed", "faceapp", "pixelmator", "paint.net",
    "corel", "inshot", "picsart", "vsco", "remini", "affinity"
]


class BoundingBox(BaseModel):
    x: int
    y: int
    width: int
    height: int
    anomaly_type: str
    confidence: float


class ELAResult(BaseModel):
    mean_error: float
    max_error: float
    variance: float
    anomaly_score: float  # 0.0 - 1.0
    heatmap_base64: str
    anomaly_regions: List[BoundingBox] = Field(default_factory=list)


class NoiseAnalysisResult(BaseModel):
    global_noise_variance: float
    max_block_variance_ratio: float
    inconsistency_score: float  # 0.0 - 1.0
    noise_map_base64: str
    flagged_blocks_count: int
    suspicious_regions: List[BoundingBox] = Field(default_factory=list)


class MetadataForensicResult(BaseModel):
    raw_metadata: Dict[str, Any]
    camera_make: Optional[str] = None
    camera_model: Optional[str] = None
    software_detected: Optional[str] = None
    is_editing_software_detected: bool = False
    is_metadata_stripped: bool = False
    date_created: Optional[str] = None
    date_modified: Optional[str] = None
    is_chronology_suspicious: bool = False
    tamper_signals: List[str] = Field(default_factory=list)


class OCRLayoutResult(BaseModel):
    text_detected: bool
    word_count: int
    baseline_variance_avg: float
    kerning_anomaly_count: int
    font_size_jump_count: int
    layout_inconsistency_score: float  # 0.0 - 1.0
    flagged_text_boxes: List[BoundingBox] = Field(default_factory=list)
    extracted_text_snippet: Optional[str] = None


class CompleteForensicInspection(BaseModel):
    ela: ELAResult
    noise: NoiseAnalysisResult
    metadata: MetadataForensicResult
    layout: OCRLayoutResult
    overall_manipulation_probability: float
    edge_case_diagnostics: Optional[Dict[str, Any]] = None


class ImageForensicEngine:
    """Production Multi-Layer Forensic Inspection Engine with SIMD/Vectorized Optimizations."""

    def __init__(self, ela_quality: int = 90, ela_scale: float = 15.0):
        self.ela_quality = ela_quality
        self.ela_scale = ela_scale
        self.edge_handler = EdgeCaseMitigationEngine(max_dimension=4096)

    @staticmethod
    def _image_to_base64(img: Image.Image, format: str = "PNG") -> str:
        """Converts PIL Image to base64 Data URL with memory buffer cleanup."""
        buffer = io.BytesIO()
        try:
            img.save(buffer, format=format)
            encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
            return f"data:image/{format.lower()};base64,{encoded}"
        finally:
            buffer.close()

    def perform_error_level_analysis(
        self, image: Image.Image, threshold_adjustment: float = 1.0
    ) -> ELAResult:
        """
        Error Level Analysis (ELA) with Vectorized Downsampling.
        Re-saves the image at quality 90 and calculates absolute pixel error.
        Downsampled anomaly zones are computed using vectorized block operations.
        """
        orig_rgb = image.convert("RGB")
        w, h = orig_rgb.size

        # In-memory JPEG resave
        compressed_buffer = io.BytesIO()
        try:
            orig_rgb.save(compressed_buffer, "JPEG", quality=self.ela_quality)
            compressed_buffer.seek(0)
            resaved_rgb = Image.open(compressed_buffer)

            # Absolute difference map
            diff = ImageChops.difference(orig_rgb, resaved_rgb)
        finally:
            compressed_buffer.close()

        # Scale difference to highlight subtle quantization variations
        extrema = diff.getextrema()
        max_diff = max([ex[1] for ex in extrema]) if extrema else 1
        scale = 255.0 / max(max_diff, 1) * (self.ela_scale / 10.0)
        scale = min(scale, 35.0)

        enhanced_diff = ImageEnhance.Brightness(diff).enhance(scale)

        # Numerical variance calculation
        diff_arr = np.asarray(diff, dtype=np.float32)
        mean_err = float(np.mean(diff_arr))
        max_err = float(np.max(diff_arr))
        variance = float(np.var(diff_arr))

        # False-color heatmap generation
        diff_gray = np.mean(diff_arr, axis=2).astype(np.uint8)
        if HAS_OPENCV:
            norm_gray = cv2.normalize(diff_gray, None, 0, 255, cv2.NORM_MINMAX)
            heatmap_cv = cv2.applyColorMap(norm_gray, cv2.COLORMAP_JET)
            heatmap_rgb = cv2.cvtColor(heatmap_cv, cv2.COLOR_BGR2RGB)
            heatmap_img = Image.fromarray(heatmap_rgb)
        else:
            heatmap_img = enhanced_diff

        # Vectorized anomaly region detection using 32x32 block reshape
        anomaly_regions: List[BoundingBox] = []
        threshold = (mean_err + 2.5 * math.sqrt(variance + 1e-6)) * threshold_adjustment
        grid_size = 32

        n_rows = h // grid_size
        n_cols = w // grid_size

        if n_rows > 0 and n_cols > 0:
            # Crop to exact multiple of grid_size
            cropped = diff_gray[:n_rows * grid_size, :n_cols * grid_size]
            # Reshape into blocks (n_rows, grid_size, n_cols, grid_size)
            blocks = cropped.reshape(n_rows, grid_size, n_cols, grid_size).transpose(0, 2, 1, 3)
            # Vectorized block means
            block_means = np.mean(blocks, axis=(2, 3))
            spike_mask = block_means > (threshold * 1.4)
            spike_indices = np.argwhere(spike_mask)

            for r, c in spike_indices[:15]:
                gx = int(c * grid_size)
                gy = int(r * grid_size)
                mean_val = float(block_means[r, c])
                anomaly_regions.append(
                    BoundingBox(
                        x=gx,
                        y=gy,
                        width=grid_size,
                        height=grid_size,
                        anomaly_type="ELA_COMPRESSION_SPIKE",
                        confidence=min(1.0, float(mean_val / max(threshold * 2.0, 1e-3)))
                    )
                )

        # Baseline variance score with threshold normalization
        anomaly_score = min(1.0, (variance / 25.0) / threshold_adjustment)

        # Explicit cleanup
        del diff_arr
        del diff_gray

        return ELAResult(
            mean_error=round(mean_err, 4),
            max_error=round(max_err, 4),
            variance=round(variance, 4),
            anomaly_score=round(anomaly_score, 4),
            heatmap_base64=self._image_to_base64(heatmap_img),
            anomaly_regions=anomaly_regions[:15]
        )

    def perform_noise_variance_analysis(
        self, image: Image.Image, block_size: int = 32
    ) -> NoiseAnalysisResult:
        """
        Vectorized Noise Variance Analysis.
        Applies Laplacian 2nd derivative convolution and computes block variances
        using SIMD matrix tensor operations instead of nested loops.
        """
        gray_img = image.convert("L")
        gray_arr = np.asarray(gray_img, dtype=np.float32)
        h, w = gray_arr.shape

        if HAS_OPENCV:
            laplacian = cv2.Laplacian(gray_arr, cv2.CV_32F)
        else:
            kernel = np.array([[0, 1, 0], [1, -4, 1], [0, 1, 0]], dtype=np.float32)
            padded = np.pad(gray_arr, 1, mode="edge")
            laplacian = (
                padded[:-2, 1:-1] * kernel[0, 1] +
                padded[1:-1, :-2] * kernel[1, 0] +
                padded[1:-1, 1:-1] * kernel[1, 1] +
                padded[1:-1, 2:] * kernel[1, 2] +
                padded[2:, 1:-1] * kernel[2, 1]
            )

        global_var = float(np.var(laplacian))
        if global_var == 0:
            global_var = 1e-6

        # Vectorized block variance computation
        n_rows = h // block_size
        n_cols = w // block_size

        flagged_count = 0
        max_ratio = 1.0
        suspicious_regions: List[BoundingBox] = []
        noise_vis = np.zeros((h, w), dtype=np.uint8)

        if n_rows > 0 and n_cols > 0:
            cropped = laplacian[:n_rows * block_size, :n_cols * block_size]
            # Reshape into (n_rows, block_size, n_cols, block_size) -> (n_rows, n_cols, block_size, block_size)
            blocks = cropped.reshape(n_rows, block_size, n_cols, block_size).transpose(0, 2, 1, 3)
            # Vectorized variance across each block
            block_vars = np.var(blocks, axis=(2, 3))
            ratios = block_vars / global_var
            max_ratio = float(np.max(ratios)) if ratios.size > 0 else 1.0

            # Find anomalous blocks (extreme spikes or unnatural flat zones)
            anom_mask = (ratios > 3.2) | (ratios < 0.08)
            flagged_count = int(np.sum(anom_mask))
            flagged_indices = np.argwhere(anom_mask)

            for r, c in flagged_indices:
                by = int(r * block_size)
                bx = int(c * block_size)
                noise_vis[by:by + block_size, bx:bx + block_size] = 255

            for r, c in flagged_indices[:15]:
                by = int(r * block_size)
                bx = int(c * block_size)
                ratio_val = float(ratios[r, c])
                suspicious_regions.append(
                    BoundingBox(
                        x=bx,
                        y=by,
                        width=block_size,
                        height=block_size,
                        anomaly_type="NOISE_INCONSISTENCY_BLOCK",
                        confidence=min(1.0, abs(ratio_val - 1.0) / 4.0)
                    )
                )

        # Render noise map overlay
        if HAS_OPENCV:
            colored_noise = cv2.applyColorMap(noise_vis, cv2.COLORMAP_MAGMA)
            noise_img = Image.fromarray(cv2.cvtColor(colored_noise, cv2.COLOR_BGR2RGB))
        else:
            noise_img = Image.fromarray(noise_vis).convert("RGB")

        inconsistency_score = min(1.0, (flagged_count * (block_size ** 2)) / max(w * h * 0.15, 1.0))

        # Explicit cleanup
        del gray_arr
        del laplacian
        del noise_vis

        return NoiseAnalysisResult(
            global_noise_variance=round(global_var, 4),
            max_block_variance_ratio=round(max_ratio, 4),
            inconsistency_score=round(inconsistency_score, 4),
            noise_map_base64=self._image_to_base64(noise_img),
            flagged_blocks_count=flagged_count,
            suspicious_regions=suspicious_regions[:15]
        )

    def extract_metadata_forensics(self, image: Image.Image) -> MetadataForensicResult:
        """
        Extracts full EXIF, TIFF tags, and checks for editing software fingerprints,
        chronology discrepancies, and metadata stripping.
        """
        raw_metadata: Dict[str, Any] = {}
        tamper_signals: List[str] = []
        camera_make = None
        camera_model = None
        software_detected = None
        date_created = None
        date_modified = None
        is_editing_detected = False
        is_chronology_suspicious = False

        try:
            exif_data = image._getexif()
            if exif_data:
                for tag_id, value in exif_data.items():
                    tag_name = ExifTags.TAGS.get(tag_id, str(tag_id))
                    if isinstance(value, bytes):
                        try:
                            value = value.decode("utf-8", errors="ignore").strip("\x00")
                        except Exception:
                            value = f"<bytes len={len(value)}>"
                    raw_metadata[tag_name] = str(value)

                camera_make = raw_metadata.get("Make")
                camera_model = raw_metadata.get("Model")
                software_detected = raw_metadata.get("Software")
                date_created = raw_metadata.get("DateTimeOriginal") or raw_metadata.get("DateTime")
                date_modified = raw_metadata.get("ModifyDate") or raw_metadata.get("DateTime")

                if software_detected:
                    sw_lower = software_detected.lower()
                    for suite in KNOWN_EDITING_SUITES:
                        if suite in sw_lower:
                            is_editing_detected = True
                            tamper_signals.append(f"EDITING_SOFTWARE_EXPLICIT:{software_detected}")
                            break

                if date_created and date_modified and date_created != date_modified:
                    tamper_signals.append(f"CHRONOLOGY_MISMATCH:Created={date_created},Modified={date_modified}")
                    is_chronology_suspicious = True
            else:
                tamper_signals.append("METADATA_ABSENT_OR_STRIPPED")
        except Exception as e:
            logger.warning(f"Error parsing EXIF metadata: {e}")
            tamper_signals.append("METADATA_PARSING_FAULT")

        is_stripped = len(raw_metadata) == 0

        return MetadataForensicResult(
            raw_metadata=raw_metadata,
            camera_make=camera_make,
            camera_model=camera_model,
            software_detected=software_detected,
            is_editing_software_detected=is_editing_detected,
            is_metadata_stripped=is_stripped,
            date_created=date_created,
            date_modified=date_modified,
            is_chronology_suspicious=is_chronology_suspicious,
            tamper_signals=tamper_signals
        )

    def analyze_ocr_layout_alignment(self, image: Image.Image) -> OCRLayoutResult:
        """
        OCR & Layout Alignment Checker.
        Extracts horizontal textlines, evaluates baseline regression alignment,
        detects abnormal kerning, and flags font size jumps.
        """
        flagged_boxes: List[BoundingBox] = []
        baseline_variances: List[float] = []
        kerning_anomalies = 0
        font_jumps = 0
        extracted_snippet = ""
        word_count = 0

        if HAS_TESSERACT:
            try:
                ocr_data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
                n_boxes = len(ocr_data["text"])
                lines: Dict[int, List[Dict[str, Any]]] = {}

                for i in range(n_boxes):
                    text = ocr_data["text"][i].strip()
                    conf = float(ocr_data["conf"][i])
                    if not text or conf < 30:
                        continue

                    word_count += 1
                    line_num = ocr_data["line_num"][i]
                    item = {
                        "text": text,
                        "x": ocr_data["left"][i],
                        "y": ocr_data["top"][i],
                        "w": ocr_data["width"][i],
                        "h": ocr_data["height"][i],
                        "baseline_y": ocr_data["top"][i] + ocr_data["height"][i]
                    }
                    lines.setdefault(line_num, []).append(item)

                for line_num, words in lines.items():
                    if len(words) < 2:
                        continue

                    baselines = [w["baseline_y"] for w in words]
                    line_var = float(np.var(baselines))
                    baseline_variances.append(line_var)

                    if line_var > 14.0:
                        for w in words:
                            flagged_boxes.append(
                                BoundingBox(
                                    x=w["x"],
                                    y=w["y"],
                                    width=w["w"],
                                    height=w["h"],
                                    anomaly_type="BASELINE_ALIGNMENT_IRREGULARITY",
                                    confidence=min(1.0, line_var / 30.0)
                                )
                            )

                    for idx in range(len(words) - 1):
                        w1, w2 = words[idx], words[idx + 1]
                        gap = w2["x"] - (w1["x"] + w1["w"])
                        height_diff = abs(w1["h"] - w2["h"])

                        if gap < -3 or gap > w1["h"] * 3.0:
                            kerning_anomalies += 1

                        if height_diff > max(w1["h"], w2["h"]) * 0.40:
                            font_jumps += 1
                            flagged_boxes.append(
                                BoundingBox(
                                    x=w2["x"],
                                    y=w2["y"],
                                    width=w2["w"],
                                    height=w2["h"],
                                    anomaly_type="FONT_SIZE_DISCONTINUITY",
                                    confidence=min(1.0, height_diff / 20.0)
                                )
                            )

                snippet_words = [t for t in ocr_data["text"] if t.strip()]
                extracted_snippet = " ".join(snippet_words[:25])

            except Exception as e:
                logger.warning(f"Tesseract extraction encountered an issue: {e}")

        avg_baseline_var = float(np.mean(baseline_variances)) if baseline_variances else 0.0
        layout_inconsistency_score = min(
            1.0, (avg_baseline_var / 20.0) + (kerning_anomalies * 0.1) + (font_jumps * 0.15)
        )

        return OCRLayoutResult(
            text_detected=word_count > 0,
            word_count=word_count,
            baseline_variance_avg=round(avg_baseline_var, 3),
            kerning_anomaly_count=kerning_anomalies,
            font_size_jump_count=font_jumps,
            layout_inconsistency_score=round(layout_inconsistency_score, 3),
            flagged_text_boxes=flagged_boxes[:20],
            extracted_text_snippet=extracted_snippet or None
        )

    def analyze_image(
        self, image_input: Image.Image | str | bytes, filename: str = "evidence.png"
    ) -> CompleteForensicInspection:
        """
        Runs the entire multi-tier forensic inspection suite on an image
        with edge-case normalization (dark-mode adaptation, social media tuning).
        """
        if isinstance(image_input, (str, bytes)):
            if isinstance(image_input, str):
                raw_image = Image.open(image_input)
            else:
                raw_image = Image.open(io.BytesIO(image_input))
        else:
            raw_image = image_input

        # 1. Extract EXIF metadata before normalization/downsampling
        meta_res = self.extract_metadata_forensics(raw_image)

        # 2. Apply Edge-Case Mitigation & Normalization
        norm_res = self.edge_handler.normalize_image(
            raw_image, filename=filename, exif_tags=meta_res.raw_metadata
        )
        processed_image = norm_res.normalized_image

        # 3. Dynamic threshold tuning based on social media re-compression
        threshold_adj = norm_res.social_profile.recommended_ela_threshold_adjustment

        # 4. Multi-Layer Execution
        ela_res = self.perform_error_level_analysis(processed_image, threshold_adjustment=threshold_adj)
        noise_res = self.perform_noise_variance_analysis(processed_image)
        ocr_res = self.analyze_ocr_layout_alignment(processed_image)

        # 5. Composite manipulation probability calculation
        # If metadata is missing but it's a known social platform (WhatsApp/Telegram), do NOT penalize as tampering!
        meta_penalty = 0.0
        if meta_res.is_editing_software_detected:
            meta_penalty = 1.0
        elif meta_res.is_metadata_stripped:
            if norm_res.social_profile.is_social_media_compressed:
                meta_penalty = 0.0  # Legitimate platform sanitization
            else:
                meta_penalty = 0.15  # Unverified web download

        # Check for alpha channel tampering
        alpha_penalty = 0.35 if norm_res.alpha_audit.has_hidden_transparent_layers else 0.0

        prob = (
            ela_res.anomaly_score * 0.35 +
            noise_res.inconsistency_score * 0.25 +
            meta_penalty * 0.20 +
            ocr_res.layout_inconsistency_score * 0.20 +
            alpha_penalty
        )
        prob = min(1.0, max(0.0, prob))

        edge_diagnostics = {
            "was_resized": norm_res.was_resized_for_safety,
            "original_mode": norm_res.original_mode,
            "is_social_media": norm_res.social_profile.is_social_media_compressed,
            "platform_hint": norm_res.social_profile.platform_hint,
            "is_dark_mode": norm_res.is_dark_mode,
            "has_alpha_channel": norm_res.alpha_audit.has_alpha,
            "alpha_tamper_flag": norm_res.alpha_audit.tamper_risk_flag,
        }

        return CompleteForensicInspection(
            ela=ela_res,
            noise=noise_res,
            metadata=meta_res,
            layout=ocr_res,
            overall_manipulation_probability=round(prob, 4),
            edge_case_diagnostics=edge_diagnostics
        )
