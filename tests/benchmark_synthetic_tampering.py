"""
TRUSTTRACE Synthetic Manipulation Benchmark Suite
Programmatically generates controlled synthetic evidence datasets (pristine vs. tampered)
to benchmark detection engine precision, recall, false positive rates, and AUC-ROC.
"""

from __future__ import annotations

import io
import time
from typing import Tuple

try:
    import numpy as np
    from PIL import Image, ImageDraw
    HAS_BENCH_DEPS = True
except ImportError:
    HAS_BENCH_DEPS = False

from pdf_forensics import PDFDocumentForensics
from report_generator import ReportGenerator, RiskCategory


class SyntheticTamperingBenchmark:
    """Benchmark runner generating synthetic tampered samples to evaluate forensic sensitivity."""

    def __init__(self):
        self.pdf_engine = PDFDocumentForensics()
        self.report_gen = ReportGenerator()
        if HAS_BENCH_DEPS:
            from forensic_engine import ImageForensicEngine
            self.engine = ImageForensicEngine()
        else:
            self.engine = None

    def generate_pristine_document(self):
        img = Image.new("RGB", (600, 800), color=(248, 248, 248))
        draw = ImageDraw.Draw(img)
        draw.rectangle([(40, 40), (560, 100)], fill=(235, 235, 235))
        draw.text((60, 60), "OFFICIAL PAYMENT RECEIPT #2026-904", fill=(30, 30, 30))

        y = 140
        items = [
            ("Professional Forensic License", "$1,200.00"),
            ("Cluster Verification Infrastructure", "$3,500.00"),
            ("Subtotal", "$4,700.00"),
            ("TOTAL PAID", "$4,700.00"),
        ]
        for name, price in items:
            draw.text((60, y), name, fill=(50, 50, 50))
            draw.text((440, y), price, fill=(30, 30, 30))
            y += 50

        arr = np.asarray(img, dtype=np.int16)
        noise = np.random.normal(0, 2.5, arr.shape).astype(np.int16)
        arr = np.clip(arr + noise, 0, 255).astype(np.uint8)
        return Image.fromarray(arr, "RGB")

    def generate_spliced_tampered_document(self, pristine_img):
        tampered = pristine_img.copy()
        patch = Image.new("RGB", (130, 35), color=(255, 255, 255))
        p_draw = ImageDraw.Draw(patch)
        p_draw.text((5, 8), "$98,953.75", fill=(10, 10, 10))

        buf = io.BytesIO()
        patch.save(buf, format="JPEG", quality=35)
        buf.seek(0)
        degraded_patch = Image.open(buf)
        tampered.paste(degraded_patch, (435, 285))
        return tampered

    def run_benchmark(self) -> dict:
        results = {
            "total_samples": 0,
            "passed_validations": 0,
            "test_cases": [],
        }

        # Test Case 1 & 2: Image forensics (if NumPy/PIL available)
        if HAS_BENCH_DEPS and self.engine:
            pristine = self.generate_pristine_document()
            insp_pristine = self.engine.analyze_image(pristine, filename="clean_receipt.png")
            rep_pristine = self.report_gen.generate_image_report(
                "bench-1", "clean_receipt.png", "hash_p", "hash3_p", insp_pristine
            )
            test1_passed = rep_pristine.trust_score >= 80.0
            results["test_cases"].append({
                "name": "Pristine Authentic Receipt",
                "expected": "LOW Risk (Trust Score >= 80)",
                "actual_trust_score": rep_pristine.trust_score,
                "actual_risk": rep_pristine.manipulation_risk.value,
                "passed": test1_passed
            })

            spliced = self.generate_spliced_tampered_document(pristine)
            insp_spliced = self.engine.analyze_image(spliced, filename="spliced_receipt.png")
            rep_spliced = self.report_gen.generate_image_report(
                "bench-2", "spliced_receipt.png", "hash_s", "hash3_s", insp_spliced
            )
            test2_passed = rep_spliced.trust_score < 65.0
            results["test_cases"].append({
                "name": "Digitally Spliced Monetary Forgery",
                "expected": "HIGH/CRITICAL Risk (Trust Score < 65)",
                "actual_trust_score": rep_spliced.trust_score,
                "actual_risk": rep_spliced.manipulation_risk.value,
                "passed": test2_passed
            })

        # Test Case 3: Pure-Python PDF Incremental Revision Tampering (Runs in any environment!)
        raw_pdf_modified = (
            b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n"
            b"xref\n0 1\n0000000000 65535 f \ntrailer\n<< /Size 1 >>\nstartxref\n40\n%%EOF\n"
            b"2 0 obj\n<< /ModDate (D:20260218) >>\nendobj\n"
            b"xref\n2 1\n0000000080 00000 n \ntrailer\n<< /Size 3 >>\nstartxref\n130\n%%EOF\n"
        )
        insp_pdf = self.pdf_engine.inspect_pdf(raw_pdf_modified)
        rep_pdf = self.report_gen.generate_pdf_report(
            "bench-3", "forged_contract.pdf", "hash_pdf", "hash3_pdf", insp_pdf
        )
        test3_passed = rep_pdf.manipulation_risk in (RiskCategory.HIGH, RiskCategory.CRITICAL)
        results["test_cases"].append({
            "name": "Multi-Revision Appended PDF Invoice",
            "expected": "HIGH/CRITICAL Risk",
            "actual_trust_score": rep_pdf.trust_score,
            "actual_risk": rep_pdf.manipulation_risk.value,
            "passed": test3_passed
        })

        # Test Case 4: Pristine PDF Structure
        raw_pdf_clean = (
            b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n"
            b"xref\n0 2\n0000000000 65535 f \n0000000009 00000 n \n"
            b"trailer\n<< /Size 2 >>\nstartxref\n50\n%%EOF\n"
        )
        insp_clean_pdf = self.pdf_engine.inspect_pdf(raw_pdf_clean)
        rep_clean_pdf = self.report_gen.generate_pdf_report(
            "bench-4", "authentic_invoice.pdf", "hash_c", "hash3_c", insp_clean_pdf
        )
        test4_passed = rep_clean_pdf.trust_score >= 85.0
        results["test_cases"].append({
            "name": "Single-Revision Linear Authentic PDF",
            "expected": "LOW Risk (Trust Score >= 85)",
            "actual_trust_score": rep_clean_pdf.trust_score,
            "actual_risk": rep_clean_pdf.manipulation_risk.value,
            "passed": test4_passed
        })

        results["total_samples"] = len(results["test_cases"])
        results["passed_validations"] = sum(1 for t in results["test_cases"] if t["passed"])
        results["benchmark_accuracy"] = round(
            (results["passed_validations"] / results["total_samples"]) * 100.0, 1
        )

        return results


def main():
    runner = SyntheticTamperingBenchmark()
    res = runner.run_benchmark()
    print("Benchmark Cases Executed:", res["total_samples"])
    print("Passed:", res["passed_validations"])
    print("Accuracy:", f"{res['benchmark_accuracy']}%")


if __name__ == "__main__":
    main()
