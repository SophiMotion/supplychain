"""Import an existing trusted lightweight offline ZIP into this static site.

Usage: python scripts/import_snapshot.py PATH_TO_LIGHTWEIGHT_ZIP
Only referenced local media and sanitized JSON are copied. Source ZIP is untouched.
"""
import json
import re
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main():
    archive_path = Path(sys.argv[1]).resolve(strict=True)
    with zipfile.ZipFile(archive_path) as archive:
        html = archive.read("index.html").decode("utf-8-sig")
        match = re.search(r'<script\b[^>]*\bid=["\']offline-catalog["\'][^>]*>(.*?)</script>', html, re.S)
        if not match:
            raise ValueError("ZIP has no embedded offline-catalog JSON")
        catalog = json.loads(match.group(1))
        companies = catalog["exhibitors"]
        media_paths = set()
        for company in companies:
            company.pop("contacts", None)
            for media in [company.get("logo"), *company.get("images", [])]:
                if not media or not media.get("url"):
                    continue
                path = media["url"]
                if not re.fullmatch(r"assets/light-image-\d+\.(?:webp|png|jpe?g|gif)", path):
                    raise ValueError("Unexpected media path; import aborted")
                media_paths.add(path)
        if len({company["id"] for company in companies}) != len(companies):
            raise ValueError("Duplicate company IDs")
        # Validate the archive allowlist before writing any data.
        for path in sorted(media_paths):
            info = archive.getinfo(path)
            if info.file_size > 100 * 1024 * 1024:
                raise ValueError("Oversized media")
        for path in sorted(media_paths):
            destination = ROOT / "public" / path
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_bytes(archive.read(path))
        data_path = ROOT / "public" / "data" / "exhibitors.json"
        data_path.parent.mkdir(parents=True, exist_ok=True)
        data_path.write_text(json.dumps(catalog, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
        print(json.dumps({"companies": len(companies), "media_files": len(media_paths), "generated_at": catalog["generatedAt"], "contacts_removed": True}))


if __name__ == "__main__":
    main()
