with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

import re

# Find head css links
css_links = re.findall(r'<link[^>]*rel="stylesheet"[^>]*href="([^"]*)"', html)
print("CSS links in index.html:", css_links)

# Find JS scripts at bottom
js_scripts = re.findall(r'<script[^>]*src="([^"]*)"', html)
print("JS scripts in index.html:", js_scripts)
