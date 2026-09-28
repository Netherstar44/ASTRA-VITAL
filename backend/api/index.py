"""Vercel Python function entrypoint.

Set the Vercel project root to ``backend``. Vercel discovers this module at
``api/index.py`` and serves the exported ASGI ``app``.
"""

from backend.app import app

__all__ = ["app"]