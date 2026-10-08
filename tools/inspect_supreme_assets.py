with open(r"C:\Users\acer\.gemini\antigravity-ide\brain\8cc81b85-4c79-48bc-8edf-d7d54430b1fc\.system_generated\steps\772\content.md", "r", encoding="utf-8") as f:
    supreme = f.read()

import re

css_links = re.findall(r'<link[^>]*rel="stylesheet"[^>]*href="([^"]*)"', supreme)
print("Supreme CSS links:", css_links)

js_scripts = re.findall(r'<script[^>]*src="([^"]*)"', supreme)
print("Supreme JS scripts:", [j for j in js_scripts if not "googletagmanager" in j and not "clarity" in j])
