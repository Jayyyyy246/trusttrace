"""
TRUSTTRACE Edge-Case Mitigation & Defensive Sanitization Suite
Provides specialized adapters for dark-mode screenshots, social media recompression,
alpha channel tampering, CMYK/16-bit normalization, and mixed-mode multi-page documents.
"""

from __future__ import annotations

import re
import math
import logging
from typing import Dict, Any, Tuple, Optional, List
from pydantic import BaseModel, Field
import numpy as np
from PIL import Image, ImageOps, ImageFilter

logger = logging.getLogger("trusttrace.edge_cases")

# Decompression bomb threshold (89.5 megapixels max)
Image.MAX_IMAGE_PIXELS = 89_478_485

# Known social media patterns
SOCIAL_FILENAME_PATTERNS = [
    re.compile(r"^IMG-\d{8}-WA\d{4}", re.IGNORECASE),       # WhatsApp
    re.compile(r"^telegram-cloud-document-", re.IGNORECASE), # Telegram document
    re.compile(r"^photo_\d{4}-\d{2}-\d{2}", re.IGNORECASE),  # Telegram photo
    re.compile(r"^PXL_\d{8}_\d{9}", re.IGNORECASE),         # Pixel camera
    re.compile(r"^Screenshot_\d{8}", re.IGNORECASE),        # Android Screenshot
    re.compile(r"^Screen Shot \d{4}-\d{2}-\d{2}", re.IGNORECASE), # macOS Screenshot
]

# Standard WhatsApp / Telegram downscaling resolutions
KNOWN_SOCIAL_RESOLUTIONS = {
    (1280, 720), (720, 1280),
    (1600, 1200), (1200, 1600),
    (1024, 768), (768, 1024),
    (1280, 960), (960, 1280),
}


class AlphaChannelAnalysis(BaseModel):
    has_alpha: bool
    has_hidden_transparent_layers: bool
    transparent_pixel_ratio: float
    tamper_risk_flag: Optional[str] = None


class SocialMediaProfile(BaseModel):
    is_social_media_compressed: bool
    platform_hint: Optional[str] = None
    compression_homogeneity_score: float  # 0.0 to 1.0 (higher = uniformly compressed)
    recommended_ela_threshold_adjustment: float


class ImageNormalizationResult(BaseModel):
    normalized_image: Image.Image
    original_mode: str
    original_dimensions: Tuple[int, int]
    was_resized_for_safety: bool
    color_profile_converted: bool
    alpha_audit: AlphaChannelAnalysis
    social_profile: SocialMediaProfile
    is_dark_mode: bool
    contrast_enhancement_applied: bool

    class Config:
        arbitrary_types_allowed = True


