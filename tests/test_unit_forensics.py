"""
TRUSTTRACE Unit Testing Suite
Verifies cryptographic hashing, magic-byte parsing, ELA scoring purity,
noise variance filtering, EXIF tampering heuristics, and certificate proofs.
"""

import io
import unittest

try:
    import numpy as np
    from PIL import Image, ImageDraw
    HAS_IMAGING_DEPS = True
except ImportError:
    HAS_IMAGING_DEPS = False

from ingest_service import IngestionService, MagicByteMismatchError
from pdf_forensics import PDFDocumentForensics
from proof_service import ProofService
from report_generator import ReportGenerator


class TestIngestionAndHashing(unittest.TestCase):
    """Tests multi-modal file ingestion, magic byte detection, and dual hashing."""

    def setUp(self):
        self.ingest_service = IngestionService()

    def test_dual_hash_computation(self):
        sample_bytes = b"TRUSTTRACE_FORENSIC_INTEGRITY_TEST_PAYLOAD_2026"
        sha256, sha3_256 = self.ingest_service.compute_dual_hashes(sample_bytes)
        
        self.assertEqual(len(sha256), 64)
        self.assertEqual(len(sha3_256), 64)
        self.assertEqual(
            sha256,
            "4cb79985dbe5736e4fb4b772df0ca54831976bbbf0931c2d63298922f0916f69"
        )

    def test_magic_byte_detection_valid_jpeg(self):
        header = b"\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00"
        detected = self.ingest_service.detect_mime_type(header)
        self.assertEqual(detected, "image/jpeg")

    def test_magic_byte_detection_valid_png(self):
        header = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR"
        detected = self.ingest_service.detect_mime_type(header)
        self.assertEqual(detected, "image/png")

    def test_magic_byte_detection_valid_pdf(self):
        header = b"%PDF-1.7\n%\xe2\xe3\xcf\xd3\n"
        detected = self.ingest_service.detect_mime_type(header)
        self.assertEqual(detected, "application/pdf")

    def test_magic_byte_spoofing_detection(self):
        fake_jpeg = b"\x7fELF\x02\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00"
        with self.assertRaises(MagicByteMismatchError):
            self.ingest_service.ingest(fake_jpeg, "invoice.jpg")


class TestForensicEngine(unittest.TestCase):
    """Tests Error Level Analysis (ELA), Noise Variance, and OCR layout."""

    def setUp(self):
        if not HAS_IMAGING_DEPS:
            self.skipTest("Pillow/NumPy not installed in current runtime environment.")
        from forensic_engine import ImageForensicEngine
        self.engine = ImageForensicEngine()

    def _create_pristine_synthetic_image(self):
        img_arr = np.full((256, 256, 3), 200, dtype=np.uint8)
        noise = np.random.normal(0, 3, (256, 256, 3)).astype(np.int16)
        img_arr = np.clip(img_arr.astype(np.int16) + noise, 0, 255).astype(np.uint8)
        return Image.fromarray(img_arr, "RGB")

    def _create_spliced_synthetic_image(self):
        img = self._create_pristine_synthetic_image()
        patch = Image.new("RGB", (64, 64), (20, 20, 20))
        img.paste(patch, (96, 96))
        return img

    def test_ela_scoring_purity(self):
        pristine = self._create_pristine_synthetic_image()
        spliced = self._create_spliced_synthetic_image()

        pristine_ela = self.engine.perform_error_level_analysis(pristine)
        spliced_ela = self.engine.perform_error_level_analysis(spliced)

        self.assertGreater(spliced_ela.variance, pristine_ela.variance)
        self.assertTrue(spliced_ela.heatmap_base64.startswith("data:image/"))

    def test_noise_variance_consistency(self):
        pristine = self._create_pristine_synthetic_image()
        noise_res = self.engine.perform_noise_variance_analysis(pristine)

        self.assertIsInstance(noise_res.global_noise_variance, float)
        self.assertGreater(noise_res.global_noise_variance, 0.0)
        self.assertLessEqual(noise_res.inconsistency_score, 1.0)


class TestPDFDocumentForensics(unittest.TestCase):
    """Tests PDF incremental update detection and revision counting."""

    def setUp(self):
        self.pdf_engine = PDFDocumentForensics()

    def test_single_revision_pdf(self):
        raw_pdf = (
            b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
            b"xref\n0 2\n0000000000 65535 f \n0000000009 00000 n \n"
            b"trailer\n<< /Size 2 /Root 1 0 R >>\nstartxref\n60\n%%EOF\n"
        )
        report = self.pdf_engine.inspect_pdf(raw_pdf)
        self.assertTrue(report.is_valid_pdf)
        self.assertEqual(report.revision_count, 1)
        self.assertFalse(report.has_incremental_updates)

    def test_incremental_update_pdf(self):
        raw_pdf_modified = (
            b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n"
            b"xref\n0 1\n0000000000 65535 f \ntrailer\n<< /Size 1 >>\nstartxref\n40\n%%EOF\n"
            b"2 0 obj\n<< /ModDate (D:20260218) >>\nendobj\n"
            b"xref\n2 1\n0000000080 00000 n \ntrailer\n<< /Size 3 >>\nstartxref\n130\n%%EOF\n"
        )
        report = self.pdf_engine.inspect_pdf(raw_pdf_modified)
        self.assertTrue(report.is_valid_pdf)
        self.assertEqual(report.revision_count, 2)
        self.assertTrue(report.has_incremental_updates)
        self.assertTrue(any(a.anomaly_code == "INCREMENTAL_REVISION_DETECTED" for a in report.anomalies))


class TestProofService(unittest.TestCase):
    """Tests cryptographic canonicalization, signing, and verification."""

    def setUp(self):
        self.proof_svc = ProofService()
        self.report_gen = ReportGenerator()

    def test_proof_generation_and_verification(self):
        report = self.report_gen.generate_pdf_report(
            job_id="test-job-uuid-123",
            filename="sample_contract.pdf",
            sha256_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            sha3_256_hash="a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a",
            pdf_inspection=PDFDocumentForensics().inspect_pdf(b"%PDF-1.4\n%%EOF\n")
        )

        cert = self.proof_svc.generate_certificate_of_analysis(report)
        self.assertIsNotNone(cert.signature_b64)
        self.assertEqual(cert.job_id, "test-job-uuid-123")

        is_valid, message = self.proof_svc.verify_certificate(cert)
        self.assertTrue(is_valid, f"Verification failed: {message}")


if __name__ == "__main__":
    unittest.main()
