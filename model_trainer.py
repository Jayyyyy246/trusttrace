"""
TRUSTTRACE Machine Learning Forensic Model Trainer
Generates synthetic and semi-synthetic training datasets of authentic vs. tampered documents,
extracts high-dimensional forensic feature vectors (ELA, Sensor Noise, Metadata, Typography),
trains an ensemble classifier (Random Forest / Gradient Boosting), evaluates accuracy,
and serializes the production model weights.
"""

from __future__ import annotations

import os
import io
import time
import math
import random
import logging
from typing import List, Tuple, Dict, Any

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageChops
import joblib
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("trusttrace.model_trainer")

MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")
MODEL_PATH = os.path.join(MODEL_DIR, "trusttrace_forensic_model.joblib")

FEATURE_NAMES = [
    "ela_mean_error",
    "ela_variance",
    "ela_block_var_max_ratio",
    "ela_spike_count",
    "noise_global_variance",
    "noise_median_variance",
    "noise_min_ratio",
    "noise_max_ratio",
    "noise_anom_block_count",
    "meta_is_stripped",
    "meta_software_flag",
    "meta_chronology_mismatch",
    "layout_baseline_variance",
    "layout_font_size_jumps"
]


class ForensicDatasetGenerator:
    """Generates rigorous synthetic digital evidence samples for model training."""

    def __init__(self, seed: int = 42):
        random.seed(seed)
        np.random.seed(seed)

    def generate_authentic_sample(self) -> Tuple[Image.Image, Dict[str, Any], int]:
        """
        Synthesizes an authentic document (label = 0).
        Exhibits uniform sensor noise, homogeneous ELA compression, and valid layout.
        """
        w, h = 600, 800
        bg_val = random.randint(238, 252)
        img = Image.new("RGB", (w, h), color=(bg_val, bg_val, bg_val))
        draw = ImageDraw.Draw(img)

        # Header bar
        header_h = random.randint(70, 110)
        draw.rectangle([(30, 30), (w - 30, header_h)], fill=(bg_val - 15, bg_val - 15, bg_val - 15))
        draw.text((50, 45), f"VERIFIED INVOICE #{random.randint(10000, 99999)}", fill=(30, 30, 30))

        # Line items
        y = header_h + 40
        num_items = random.randint(3, 7)
        for i in range(num_items):
            item_name = f"Service Item SKU-{i+1}02"
            price = f"${random.randint(50, 1500)}.{random.randint(10, 99)}"
            draw.text((50, y), item_name, fill=(50, 50, 50))
            draw.text((430, y), price, fill=(30, 30, 30))
            y += 45

        # Total
        draw.line([(50, y + 10), (w - 50, y + 10)], fill=(180, 180, 180), width=1)
        draw.text((50, y + 25), "TOTAL BALANCE PAID", fill=(20, 20, 20))
        draw.text((430, y + 25), f"${random.randint(2000, 9500)}.00", fill=(10, 10, 10))

        # Uniform sensor noise (Gaussian / Poisson model)
        arr = np.asarray(img, dtype=np.float32)
        noise_sigma = random.uniform(1.8, 3.5)
        noise = np.random.normal(0, noise_sigma, arr.shape)
        arr = np.clip(arr + noise, 0, 255).astype(np.uint8)
        noisy_img = Image.fromarray(arr, "RGB")

        # Realistic compression (JPEG Q80-Q95 or clean PNG)
        if random.random() > 0.35:
            buf = io.BytesIO()
            noisy_img.save(buf, "JPEG", quality=random.randint(80, 96))
            buf.seek(0)
            final_img = Image.open(buf).convert("RGB")
        else:
            final_img = noisy_img

        meta = {
            "is_stripped": 1 if random.random() < 0.4 else 0,
            "software_flag": 0,
            "chronology_mismatch": 0,
            "baseline_var": random.uniform(0.5, 4.0),
            "font_jumps": 0
        }

        return final_img, meta, 0

    def generate_tampered_sample(self) -> Tuple[Image.Image, Dict[str, Any], int]:
        """
        Synthesizes a forged / tampered document (label = 1).
        Injects spliced values, unnatural flat noise zones, recompression artifacts,
        or deceptive metadata signals.
        """
        # Start from base authentic canvas
        img, meta, _ = self.generate_authentic_sample()
        tampered_img = img.copy()
        draw = ImageDraw.Draw(tampered_img)

        tamper_type = random.choice([
            "spliced_amount",
            "noise_infill_blur",
            "recompression_differential",
            "metadata_editing_suite",
            "misaligned_typography"
        ])

        if tamper_type == "spliced_amount":
            # Paste patch with divergent compression & foreign noise
            pw, ph = random.randint(110, 150), random.randint(30, 42)
            px, py = random.randint(350, 440), random.randint(200, 500)
            patch = Image.new("RGB", (pw, ph), color=(252, 252, 252))
            p_draw = ImageDraw.Draw(patch)
            p_draw.text((8, 8), f"${random.randint(80000, 999999)}.{random.randint(10, 99)}", fill=(10, 10, 10))

            # Severe recompression on patch
            p_buf = io.BytesIO()
            patch.save(p_buf, "JPEG", quality=random.randint(25, 45))
            p_buf.seek(0)
            tampered_patch = Image.open(p_buf)
            tampered_img.paste(tampered_patch, (px, py))

        elif tamper_type == "noise_infill_blur":
            # Adversarial clone or generative infill creates isolated zero-noise patch
            bx, by = random.randint(50, 400), random.randint(150, 550)
            bw, bh = random.randint(80, 160), random.randint(40, 90)
            sub = tampered_img.crop((bx, by, bx + bw, by + bh))
            blurred_sub = sub.filter(ImageFilter.GaussianBlur(radius=random.uniform(2.5, 5.0)))
            tampered_img.paste(blurred_sub, (bx, by))

        elif tamper_type == "recompression_differential":
            # Multi-generation compression disparity
            pw, ph = 140, 45
            px, py = 420, 300
            patch = Image.new("RGB", (pw, ph), color=(245, 245, 245))
            p_draw = ImageDraw.Draw(patch)
            p_draw.text((10, 10), "PAID IN FULL", fill=(150, 20, 20))
            p_buf = io.BytesIO()
            patch.save(p_buf, "JPEG", quality=30)
            p_buf.seek(0)
            tampered_img.paste(Image.open(p_buf), (px, py))

        elif tamper_type == "metadata_editing_suite":
            # Explicit Photoshop / GIMP traces or chronology anomaly
            meta["software_flag"] = 1
            meta["chronology_mismatch"] = 1 if random.random() > 0.5 else 0

        elif tamper_type == "misaligned_typography":
            # Pasted digit offset and font size jump
            draw.text((430, 350), " 9", fill=(15, 15, 15))
            meta["baseline_var"] = random.uniform(14.0, 32.0)
            meta["font_jumps"] = random.randint(1, 3)

        return tampered_img, meta, 1


