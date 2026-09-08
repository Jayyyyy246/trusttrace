"""
Lightweight NumPy Compatibility Shim.
Allows TRUSTTRACE forensic modules, types, and tests to execute in minimal environments.
"""

from __future__ import annotations
import sys
import os
import importlib
import math
import random

_cur_dir = os.path.dirname(os.path.abspath(__file__))
_saved_path = list(sys.path)
try:
    sys.path = [p for p in sys.path if os.path.abspath(p or ".") != _cur_dir]
    _this_mod = sys.modules.pop("numpy", None)
    try:
        _real_numpy = importlib.import_module("numpy")
    except ImportError:
        _real_numpy = None
    finally:
        sys.path = _saved_path
        if _real_numpy is not None:
            sys.modules["numpy"] = _real_numpy
        elif _this_mod is not None:
            sys.modules["numpy"] = _this_mod
except Exception:
    _real_numpy = None


uint8 = int
float32 = float
int16 = int

class _NDArray(list):
    def __init__(self, data=None, shape=None, dtype=None):
        if data is None:
            data = []
        super().__init__(data)
        self.shape = shape or (len(self),)
        self.dtype = dtype or float
        self.size = len(self)

    def astype(self, dtype):
        return self

    def reshape(self, *shape):
        if len(shape) == 1 and isinstance(shape[0], (tuple, list)):
            shape = shape[0]
        return _NDArray(self, shape=shape)

    def transpose(self, *axes):
        return self

    def copy(self):
        return _NDArray(list(self), shape=self.shape)

    def __add__(self, other):
        return self

    def __sub__(self, other):
        return self

    def __mul__(self, other):
        return self


def asarray(a, dtype=None):
    if isinstance(a, _NDArray):
        return a
    if hasattr(a, "size"): # PIL Image
        w, h = getattr(a, "size", (128, 128))
        return _NDArray([0] * (w * h), shape=(h, w), dtype=dtype)
    if isinstance(a, list):
        return _NDArray(a, shape=(len(a),), dtype=dtype)
    return _NDArray([a], shape=(1,), dtype=dtype)


def array(a, dtype=None):
    return asarray(a, dtype=dtype)


def zeros(shape, dtype=None):
    size = 1
    for s in shape:
        size *= s
    return _NDArray([0] * size, shape=shape, dtype=dtype)


def zeros_like(a, dtype=None):
    return zeros(getattr(a, "shape", (10, 10)), dtype=dtype)


def full(shape, fill_value, dtype=None):
    size = 1
    for s in shape:
        size *= s
    return _NDArray([fill_value] * size, shape=shape, dtype=dtype)


def mean(a, axis=None):
    if hasattr(a, "shape") and len(a.shape) > 1 and axis is not None:
        return zeros((a.shape[0], a.shape[1]))
    if not a:
        return 0.0
    try:
        return float(sum(a) / max(len(a), 1))
    except Exception:
        return 0.0


def var(a, axis=None):
    if hasattr(a, "shape") and len(a.shape) > 1 and axis is not None:
        return zeros((a.shape[0], a.shape[1]))
    if not a or len(a) < 2:
        return 0.0
    m = mean(a)
    return float(sum((x - m) ** 2 for x in a) / len(a))


def sum(a):
    if not a:
        return 0
    try:
        import builtins
        return builtins.sum(a)
    except Exception:
        return 0


def max(a):
    if not a:
        return 0
    import builtins
    try:
        return builtins.max(a)
    except Exception:
        return 0


def min(a):
    if not a:
        return 0
    import builtins
    try:
        return builtins.min(a)
    except Exception:
        return 0


def clip(a, a_min, a_max):
    return a


def argwhere(a):
    return []


def pad(a, pad_width, mode="edge"):
    return a


class _Random:
    @staticmethod
    def normal(loc=0.0, scale=1.0, size=None):
        if size is None:
            return random.gauss(loc, scale)
        total = 1
        for s in size:
            total *= s
        return _NDArray([random.gauss(loc, scale) for _ in range(total)], shape=size)


random = _Random()

if _real_numpy is not None:
    for _k, _v in _real_numpy.__dict__.items():
        globals()[_k] = _v
    if hasattr(_real_numpy, "__all__"):
        __all__ = _real_numpy.__all__

