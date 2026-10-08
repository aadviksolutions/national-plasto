with open('css/supreme_app.min.css', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

import re
matches = re.findall(r'([^\{\}]*?search_icon[^\{\}]*?\{[^\{\}]*?\})', text)
for m in matches:
    print(m)