class ForensicFeatureExtractor:
    """Extracts the 14-dimensional forensic feature vector from an evidence image."""

    @staticmethod
    def extract_features(img: Image.Image, meta: Dict[str, Any], ela_quality: int = 90, block_size: int = 32) -> np.ndarray:
        rgb_img = img.convert("RGB")
        w, h = rgb_img.size

        # --- 1. ELA Extraction ---
        buf = io.BytesIO()
        rgb_img.save(buf, "JPEG", quality=ela_quality)
        buf.seek(0)
        resaved = Image.open(buf)
        diff = ImageChops.difference(rgb_img, resaved)
        buf.close()

        diff_arr = np.asarray(diff, dtype=np.float32)
        ela_mean = float(np.mean(diff_arr))
        ela_variance = float(np.var(diff_arr))

        diff_gray = np.mean(diff_arr, axis=2)
        n_rows = h // block_size
        n_cols = w // block_size

        ela_max_ratio = 1.0
        ela_spikes = 0
        if n_rows > 0 and n_cols > 0:
            cropped_ela = diff_gray[:n_rows * block_size, :n_cols * block_size]
            blocks_ela = cropped_ela.reshape(n_rows, block_size, n_cols, block_size).transpose(0, 2, 1, 3)
            block_vars_ela = np.var(blocks_ela, axis=(2, 3))
            med_ela = float(np.median(block_vars_ela))
            if med_ela > 1e-4:
                ela_ratios = block_vars_ela / med_ela
                ela_max_ratio = float(np.max(ela_ratios))
                ela_spikes = int(np.sum(ela_ratios > 3.5))

        # --- 2. Noise Variance Extraction ---
        gray_arr = np.asarray(rgb_img.convert("L"), dtype=np.float32)
        # 3x3 Laplacian 2nd derivative filter
        padded = np.pad(gray_arr, 1, mode="edge")
        laplacian = (
            padded[:-2, 1:-1] * 1.0 +
            padded[1:-1, :-2] * 1.0 +
            padded[1:-1, 1:-1] * -4.0 +
            padded[1:-1, 2:] * 1.0 +
            padded[2:, 1:-1] * 1.0
        )

        noise_global_var = float(np.var(laplacian))
        noise_median_var = 1.0
        noise_min_ratio = 1.0
        noise_max_ratio = 1.0
        noise_anom_blocks = 0

        if n_rows > 0 and n_cols > 0:
            cropped_noise = laplacian[:n_rows * block_size, :n_cols * block_size]
            blocks_noise = cropped_noise.reshape(n_rows, block_size, n_cols, block_size).transpose(0, 2, 1, 3)
            block_vars_noise = np.var(blocks_noise, axis=(2, 3))
            noise_median_var = float(np.median(block_vars_noise))
            ref_noise = max(noise_median_var, 1e-4)

            noise_ratios = block_vars_noise / ref_noise
            noise_min_ratio = float(np.min(noise_ratios))
            noise_max_ratio = float(np.max(noise_ratios))

            # Anomalous blocks: flat infill (ratio < 0.20) or noisy splice (ratio > 5.0)
            anom_mask = (noise_ratios < 0.20) | (noise_ratios > 5.0)
            noise_anom_blocks = int(np.sum(anom_mask))

        # --- 3. Feature Assembly ---
        features = [
            ela_mean,
            ela_variance,
            ela_max_ratio,
            float(ela_spikes),
            noise_global_var,
            noise_median_var,
            noise_min_ratio,
            noise_max_ratio,
            float(noise_anom_blocks),
            float(meta.get("is_stripped", 0)),
            float(meta.get("software_flag", 0)),
            float(meta.get("chronology_mismatch", 0)),
            float(meta.get("baseline_var", 1.0)),
            float(meta.get("font_jumps", 0))
        ]

        return np.array(features, dtype=np.float32)


