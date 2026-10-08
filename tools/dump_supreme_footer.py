with open(r"C:\Users\acer\.gemini\antigravity-ide\brain\8cc81b85-4c79-48bc-8edf-d7d54430b1fc\.system_generated\steps\772\content.md", "r", encoding="utf-8") as f:
    supreme = f.read()

import re
footer = re.search(r'<footer[^>]*>.*?</footer>', supreme, flags=re.DOTALL)
if footer:
    with open("supreme_sections/19_footer.html", "w", encoding="utf-8") as out:
        out.write(footer.group(0))
    print("Wrote supreme_sections/19_footer.html, length:", len(footer.group(0)))
