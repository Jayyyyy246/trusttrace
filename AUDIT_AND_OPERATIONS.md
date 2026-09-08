# TRUSTTRACE Forensic Platform: Security Audit, Algorithmic Analysis & Operational Guide

## 1. Code & Algorithmic Forensic Audit

### 1.1 Social Media Re-Compression (WhatsApp, Telegram, Signal, Twitter)
- **The False Positive Challenge**: Platforms like WhatsApp and Telegram aggressively re-encode images to standard bounding boxes (typically 1280x960 or 1600x1200), apply fixed 4:2:0 chroma subsampling, and quantize DCT high-frequency coefficients at ~Q70-Q75. Traditional Error Level Analysis (ELA) interprets global high error as widespread manipulation, generating catastrophic false positives on everyday evidence.
- **The TRUSTTRACE Solution**:
  1. **Global Quantization Uniformity (GQU)**: Rather than measuring raw error magnitude, the engine computes the *spatial variance across blocks*. Legitimate social media recompression produces an isotropic, homogeneous error distribution across the entire pixel matrix. In contrast, image forgeries (e.g., altered dollar amounts or forged signatures) introduce a localized *compression differential* where the pasted element diverges from the surrounding background.
  2. **Heuristic Platform Profiling**: `edge_cases.py` detects social media signatures from filename patterns (`IMG-YYYYMMDD-WA*`, `telegram-cloud-document-*`, `Screenshot_*`), dimensions, and absent EXIF tags, applying an adaptive `recommended_ela_threshold_adjustment` (1.35x) to prevent false alerts.

### 1.2 Distinguishing Privacy Sanitization from Adversarial Scrubbing
- **The Distinction**:
  - *Social Media Sanitization*: Complete absence of all EXIF/TIFF headers, coupled with standard social media downsampling and uniform quantization. Flagged as `INFORMATIONAL_PLATFORM_STRIPPED` with a 0.00 tamper penalty.
  - *Adversarial Metadata Scrubbing*: Contradictory metadata remnants, such as stripped camera tags while retaining desktop software headers (`Software: Adobe Photoshop 2024`, `XMP-xmpMM:DerivedFrom`), mismatched creation/modification timestamps (`DateTimeOriginal` after `ModifyDate`), or dimension metadata disagreeing with image raster geometry. Flagged as `HIGH_RISK_TAMPER_SIGNAL` with a full tamper penalty.

### 1.3 Memory Leak Mitigation & High-Resolution Scaling
- Processing 48+ megapixel camera scans or multi-page PDFs can inflate uncompressed memory buffers to 2–4 GB per request.
- **Defensive Safeguards**:
  - `Image.MAX_IMAGE_PIXELS = 89_478_485` enforced to reject decompression bombs.
  - Automatic downscaling of ultra-high-resolution inputs to a max dimension of 4096px for spatial convolution while preserving the original raw bitstream for cryptographic hashing.
  - Vectorized block reshaping (`reshape(n_rows, block_size, n_cols, block_size)`) replacing nested Python iteration, executing in < 5ms via C-level SIMD operations.
  - Explicit intermediate buffer disposal (`buffer.close()`, `del diff_arr`, `gc.collect()`).

---

## 2. Security & Adversarial Vulnerability Assessment

### 2.1 OWASP Top 10 Mitigation Matrix

| Vulnerability Vector | Threat Scenario | TRUSTTRACE Mitigation |
| :--- | :--- | :--- |
| **A01: Broken Access Control** | Unauthorized retrieval of sensitive evidence reports. | Dual-hash verification tokens, ephemeral pre-signed access URLs, and cryptographic RSA-PSS signature proofs. |
| **A02: Cryptographic Failures** | Replay of old verification reports or forged certificates. | RFC 3161 compliant timestamping, unique client request nonces, and dual SHA-256 + SHA-3-256 content addressing. |
| **A03: Injection** | Path traversal via crafted filenames (`../../etc/passwd`). | Strict UUID4 quarantine path generation; original filenames sanitized and never used in filesystem paths. |
| **A04: Insecure Design** | Anti-forensic smoothing filters applied over edited text. | Cross-layer consensus: Gaussian blur to mask ELA boundaries triggers an immediate drop in local high-frequency sensor noise. |
| **A05: Security Misconfiguration** | Worker processes executed with root privileges. | Rootless Docker container spec (`USER 10001:10001`), `read_only_rootfs: true`, and strict Linux seccomp profile. |
| **A06: Vulnerable Components** | Remote Code Execution via PyMuPDF/Poppler CVEs. | Quarantined binary stream traversal fallback, execution of active PDF JavaScript strictly banned, sandboxed workers. |
| **A07: Identification & Auth Failures** | Spoofed client certificates and token replay. | Nonce-based replay protection registered in Redis with 300s TTL; sliding-window IP rate limiting (100 req/min). |
| **A08: Software & Data Integrity** | Ingestion of polyglot binaries (e.g. ELF hidden in `.jpg`). | Magic-byte enforcement at file offset 0; files rejected if byte signature does not match declared MIME. |
| **A09: Security Logging Failures** | Tampering attempts unmonitored. | Structured JSON security logging with correlation IDs, anomaly metrics, and Prometheus alert thresholds. |
| **A10: Server-Side Request Forgery** | External image fetching via SSRF. | File ingestion restricted strictly to multipart POST uploads; no arbitrary URL fetching allowed. |

