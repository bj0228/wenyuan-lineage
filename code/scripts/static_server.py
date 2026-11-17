#!/usr/bin/env python3
"""Serve vinext public assets with explicit cache policy.

Hashed JS/CSS may be immutable. Catalogue, chapter and runtime-index JSON must be
revalidated on every visit: their URL is stable while the corpus is expanded.
"""

from __future__ import annotations

import argparse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self) -> None:
        path = self.path.split("?", 1)[0]
        if "/assets/" in path:
            self.send_header("Cache-Control", "public, max-age=31536000, immutable")
        elif path.endswith(".json") or "/siku/" in path or "/worldlit/" in path:
            self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
            self.send_header("Pragma", "no-cache")
            self.send_header("Expires", "0")
        else:
            self.send_header("Cache-Control", "no-cache, must-revalidate")
        super().end_headers()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=7861)
    parser.add_argument("--bind", default="0.0.0.0")
    parser.add_argument("--directory", default="dist/client")
    args = parser.parse_args()
    handler = lambda *a, **kw: Handler(*a, directory=args.directory, **kw)  # noqa: E731
    ThreadingHTTPServer((args.bind, args.port), handler).serve_forever()


if __name__ == "__main__":
    main()
