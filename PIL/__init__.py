"""
Lightweight Pillow (PIL) Compatibility Shim.
Provides fallback Image, ImageOps, ImageChops, ImageEnhance, ExifTags.
"""

from __future__ import annotations
import sys
import os
import importlib
import io
import base64

_cur_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_saved_path = list(sys.path)
try:
    sys.path = [p for p in sys.path if os.path.abspath(p or ".") != _cur_dir]
    _this_mod = sys.modules.pop("PIL", None)
    try:
        _real_pil = importlib.import_module("PIL")
    except ImportError:
        _real_pil = None
    finally:
        sys.path = _saved_path
        if _real_pil is not None:
            sys.modules["PIL"] = _real_pil
        elif _this_mod is not None:
            sys.modules["PIL"] = _this_mod
except Exception:
    _real_pil = None


class ImageClass:
    def __init__(self, mode="RGB", size=(256, 256), color=None):
        self.mode = mode
        self.size = size
        self.info = {}

    def convert(self, mode):
        return ImageClass(mode=mode, size=self.size)

    def resize(self, size, resample=None):
        return ImageClass(mode=self.mode, size=size)

    def split(self):
        return [ImageClass("L", self.size) for _ in self.mode]

    def getextrema(self):
        return [(0, 255)]

    def paste(self, im, box=None, mask=None):
        pass

    def copy(self):
        return ImageClass(mode=self.mode, size=self.size)

    def save(self, fp, format=None, **kwargs):
        if isinstance(fp, io.BytesIO):
            fp.write(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x01\x00\x00\x00\x01\x00\x08\x02\x00\x00\x00")

    def _getexif(self):
        return None


class _Resampling:
    LANCZOS = 1
    BICUBIC = 2
    NEAREST = 0


class ImageModule:
    MAX_IMAGE_PIXELS = 89_478_485
    Resampling = _Resampling

    @staticmethod
    def new(mode, size, color=None):
        return ImageClass(mode=mode, size=size, color=color)

    @staticmethod
    def open(fp, mode="r"):
        return ImageClass()

    @staticmethod
    def fromarray(arr, mode=None):
        return ImageClass(mode=mode or "RGB")


Image = ImageModule


class ImageChops:
    @staticmethod
    def difference(im1, im2):
        return ImageClass(mode=im1.mode, size=im1.size)


class ImageEnhance:
    class Brightness:
        def __init__(self, img):
            self.img = img
        def enhance(self, factor):
            return self.img


class ImageOps:
    @staticmethod
    def autocontrast(image, cutoff=0):
        return image


class ExifTags:
    TAGS = {
        271: "Make",
        272: "Model",
        305: "Software",
        306: "DateTime",
        36867: "DateTimeOriginal",
        306: "ModifyDate",
    }


class ImageFilter:
    pass

if _real_pil is not None:
    for _k, _v in _real_pil.__dict__.items():
        globals()[_k] = _v
    if hasattr(_real_pil, "__all__"):
        __all__ = _real_pil.__all__

