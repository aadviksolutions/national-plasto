with open(r"C:\Users\acer\.gemini\antigravity-ide\brain\8cc81b85-4c79-48bc-8edf-d7d54430b1fc\.system_generated\steps\772\content.md", "r", encoding="utf-8") as f:
    supreme = f.read()

import re
body_tag = re.search(r'<body[^>]*>', supreme)
print("Body tag in Supreme:", body_tag.group(0) if body_tag else "None")
