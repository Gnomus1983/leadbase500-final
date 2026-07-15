#!/usr/bin/env python3
import json
import re
import sys
from collections import Counter
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "leads_verified.json"
HTML = ROOT / "LeadBase_500_verified.html"
ALLOWED_NICHES = {
    "dentistry", "beauty", "nails", "barber", "fitness", "yoga", "bakery",
    "coffee", "confectionery", "furniture", "kitchens", "doors", "windows",
    "plumbing", "renovation", "interior", "kids", "courses", "veterinary",
    "grooming", "detailing", "autoservice", "craft", "psychology"
}
REQUIRED = [
    "id", "name", "niche", "locality", "source_urls", "website_status",
    "website_checks", "verified_at", "activity_evidence", "confidence",
    "purchase_score", "recommended_approach"
]


def fail(errors):
    if errors:
        print("Validation failed:")
        for err in errors:
            print(f"- {err}")
        sys.exit(1)
    print("Validation passed.")


def valid_url(value):
    parsed = urlparse(value)
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)


def norm_phone(value):
    return re.sub(r"\D", "", value or "")


def main():
    errors = []
    leads = json.loads(DATA.read_text(encoding="utf-8"))

    if len(leads) != 574:
        errors.append(f"expected 574 leads, found {len(leads)}")

    ids = Counter(x.get("id", "") for x in leads)
    for item, count in ids.items():
        if count > 1:
            errors.append(f"duplicate id: {item}")

    phones = Counter()
    socials = Counter()
    name_address = Counter()
    for lead in leads:
        for field in REQUIRED:
            if field not in lead or lead[field] in ("", None, [], {}):
                errors.append(f"{lead.get('id', lead.get('name'))}: missing required field {field}")

        if lead.get("website_status") != "verified_no_site":
            errors.append(f"{lead.get('id')}: website_status is not verified_no_site")

        if lead.get("niche") not in ALLOWED_NICHES:
            errors.append(f"{lead.get('id')}: invalid niche {lead.get('niche')}")

        if len(lead.get("source_urls", [])) < 2:
            errors.append(f"{lead.get('id')}: fewer than 2 source_urls")

        if len(lead.get("website_checks", [])) < 6:
            errors.append(f"{lead.get('id')}: fewer than 6 website checks")

        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", lead.get("verified_at", "")):
            errors.append(f"{lead.get('id')}: invalid verified_at")

        if re.search(r"\b(example|test)\b|не найден", json.dumps(lead, ensure_ascii=False), re.I):
            errors.append(f"{lead.get('id')}: contains forbidden placeholder-like value")

        for url_field in ["instagram", "facebook", "tiktok", "telegram", "maps_url"]:
            value = lead.get(url_field)
            if value and not valid_url(value):
                errors.append(f"{lead.get('id')}: invalid URL in {url_field}: {value}")

        for url in lead.get("source_urls", []) + lead.get("directory_urls", []):
            if not valid_url(url):
                errors.append(f"{lead.get('id')}: invalid source URL: {url}")

        for phone in lead.get("phone", []):
            digits = norm_phone(phone)
            if "***" in phone or len(digits) < 8:
                errors.append(f"{lead.get('id')}: masked or invalid phone {phone}")
            if re.search(r"(000000|111111|123456)", digits):
                errors.append(f"{lead.get('id')}: test-like phone {phone}")
            phones[digits] += 1

        address = lead.get("address", "")
        if "********" in address or re.search(r"\bSt\*+", address):
            errors.append(f"{lead.get('id')}: masked address")

        for social in [lead.get("instagram"), lead.get("facebook")]:
            if social:
                socials[social.rstrip("/").lower()] += 1

        key = (lead.get("name", "").strip().lower(), lead.get("address", "").strip().lower())
        name_address[key] += 1

    for phone, count in phones.items():
        if phone and count > 1:
            errors.append(f"duplicate phone: {phone}")
    for social, count in socials.items():
        if social and count > 1:
            errors.append(f"duplicate social URL: {social}")
    for key, count in name_address.items():
        if key[0] and key[1] and count > 1:
            errors.append(f"duplicate name+address: {key}")

    if HTML.exists():
        html = HTML.read_text(encoding="utf-8")
        embedded = re.search(r'<script id="embeddedLeads" type="application/json">(.*?)</script>', html, re.S)
        if not embedded:
            errors.append("HTML embedded leads block not found")
        else:
            html_count = len(json.loads(embedded.group(1)))
            if html_count != len(leads):
                errors.append(f"HTML lead count {html_count} does not match JSON {len(leads)}")
    else:
        errors.append("LeadBase_500_verified.html not found")

    fail(errors)


if __name__ == "__main__":
    main()
