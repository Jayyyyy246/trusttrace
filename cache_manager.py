"""
TRUSTTRACE Deduplication Cache & Replay Protection Engine
Manages Redis-backed caching for identical file hash lookups (Zero-Recomputation),
sliding-window rate limiting, and cryptographic nonce tracking to prevent replay attacks.
"""

from __future__ import annotations

import os
import json
import time
import logging
from collections import OrderedDict
from typing import Dict, Any, Optional

logger = logging.getLogger("trusttrace.cache")

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/1")

# Optional redis import
try:
    import redis
    HAS_REDIS = True
except ImportError:
    HAS_REDIS = False


class InMemoryLRUCache:
    """Thread-safe bounded in-memory LRU cache fallback."""

    def __init__(self, capacity: int = 1000, default_ttl: int = 86400):
        self.capacity = capacity
        self.default_ttl = default_ttl
        self._store: OrderedDict[str, Tuple[float, Any]] = OrderedDict()

    def get(self, key: str) -> Optional[Any]:
        if key not in self._store:
            return None
        expire_at, value = self._store[key]
        if time.time() > expire_at:
            del self._store[key]
            return None
        self._store.move_to_end(key)
        return value

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        ttl = ttl or self.default_ttl
        expire_at = time.time() + ttl
        if key in self._store:
            self._store.move_to_end(key)
        self._store[key] = (expire_at, value)
        if len(self._store) > self.capacity:
            self._store.popitem(last=False)


class CacheManager:
    """Production caching layer for file deduplication and replay defense."""

    def __init__(self):
        self.redis_client = None
        self.local_cache = InMemoryLRUCache(capacity=2000, default_ttl=86400)
        self.rate_limit_cache = InMemoryLRUCache(capacity=5000, default_ttl=60)
        self.nonce_cache = InMemoryLRUCache(capacity=10000, default_ttl=600)

        if HAS_REDIS:
            try:
                r = redis.from_url(REDIS_URL, socket_timeout=1.5)
                r.ping()
                self.redis_client = r
                logger.info(f"Connected to Redis cache at {REDIS_URL}")
            except Exception as e:
                logger.warning(f"Redis cache unavailable ({e}). Defaulting to in-memory LRU cache.")

    def get_cached_report(self, sha256_hash: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves pre-computed forensic report for an identical bitstream hash.
        Bypasses CPU-heavy ELA and OCR pipeline when evidence was already verified.
        """
        cache_key = f"trusttrace:report:{sha256_hash}"
        if self.redis_client:
            try:
                cached = self.redis_client.get(cache_key)
                if cached:
                    logger.info(f"Deduplication Cache HIT for hash {sha256_hash[:16]}...")
                    return json.loads(cached)
            except Exception as e:
                logger.warning(f"Redis get failed: {e}")

        # Fallback to local memory
        val = self.local_cache.get(cache_key)
        if val:
            logger.info(f"Local Memory Cache HIT for hash {sha256_hash[:16]}...")
        return val

    def set_cached_report(
        self, sha256_hash: str, report_data: Dict[str, Any], ttl_seconds: int = 86400
    ) -> None:
        """Stores verified report under evidence SHA-256 key."""
        cache_key = f"trusttrace:report:{sha256_hash}"
        self.local_cache.set(cache_key, report_data, ttl=ttl_seconds)

        if self.redis_client:
            try:
                self.redis_client.setex(cache_key, ttl_seconds, json.dumps(report_data))
            except Exception as e:
                logger.warning(f"Redis set failed: {e}")

    def check_rate_limit(
        self, client_ip: str, max_requests: int = 60, window_seconds: int = 60
    ) -> bool:
        """
        Sliding-window rate limiter per client IP.
        Returns True if request is ALLOWED, False if limit exceeded.
        """
        now = time.time()
        key = f"ratelimit:{client_ip}"

        if self.redis_client:
            try:
                pipe = self.redis_client.pipeline()
                pipe.zremrangebyscore(key, 0, now - window_seconds)
                pipe.zadd(key, {str(now): now})
                pipe.zcard(key)
                pipe.expire(key, window_seconds)
                _, _, req_count, _ = pipe.execute()
                return req_count <= max_requests
            except Exception as e:
                logger.warning(f"Redis rate limit fallback: {e}")

        # In-memory sliding window fallback
        timestamps = self.rate_limit_cache.get(key) or []
        recent = [t for t in timestamps if t > now - window_seconds]
        if len(recent) >= max_requests:
            return False
        recent.append(now)
        self.rate_limit_cache.set(key, recent, ttl=window_seconds)
        return True

    def validate_and_register_nonce(self, nonce: str, max_age_seconds: int = 300) -> bool:
        """
        Anti-Replay defense for verification requests.
        Ensures a report request nonce has not been previously executed.
        """
        key = f"nonce:{nonce}"
        if self.redis_client:
            try:
                # setnx returns 1 if key was set, 0 if it already existed
                was_set = self.redis_client.set(key, "1", nx=True, ex=max_age_seconds)
                return bool(was_set)
            except Exception as e:
                logger.warning(f"Redis nonce set failed: {e}")

        if self.nonce_cache.get(key):
            return False  # Nonce replayed!
        self.nonce_cache.set(key, "1", ttl=max_age_seconds)
        return True


# Global shared instance
cache_mgr = CacheManager()
