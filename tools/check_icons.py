import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

icons = set(re.findall(r'<i\s+class="([^"]+)"', content))
print("Icons found in index.html:")
for ic in sorted(icons):
    print(" -", ic)