class TrustTraceModelTrainer:
    """Orchestrates end-to-end dataset generation, model training, and serialization."""

    def __init__(self, num_samples_per_class: int = 250):
        self.generator = ForensicDatasetGenerator()
        self.extractor = ForensicFeatureExtractor()
        self.num_samples = num_samples_per_class

    def build_dataset(self) -> Tuple[np.ndarray, np.ndarray]:
        logger.info(f"Generating synthetic forensic dataset ({self.num_samples * 2} total samples)...")
        X = []
        y = []

        start_time = time.time()
        # 1. Authentic class
        for i in range(self.num_samples):
            img, meta, label = self.generator.generate_authentic_sample()
            feats = self.extractor.extract_features(img, meta)
            X.append(feats)
            y.append(label)

        # 2. Tampered class
        for i in range(self.num_samples):
            img, meta, label = self.generator.generate_tampered_sample()
            feats = self.extractor.extract_features(img, meta)
            X.append(feats)
            y.append(label)

        elapsed = time.time() - start_time
        logger.info(f"Dataset generated in {elapsed:.2f}s.")
        return np.array(X), np.array(y)

    def train_and_evaluate(self) -> Dict[str, Any]:
        X, y = self.build_dataset()
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42, stratify=y)

        logger.info("Training Random Forest ensemble (100 estimators)...")
        rf = RandomForestClassifier(
            n_estimators=100,
            max_depth=12,
            min_samples_split=4,
            class_weight="balanced",
            random_state=42
        )
        rf.fit(X_train, y_train)

        # Predictions & Metrics
        y_pred = rf.predict(X_test)
        y_prob = rf.predict_proba(X_test)[:, 1]

        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, zero_division=0)
        rec = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        auc = roc_auc_score(y_test, y_prob)
        cm = confusion_matrix(y_test, y_pred).tolist()

        cv_scores = cross_val_score(rf, X, y, cv=5, scoring="accuracy")

        importances = dict(zip(FEATURE_NAMES, rf.feature_importances_.tolist()))

        logger.info("=" * 60)
        logger.info(f" MODEL TRAINING RESULTS")
        logger.info(f" Accuracy:       {acc * 100:.2f}% (CV 5-Fold: {cv_scores.mean() * 100:.2f}% ± {cv_scores.std() * 100:.2f}%)")
        logger.info(f" Precision:      {prec * 100:.2f}%")
        logger.info(f" Recall:         {rec * 100:.2f}%")
        logger.info(f" F1-Score:       {f1 * 100:.2f}%")
        logger.info(f" ROC-AUC:        {auc * 100:.2f}%")
        logger.info("=" * 60)
        logger.info(" Top 5 Discriminative Features:")
        sorted_feats = sorted(importances.items(), key=lambda item: item[1], reverse=True)
        for name, imp in sorted_feats[:5]:
            logger.info(f"  - {name:<26}: {imp * 100:.2f}%")
        logger.info("=" * 60)

        # Save model bundle
        os.makedirs(MODEL_DIR, exist_ok=True)
        bundle = {
            "model": rf,
            "feature_names": FEATURE_NAMES,
            "metrics": {
                "accuracy": round(float(acc), 4),
                "cv_accuracy_mean": round(float(cv_scores.mean()), 4),
                "precision": round(float(prec), 4),
                "recall": round(float(rec), 4),
                "f1_score": round(float(f1), 4),
                "roc_auc": round(float(auc), 4),
                "confusion_matrix": cm,
            },
            "feature_importances": importances,
            "trained_at": time.time(),
            "model_version": "2.4.0-rf-ensemble"
        }

        joblib.dump(bundle, MODEL_PATH)
        logger.info(f"Production model successfully serialized to: {MODEL_PATH}")
        return bundle


if __name__ == "__main__":
    trainer = TrustTraceModelTrainer(num_samples_per_class=250)
    trainer.train_and_evaluate()
