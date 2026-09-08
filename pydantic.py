"""
Lightweight Pydantic Compatibility Layer.
Provides seamless fallback when running in minimal container environments without pip,
while automatically delegating to official pydantic when installed.
"""

from __future__ import annotations
import sys

import sys
import os
import importlib

# Attempt to load system pydantic if available in virtualenvs or site-packages
_cur_dir = os.path.dirname(os.path.abspath(__file__))
_saved_path = list(sys.path)
try:
    sys.path = [p for p in sys.path if os.path.abspath(p or ".") != _cur_dir]
    _this_mod = sys.modules.pop("pydantic", None)
    try:
        _real_pydantic = importlib.import_module("pydantic")
    except ImportError:
        _real_pydantic = None
    finally:
        sys.path = _saved_path
        if _real_pydantic is not None:
            sys.modules["pydantic"] = _real_pydantic
        elif _this_mod is not None:
            sys.modules["pydantic"] = _this_mod
except Exception:
    _real_pydantic = None



class BaseModel:
    """Zero-dependency BaseModel compatible with Pydantic v2 model_dump."""
    
    class Config:
        arbitrary_types_allowed = True

    def __init__(self, **kwargs):
        # Apply field defaults from class annotations and attributes
        for cls in reversed(self.__class__.__mro__):
            for attr, val in getattr(cls, "__dict__", {}).items():
                if not attr.startswith("_") and not callable(val):
                    if hasattr(val, "default_factory") and callable(val.default_factory):
                        setattr(self, attr, val.default_factory())
                    elif hasattr(val, "default"):
                        setattr(self, attr, val.default)
                    else:
                        setattr(self, attr, val)
        # Apply kwargs
        for k, v in kwargs.items():
            setattr(self, k, v)

    def model_dump(self, exclude: Optional[set] = None) -> dict:
        exclude = exclude or set()
        result = {}
        for k, v in self.__dict__.items():
            if k.startswith("_") or k in exclude:
                continue
            if isinstance(v, BaseModel):
                result[k] = v.model_dump(exclude=exclude)
            elif isinstance(v, list):
                result[k] = [item.model_dump(exclude=exclude) if isinstance(item, BaseModel) else item for item in v]
            elif isinstance(v, dict):
                result[k] = {
                    dk: dv.model_dump(exclude=exclude) if isinstance(dv, BaseModel) else dv
                    for dk, dv in v.items()
                }
            elif hasattr(v, "value"):  # Enum support
                result[k] = v.value
            else:
                result[k] = v
        return result

    def dict(self, exclude: Optional[set] = None) -> dict:
        return self.model_dump(exclude=exclude)

    def __repr__(self) -> str:
        attrs = ", ".join(f"{k}={v!r}" for k, v in self.__dict__.items() if not k.startswith("_"))
        return f"{self.__class__.__name__}({attrs})"


class _FieldInfo:
    def __init__(self, default=None, default_factory=None, **kwargs):
        self.default = default
        self.default_factory = default_factory
        self.extra = kwargs


def Field(default=None, *, default_factory=None, **kwargs):
    return _FieldInfo(default=default, default_factory=default_factory, **kwargs)

if _real_pydantic is not None:
    for _k, _v in _real_pydantic.__dict__.items():
        globals()[_k] = _v
    if hasattr(_real_pydantic, "__all__"):
        __all__ = _real_pydantic.__all__