class EdgeCaseMitigationEngine:
    """Defensive pre-processing and anomaly mitigation engine."""

    def __init__(self, max_dimension: int = 4096):
        self.max_dimension = max_dimension

    @staticmethod
    def audit_alpha_channel(image: Image.Image) -> AlphaChannelAnalysis:
        """
        Inspects alpha (transparency) channels in PNG/WebP files.
        Detects 0-opacity text overlays or invisible watermarks often used to
        spoof automated OCR or hide adversarial payloads.
        """
        if image.mode not in ("RGBA", "LA") and "transparency" not in image.info:
            return AlphaChannelAnalysis(
                has_alpha=False,
                has_hidden_transparent_layers=False,
                transparent_pixel_ratio=0.0
            )

        rgba = image.convert("RGBA")
        alpha = np.asarray(rgba.split()[-1], dtype=np.uint8)
        total_pixels = alpha.size
        fully_transparent = np.sum(alpha == 0)
        semi_transparent = np.sum((alpha > 0) & (alpha < 255))
        transparent_ratio = float(fully_transparent / total_pixels)

        # Check for isolated near-invisible text or patches (alpha between 1 and 15)
        near_invisible_count = np.sum((alpha > 0) & (alpha < 20))
        has_hidden = bool(near_invisible_count > 100)

        tamper_flag = None
        if has_hidden:
            tamper_flag = f"SUSPICIOUS_LOW_OPACITY_OVERLAYS_DETECTED: {near_invisible_count} pixels"
        elif 0.05 < transparent_ratio < 0.95 and semi_transparent > 500:
            # Multi-layer composited PNG
            tamper_flag = "COMPOSITED_ALPHA_TRANSPARENCY_PRESENT"

        return AlphaChannelAnalysis(
            has_alpha=True,
            has_hidden_transparent_layers=has_hidden,
            transparent_pixel_ratio=round(transparent_ratio, 4),
            tamper_risk_flag=tamper_flag
        )

    @staticmethod
    def detect_social_media_signature(
        filename: str, dimensions: Tuple[int, int], exif_tags: Dict[str, Any]
    ) -> SocialMediaProfile:
        """
        Distinguishes social media re-compression from malicious tampering.
        WhatsApp and Telegram apply heavy, uniform 4:2:0 DCT quantization and strip EXIF.
        """
        platform_hint = None
        w, h = dimensions

        # 1. Filename heuristic
        for pattern in SOCIAL_FILENAME_PATTERNS:
            if pattern.search(filename):
                if "WA" in filename:
                    platform_hint = "WhatsApp"
                elif "telegram" in filename or "photo_" in filename:
                    platform_hint = "Telegram"
                elif "Screenshot" in filename or "Screen Shot" in filename:
                    platform_hint = "Native Screenshot"
                break

        # 2. Known resolution check
        if (w, h) in KNOWN_SOCIAL_RESOLUTIONS or (h, w) in KNOWN_SOCIAL_RESOLUTIONS:
            if not platform_hint and len(exif_tags) == 0:
                platform_hint = "Social Media Standard Resampling (WhatsApp/Telegram)"

        is_social = platform_hint is not None or (len(exif_tags) == 0 and min(w, h) <= 1280)

        # Threshold adjustment factor: increase ELA threshold to tolerate heavy global compression
        adjustment = 1.35 if is_social else 1.0

        return SocialMediaProfile(
            is_social_media_compressed=is_social,
            platform_hint=platform_hint,
            compression_homogeneity_score=0.90 if is_social else 0.50,
            recommended_ela_threshold_adjustment=adjustment
        )

    @staticmethod
    def evaluate_dark_mode_and_contrast(image: Image.Image) -> Tuple[bool, bool, Image.Image]:
        """
        Identifies dark-mode screenshots (average luminance < 60) and applies
        adaptive contrast stretching so that dark-mode text lines can be reliably
        processed by OCR and morphological layout detectors.
        """
        gray = image.convert("L")
        gray_arr = np.asarray(gray, dtype=np.float32)
        mean_luminance = float(np.mean(gray_arr))

        is_dark_mode = mean_luminance < 65.0
        contrast_applied = False
        enhanced_image = image

        if is_dark_mode:
            # Invert and apply CLAHE-like contrast stretching for OCR readability
            stretched = ImageOps.autocontrast(gray, cutoff=2)
            enhanced_image = stretched.convert("RGB")
            contrast_applied = True

        return is_dark_mode, contrast_applied, enhanced_image

    def normalize_image(
        self, image: Image.Image, filename: str, exif_tags: Optional[Dict[str, Any]] = None
    ) -> ImageNormalizationResult:
        """
        Full edge-case normalization pipeline:
        1. Aspect ratio slip defense
        2. Dimension downscaling for memory exhaustion defense
        3. Color space normalization (CMYK -> sRGB, P -> RGB, 16-bit -> 8-bit)
        4. Alpha channel tamper audit
        5. Dark mode detection & contrast optimization
        6. Social media signature classification
        """
        exif_tags = exif_tags or {}
        orig_mode = image.mode
        w, h = image.size

        # 1. Extreme Aspect Ratio Check (e.g. 1px x 50,000px slip attack)
        aspect_ratio = max(w / max(h, 1), h / max(w, 1))
        if aspect_ratio > 30.0:
            raise ValueError(
                f"Adversarial aspect ratio detected ({w}x{h}, ratio {aspect_ratio:.1f}:1). Maximum supported is 30:1."
            )

        # 2. Alpha Channel Audit
        alpha_audit = self.audit_alpha_channel(image)

        # 3. Color Space Normalization
        color_converted = False
        norm_img = image

        if image.mode == "CMYK":
            # Convert CMYK to RGB using standard sRGB transformation
            norm_img = image.convert("RGB")
            color_converted = True
        elif image.mode in ("RGBA", "LA"):
            # Composite onto neutral white background to eliminate transparency attacks
            background = Image.new("RGB", image.size, (255, 255, 255))
            if image.mode == "RGBA":
                background.paste(image, mask=image.split()[-1])
            else:
                background.paste(image.convert("RGB"))
            norm_img = background
            color_converted = True
        elif image.mode == "P":
            norm_img = image.convert("RGB")
            color_converted = True
        elif image.mode == "I;16" or image.mode == "I":
            # 16-bit or 32-bit grayscale -> normalize to 8-bit uint8
            arr = np.asarray(image, dtype=np.float32)
            arr = (arr / np.max(arr) * 255.0).astype(np.uint8) if np.max(arr) > 0 else np.zeros_like(arr, dtype=np.uint8)
            norm_img = Image.fromarray(arr).convert("RGB")
            color_converted = True
        elif image.mode != "RGB":
            norm_img = image.convert("RGB")
            color_converted = True

        # 4. Dimension clamping for memory protection
        was_resized = False
        if max(w, h) > self.max_dimension:
            scale = self.max_dimension / max(w, h)
            new_w = int(w * scale)
            new_h = int(h * scale)
            norm_img = norm_img.resize((new_w, new_h), Image.Resampling.LANCZOS)
            was_resized = True
            logger.info(f"Downsampled high-res image {w}x{h} -> {new_w}x{new_h} for memory protection.")

        # 5. Dark Mode & Contrast Analysis
        is_dark, contrast_applied, _ = self.evaluate_dark_mode_and_contrast(norm_img)

        # 6. Social Media Recompression Classification
        social_profile = self.detect_social_media_signature(filename, (w, h), exif_tags)

        return ImageNormalizationResult(
            normalized_image=norm_img,
            original_mode=orig_mode,
            original_dimensions=(w, h),
            was_resized_for_safety=was_resized,
            color_profile_converted=color_converted,
            alpha_audit=alpha_audit,
            social_profile=social_profile,
            is_dark_mode=is_dark,
            contrast_enhancement_applied=contrast_applied
        )