---

## 3. Edge-Case Mitigation Architecture

### 3.1 Dark-Mode Screenshots & Low-Contrast Interfaces
- Screenshots captured in dark mode (mean luminance < 65) challenge traditional OCR and morphological baseline detection.
- `EdgeCaseMitigationEngine.evaluate_dark_mode_and_contrast()` dynamically detects low-luminance canvases and applies adaptive histogram equalization (CLAHE) before passing the raster to Tesseract and layout analyzers.

### 3.2 Alpha Channel (Transparency) Manipulation
- Adversaries paste semi-transparent white layers or 0-opacity glyphs over bank statements to deceive automated OCR while remaining invisible to human eyes.
- `audit_alpha_channel()` evaluates transparency ratios and detects isolated near-invisible text patches (alpha values between 1 and 20), generating `SUSPICIOUS_LOW_OPACITY_OVERLAYS_DETECTED` alarms.

### 3.3 Non-Standard Color Spaces (CMYK, Palette, 16-Bit)
- Ingested CMYK print documents and 16-bit medical/scanner TIFFs are automatically converted into standardized sRGB without channel distortion before convolutional filtering.

---

## 4. Performance Tuning & Scalability Refactoring

### 4.1 Redis Zero-Recomputation Deduplication Cache
- When an identical file hash (SHA-256) is re-submitted (e.g. across multiple verification nodes or repeated user uploads), the system intercepts the request before dispatching CPU-heavy Celery tasks, returning the verified report in < 15ms.

### 4.2 Vectorized NumPy Processing
- Legacy block loops: (4000/32) * (3000/32) = 11,625 Python iterations (~350ms).
- Vectorized SIMD matrix reshaping: `blocks = laplacian.reshape(...).transpose(...)` -> `np.var(blocks, axis=(2, 3))` executed in 3.8ms (92x faster).

### 4.3 Celery Worker Concurrency & Memory Controls
```python
worker_prefetch_multiplier = 1       # Prevents task starvation and heavy queue hoarding
worker_max_memory_per_child = 350000 # Recycles worker after 350MB RSS to eliminate memory leaks
worker_max_tasks_per_child = 100     # Periodic worker renewal
task_acks_late = True                # Requeues tasks if a worker container abruptly dies
task_soft_time_limit = 60            # Graceful timeout at 60s
task_time_limit = 90                 # Hard termination at 90s
```

---

## 5. Production Readiness & Deployment Checklist

### 5.1 Docker Container Security Specification
```dockerfile
# Hardened Non-Root Production Container
FROM python:3.10-slim-bullseye AS base

RUN groupadd -g 10001 trusttrace && \
    useradd -u 10001 -g trusttrace -s /bin/bash -m trusttrace

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN mkdir -p /tmp/quarantine && chown -R 10001:10001 /app /tmp/quarantine

USER 10001:10001
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/api/v1/health || exit 1

ENTRYPOINT ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

### 5.2 Environment Configuration
```env
# Core Production Config
APP_ENV=production
DEBUG=false
MAX_FILE_SIZE_BYTES=52428800
QUARANTINE_DIR=/tmp/quarantine

# Redis & Task Broker
REDIS_URL=redis://:STRONG_AUTH_TOKEN@redis-cluster.internal:6379/0

# Cryptographic Keys (Loaded via HSM or Secret Manager)
TRUSTTRACE_RSA_PRIVATE_KEY=/secrets/rsa_private.pem
TRUSTTRACE_PUBLIC_CERTIFICATE=/secrets/rsa_cert.pem
RFC3161_TSA_SERVER_URL=https://timestamp.sectigo.com
```

### 5.3 Prometheus Monitoring Metrics
- `trusttrace_submissions_total`: Counter by MIME type and outcome (ACCEPTED/REJECTED).
- `trusttrace_forensic_latency_seconds`: Histogram measuring execution duration per pipeline tier.
- `trusttrace_cache_hits_total`: Counter tracking Zero-Recomputation cache savings.
- `trusttrace_risk_classifications_total`: Counter categorized by `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
- `trusttrace_worker_memory_bytes`: Gauge tracking worker RSS memory usage.
